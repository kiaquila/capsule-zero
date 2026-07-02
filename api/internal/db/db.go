// Package db owns the Postgres connection pool and the boot-time migrator.
package db

import (
	"context"
	"fmt"
	"io/fs"
	"sort"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

// NewPool opens a pgx connection pool and verifies connectivity with a ping.
func NewPool(ctx context.Context, url string) (*pgxpool.Pool, error) {
	pool, err := pgxpool.New(ctx, url)
	if err != nil {
		return nil, fmt.Errorf("open pool: %w", err)
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("ping: %w", err)
	}
	return pool, nil
}

// migrationLockKey identifies the boot migrator's Postgres advisory lock. One
// constant for the whole app database: concurrent API replicas serialize their
// entire migration run against it, not individual files.
const migrationLockKey = int64(0x435a6d6967720034) // "CZmigr" + spec 034

// Migrate applies every *.sql file in the embedded filesystem in lexical order,
// tracking applied versions in schema_migrations. Already-applied files are
// skipped, so a repeat boot on an up-to-date database is a no-op. Each file
// runs inside its own transaction together with the version bookkeeping, so a
// failed migration leaves no partial version recorded. The whole run holds a
// session-scoped advisory lock so concurrently booting replicas serialize; the
// lock lives on one dedicated pooled connection because Postgres ties advisory
// locks to the session that took them.
func Migrate(ctx context.Context, pool *pgxpool.Pool, files fs.FS) error {
	conn, err := pool.Acquire(ctx)
	if err != nil {
		return fmt.Errorf("acquire migration connection: %w", err)
	}
	defer conn.Release()

	return withMigrationLock(ctx, conn, func() error {
		return applyAll(ctx, conn, files)
	})
}

// withMigrationLock runs body between pg_advisory_lock and pg_advisory_unlock
// on the same executor. The unlock always runs — a failed migration must not
// leave the lock held on a connection that returns to the pool.
func withMigrationLock(ctx context.Context, ex sqlExecutor, body func() error) error {
	if _, err := ex.Exec(ctx, `SELECT pg_advisory_lock($1)`, migrationLockKey); err != nil {
		return fmt.Errorf("acquire migration lock: %w", err)
	}
	bodyErr := body()
	if _, err := ex.Exec(ctx, `SELECT pg_advisory_unlock($1)`, migrationLockKey); err != nil && bodyErr == nil {
		return fmt.Errorf("release migration lock: %w", err)
	}
	return bodyErr
}

// migrationConn is the slice of pgxpool.Conn the migrator needs; a dedicated
// single connection keeps the advisory lock and every migration statement in
// one session.
type migrationConn interface {
	sqlExecutor
	QueryRow(context.Context, string, ...any) pgx.Row
	Begin(context.Context) (pgx.Tx, error)
}

func applyAll(ctx context.Context, conn migrationConn, files fs.FS) error {
	if _, err := conn.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version    TEXT PRIMARY KEY,
			applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
		)`); err != nil {
		return fmt.Errorf("ensure schema_migrations: %w", err)
	}

	entries, err := fs.ReadDir(files, ".")
	if err != nil {
		return fmt.Errorf("read migrations: %w", err)
	}

	versions := make([]string, 0, len(entries))
	for _, entry := range entries {
		name := entry.Name()
		if !entry.IsDir() && len(name) > 4 && name[len(name)-4:] == ".sql" {
			versions = append(versions, name)
		}
	}
	sort.Strings(versions)

	for _, version := range versions {
		if err := applyOne(ctx, conn, files, version); err != nil {
			return fmt.Errorf("apply %s: %w", version, err)
		}
	}
	return nil
}

func applyOne(ctx context.Context, conn migrationConn, files fs.FS, version string) error {
	var exists bool
	if err := conn.QueryRow(ctx,
		`SELECT EXISTS (SELECT 1 FROM schema_migrations WHERE version = $1)`,
		version,
	).Scan(&exists); err != nil {
		return err
	}
	if exists {
		return nil
	}

	sqlBytes, err := fs.ReadFile(files, version)
	if err != nil {
		return err
	}

	tx, err := conn.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if err := execMigrationSQL(ctx, tx, string(sqlBytes)); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx,
		`INSERT INTO schema_migrations (version) VALUES ($1)`, version,
	); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

type sqlExecutor interface {
	Exec(context.Context, string, ...any) (pgconn.CommandTag, error)
}

func execMigrationSQL(ctx context.Context, tx sqlExecutor, sql string) error {
	_, err := tx.Exec(ctx, sql, pgx.QueryExecModeSimpleProtocol)
	return err
}
