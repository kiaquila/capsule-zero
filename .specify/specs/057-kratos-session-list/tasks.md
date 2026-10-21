# Tasks 057 — Real Kratos session inventory

- [ ] Commit failing tests.
- [ ] Implement existing auth/API/profile path and update contracts/docs.
- [ ] Run focused and repository checks.
- [ ] Native review, required gates, stable-ready wait, merge and production CD verification.

## Process Memory

### Dead Ends

Context7 quota exhausted; inspected deployed version's official OpenAPI and handler instead. GET /sessions alone omits the current session. Device records describe API connections, so interpreting them as a user's hardware or activity would be misleading.

### Decisions

Use public token-scoped API; combine WhoAmI with other sessions, preserve pagination on fixed origin, project an explicit metadata allowlist. Reuse profile styles and signed-token provider. No new infrastructure or provider dependencies.

### Known Issues

No session revocation or trustworthy browser metadata in this slice. Unsupported providers and inventory failures retain unavailable copy. Authentication dates are not last activity. Delivery evidence belongs to the linked PR.
