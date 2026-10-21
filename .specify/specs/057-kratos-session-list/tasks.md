# Tasks 057 — Real Kratos session inventory

- [x] Commit failing tests (`3b546a3`).
- [x] Implement existing auth/API/profile path and update contracts/docs.
- [x] Run focused and repository checks, including disposable real Kratos smoke.
- [ ] Native review, required gates, stable-ready wait, merge and production CD verification.

## Process Memory

### Dead Ends

Context7 quota exhausted; inspected deployed version's official OpenAPI and handler instead. GET /sessions alone omits the current session. Device records describe API connections, so interpreting them as a user's hardware or activity would be misleading.

### Decisions

Use public token-scoped API; combine WhoAmI with other sessions, preserve pagination on fixed origin, project an explicit metadata allowlist. Reuse profile styles and signed-token provider. No new infrastructure or provider dependencies.

### Known Issues

No session revocation or trustworthy browser metadata in this slice. Unsupported providers and inventory failures retain unavailable copy. Authentication dates are not last activity. Delivery evidence belongs to the linked PR.

The versioned Kratos handler uses Link pagination with `per_page`; tests use a nonsequential next page. Existing profile optional-data tests remain green. No device capture or admin access was added.

Real Kratos v26.2.0 smoke found that a zero-total empty list still carries an optimistic next Link. Regression committed in `c56784a`; only an empty decoded page AND explicit `X-Total-Count: 0` stops this traversal. Other empty pages continue following Link.
