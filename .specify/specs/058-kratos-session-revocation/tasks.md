# Tasks 058

- [ ] Commit failing behavior tests
- [ ] Implement contract, backend, provider, actions and UI
- [ ] Update durable docs and verify locally/against disposable Kratos
- [ ] Native review, required gates and stable readiness
- [ ] Normal merge and production CD/live verification

## Process Memory

### Dead Ends

Context7 monthly quota exhausted; use pinned official Kratos source and bundled Next docs.

### Decisions

Use token-scoped public DELETE /sessions/{id} and DELETE /sessions. Kratos rejects the current ID and binds both writes to the caller; our boundary rejects current explicitly too. Bulk uses the atomic native endpoint, not inventory iteration.

### Known Issues

None accepted yet. Unsupported/frozen providers retain unavailable inventory and expose no mutation controls.
