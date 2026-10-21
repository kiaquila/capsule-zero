# Plan 058 — Session revocation

## Approach

Commit failing Go/client/action/render tests, implement through the existing public-token boundary, verify with disposable Kratos, then deliver through the established review and CD sequence.

## Reuse Check

Searched Client.Logout, Client.ListSessions, Handler.Sessions, buildAuthPort, profile actions, ProfileSessions, ProfilePasswordForm, profile-ghost-button and ProfilePage. Extend these units; Logout ends the current session and cannot implement other-session revocation. Shared delete transport stays in the Kratos adapter; auth-owned UUID validation does not import another bounded context's private upload/guest validators.

## Verification

| Criterion | Evidence                                                                                                                                                                                                           |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC-001    | `go -C api test ./internal/auth ./internal/kratos ./cmd/api` and real `TestSessionRevocationLiveKratos`: passed single/bulk/current/foreign boundaries                                                             |
| AC-002    | Same Go suites: missing/expired token, malformed/current UUID (including case), upstream rejection, no-store and exhausted session bucket passed; redirect regression ffd6e80 precedes transport fix               |
| AC-003    | `session-revocation.spec.ts`: 6/6 Chromium/WebKit cases passed; signed-token/no-store, null bulk, invalid input, unsupported provider, missing auth, upstream/network errors                                       |
| AC-004    | `session-list.spec.ts` plus dedicated `session-controls-browser.spec.ts`: EN/RU structure, actual pending/error/single/bulk clicks, preserved edits/current, reload and no hydration error pass in Chromium/WebKit |
| AC-005    | Real `oryd/kratos:v26.2.0` with in-memory DSN passed; PR review/gates, stable readiness and CD receipts will be maintained in the PR                                                                               |

## Documentation Sources

Context7 lookup rejected by monthly quota. Official pinned source: https://github.com/ory/kratos/blob/v26.2.0/session/handler.go (deleteMySession / deleteMySessions). Next server functions guide and cookies reference read from installed next/dist/docs.

## TDD Evidence

- a3d62c7: Go failed on missing Client/Handler revoke methods; two EN/RU renders failed on absent controls; three action tests failed on missing revokeSessionAction. Tests committed before implementation.
- e2a17b1: actual WebKit browser smoke failed on pageerror caused by EN timestamp ICU punctuation (`at` versus comma). Server-built date labels fix hydration without suppressing errors.
- ffd6e80: redirect test failed because WhoAmI forwarded the credential. Reuse the same non-redirecting session transport for WhoAmI/list/delete.

## Local Verification

Go vet/full tests passed before the final shared-transport change; targeted/full final rerun recorded below. API codegen verifies 52 operations / 26 Go registrations. App and e2e typechecks/lint passed before final date-label adjustments; final checks below. Real Kratos smoke passed current/foreign preservation, single invalidation, bulk leaving zero others and empty bulk retry; temporary runtime removed after verification. Browser fixture is opt-in locally and runs as a dedicated mandatory CI step (one worker, loopback-only stub, no production account).

Final full Go vet/tests and both live Kratos integration cases passed after the shared transport change; the disposable container was removed. Final API-provider browser smoke with the CI signing-secret environment: 4/4 EN/RU Chromium/WebKit cases passed, including no page errors before/after reload. App/e2e typechecks and e2e lint passed (existing skips/conditional warnings only).

Final focused profile suite: 26/26 Chromium/WebKit cases passed; app lint, CSS lint and production build passed after all product changes. Soft size/style/skip warnings remain non-blocking and the retained component/provider size is justified in the PR. Final repository/API/feature-memory checks passed.
