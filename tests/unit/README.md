# Unit tests (Go API)

Stub folder. Populated when the Go modular monolith from `.specify/specs/024-production-stack-runtime/` lands its first product code.

## When the first Go code arrives

- Use `go test ./tests/unit/...` as the entry from CI.
- Per-package, table-driven tests (`TestXxx(t *testing.T)` with `tests := []struct{ name string; … }{...}`).
- Test data and fixture builders live in `tests/unit/internal/` so they are not exported.
- A failing unit test MUST be committed BEFORE the production code that makes it pass — see `tests/README.md` TDD section.

Until that lands, this folder exists so:

- Future agents know exactly where backend unit tests go.
- `git grep` for "tests/unit" finds the canonical location, not a guess.
