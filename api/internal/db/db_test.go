package db

import (
	"context"
	"errors"
	"testing"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

func TestExecMigrationSQLUsesSimpleProtocol(t *testing.T) {
	tx := &recordingExecutor{}

	if err := execMigrationSQL(context.Background(), tx, "CREATE TABLE a(id int); CREATE TABLE b(id int);"); err != nil {
		t.Fatalf("execMigrationSQL returned error: %v", err)
	}

	if tx.sql == "" {
		t.Fatal("Exec was not called")
	}
	if len(tx.args) != 1 {
		t.Fatalf("Exec args = %d, want 1", len(tx.args))
	}
	if tx.args[0] != pgx.QueryExecModeSimpleProtocol {
		t.Fatalf("Exec mode = %#v, want QueryExecModeSimpleProtocol", tx.args[0])
	}
}

func TestExecMigrationSQLReturnsExecError(t *testing.T) {
	want := errors.New("boom")
	tx := &recordingExecutor{err: want}

	if err := execMigrationSQL(context.Background(), tx, "SELECT 1"); !errors.Is(err, want) {
		t.Fatalf("error = %v, want %v", err, want)
	}
}

type recordingExecutor struct {
	sql  string
	args []any
	err  error
}

func (r *recordingExecutor) Exec(_ context.Context, sql string, args ...any) (pgconn.CommandTag, error) {
	r.sql = sql
	r.args = args
	return pgconn.CommandTag{}, r.err
}

// The boot migrator must serialize concurrent replicas behind a Postgres
// advisory lock (spec 034 acceptance 4): without it two API containers booting
// at once can interleave migration application. The lock must be taken and
// released around the migration body with the single package-wide key.
func TestMigrationLockWrapsBody(t *testing.T) {
	ex := &callRecordingExecutor{}
	bodyRan := false

	err := withMigrationLock(context.Background(), ex, func() error {
		ex.calls = append(ex.calls, "body")
		bodyRan = true
		return nil
	})
	if err != nil {
		t.Fatalf("withMigrationLock returned error: %v", err)
	}
	if !bodyRan {
		t.Fatal("migration body did not run")
	}

	want := []string{
		"SELECT pg_advisory_lock($1)",
		"body",
		"SELECT pg_advisory_unlock($1)",
	}
	if len(ex.calls) != len(want) {
		t.Fatalf("calls = %v, want %v", ex.calls, want)
	}
	for i := range want {
		if ex.calls[i] != want[i] {
			t.Fatalf("call %d = %q, want %q", i, ex.calls[i], want[i])
		}
	}
	for _, args := range ex.args {
		if len(args) != 1 || args[0] != migrationLockKey {
			t.Fatalf("lock args = %v, want [%d]", args, migrationLockKey)
		}
	}
}

// The advisory lock must be released even when the migration body fails, so a
// crashed migration on one replica does not deadlock every later boot that
// lands on the same pooled connection.
func TestMigrationLockReleasesOnBodyError(t *testing.T) {
	ex := &callRecordingExecutor{}
	want := errors.New("boom")

	err := withMigrationLock(context.Background(), ex, func() error { return want })
	if !errors.Is(err, want) {
		t.Fatalf("error = %v, want %v", err, want)
	}
	if len(ex.calls) != 2 || ex.calls[1] != "SELECT pg_advisory_unlock($1)" {
		t.Fatalf("calls = %v, want lock + unlock", ex.calls)
	}
}

type callRecordingExecutor struct {
	calls []string
	args  [][]any
}

func (c *callRecordingExecutor) Exec(_ context.Context, sql string, args ...any) (pgconn.CommandTag, error) {
	c.calls = append(c.calls, sql)
	c.args = append(c.args, args)
	return pgconn.CommandTag{}, nil
}
