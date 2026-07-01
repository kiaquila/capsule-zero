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
