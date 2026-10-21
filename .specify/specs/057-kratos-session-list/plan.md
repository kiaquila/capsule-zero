# Plan 057 — Real Kratos session inventory

## Approach

Commit failing Go and frontend contract/render tests before implementation. Reuse existing auth client and profile flow, add a small ProfileSessions renderer to keep the already large shell from growing.

## Reuse Check

Searched `WhoAmI`, `RequireSession`, `buildAuthPort`, `buildProfileSnapshot`, `ProfileShell`, `profile-session` CSS and `ProfilePage`. Existing auth validation and signed-token fetch cover the boundary; inventory needs a new client method and route because WhoAmI only returns one session. Extract the session section into ProfileSessions for focused rendering and tests; reuse existing CSS/POM.

## Verification

| Criterion | Evidence                                                                                                                                                                                    |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-001    | `go -C api test ./internal/kratos ./internal/auth ./cmd/api`: passed; token forwarding, nonsequential pagination, current merging, filtering and deduplication.                             |
| AC-002    | Same Go suites pass missing/invalid credential, allowlist/no-store, foreign identity selector, later failure, malformed JSON, cycle and 20-page budget cases.                               |
| AC-003    | `real-profile-data.spec.ts`: signed token/no-store request, real inventory, loaded-empty and upstream failure assertions pass in Chromium/WebKit (10 cases including existing regressions). |
| AC-004    | `session-list.spec.ts`: 6/6 EN/RU date/current/empty/unavailable renderer cases pass in Chromium/WebKit; `optional-profile-fields.spec.ts`: existing 4/4 browser save/reload cases pass.    |
| AC-005    | PR native review/checks, stable-readiness timestamps and production CD/live-health evidence linked on the PR.                                                                               |

## Local Checks

Full `go vet ./... && go test ./...` passed. App/e2e typechecks and e2e lint pass (existing warnings). API contract: 50 operations, 24 Go registrations verified; repository baseline passes. `npm run lint`, `npm run lint:css` and `npm run build` pass (size/style warnings only). Real image `oryd/kratos:v26.2.0` with in-memory DSN: `TEST_KRATOS_PUBLIC_URL=http://127.0.0.1:34433 go -C api test -tags=integration ./internal/auth -run TestSessionsLiveKratos -count=1 -v` passes two-owner-session inventory, foreign account isolation, single-session empty-other pagination and removal after native logout. Container removed after the smoke.

## TDD Evidence

Before implementation: Go compilation fails on missing Client.ListSessions/Handler.Sessions; profile contract test fails with sessionsStatus undefined; all three EN/RU renderer tests fail on missing ProfileSessions. Commands: `go -C api test ./internal/kratos ./internal/auth -run "TestListSessions|TestSessions"`; `PORT=3210 E2E_BASE_URL=http://localhost:3210 npm --prefix tests/e2e test -- specs/profile/real-profile-data.spec.ts specs/profile/session-list.spec.ts --project=chromium --workers=1` (suites run separately).

Failing tests are committed in `3b546a3` before implementation. The TSX renderer test initially needed Jiti automatic JSX support; enabling it made the actual React/next-intl render tests pass without product workarounds.

Real Kratos v26.2.0 smoke found that a zero-total empty list still carries an optimistic next Link. Regression committed in `c56784a`; only an empty decoded page AND explicit `X-Total-Count: 0` stops this traversal. Other empty pages continue following Link.

Final focused rerun: 20/20 profile cases pass in Chromium + WebKit (`real-profile-data`, `session-list`, `optional-profile-fields`). Generated clients and app/e2e typechecks pass after the final provider validation. Native review and GitHub delivery receipts are maintained on this PR.
