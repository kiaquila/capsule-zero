# Tasks 058

- [x] Commit failing behavior tests
- [x] Implement contract, backend, provider, actions and UI
- [x] Update durable docs and verify locally/against disposable Kratos
- [ ] Native review, required gates and stable readiness
- [ ] Normal merge and production CD/live verification

## Process Memory

### Dead Ends

The first disposable smoke disproved a 404 assumption for foreign sessions: v26.2.0 returns 204 without affecting the foreign token. Corrected tests/docs to this idempotent public contract rather than adding an unnecessary inventory preflight.

Context7 monthly quota exhausted; use pinned official Kratos source and bundled Next docs.

### Decisions

The complete authentication-before-revocation path now reuses non-redirecting session transport. Regression ffd6e80 demonstrated that default WhoAmI HTTP redirect behavior forwarded the custom token header; no token-bearing session request follows redirects.

Browser smoke exposed server/WebKit ICU punctuation differences in EN timestamps. Regression e2a17b1 fails on pageerror before the fix. Serialize localized UTC labels from the existing server snapshot; keep ISO datetime attributes and API DTO unchanged. Wait for the existing password-form hydration signal before editing fields. Add the isolated browser smoke to the required test workflow.

Use token-scoped public DELETE /sessions/{id} and DELETE /sessions. Kratos rejects the current ID and binds both writes to the caller; our boundary rejects current explicitly too. Bulk uses the atomic native endpoint, not inventory iteration.

### Known Issues

No blocking local issue. Unsupported/frozen providers retain unavailable inventory and expose no mutation controls.
