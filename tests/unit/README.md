# Unit tests (reserved cross-package area)

The Go API has landed, and its unit tests are intentionally co-located with
the packages under `api/**`. The canonical local/CI entry is:

```bash
cd api
go vet ./...
go test ./...
```

Keep package-specific table-driven tests beside their code. Use this folder
only if a future spec introduces a genuine repository-level integration suite
that cannot live inside the `api` module; do not create duplicate test helpers
or a second Go module here. The failing-test-first contract for application
code remains in `tests/README.md`.
