// Package migrations embeds the SQL migration files applied at API boot.
package migrations

import "embed"

// FS holds the ordered SQL migration files. They are applied in lexical order
// by internal/db.Migrate, which tracks applied versions in schema_migrations
// so a repeat boot is a no-op (idempotent — negative scenario 6).
//
//go:embed *.sql
var FS embed.FS
