# Plan 057 — Real Kratos session inventory

## Approach

Commit failing Go and frontend contract/render tests before implementation. Reuse existing auth client and profile flow, add a small ProfileSessions renderer to keep the already large shell from growing.

## Reuse Check

Searched `WhoAmI`, `RequireSession`, `buildAuthPort`, `buildProfileSnapshot`, `ProfileShell`, `profile-session` CSS and `ProfilePage`. Existing auth validation and signed-token fetch cover the boundary; inventory needs a new client method and route because WhoAmI only returns one session. Extract the session section into ProfileSessions for focused rendering and tests; reuse existing CSS/POM.

## Verification

| Criterion | Evidence                                                                                                      |
| --------- | ------------------------------------------------------------------------------------------------------------- |
| AC-001    | Go client/handler session inventory tests (TDD; results recorded before PR).                                  |
| AC-002    | Go missing/invalid token, sanitized response and pagination failure tests.                                    |
| AC-003    | API-provider/profile snapshot contract tests.                                                                 |
| AC-004    | EN/RU session rendering and empty/unavailable tests; existing profile browser regression suite.               |
| AC-005    | PR native review/checks, stable-readiness timestamps and production CD/live-health evidence linked on the PR. |

## TDD Evidence

Before implementation: Go compilation fails on missing Client.ListSessions/Handler.Sessions; profile contract test fails with sessionsStatus undefined; all three EN/RU renderer tests fail on missing ProfileSessions. Commands: `go -C api test ./internal/kratos ./internal/auth -run "TestListSessions|TestSessions"`; `PORT=3210 E2E_BASE_URL=http://localhost:3210 npm --prefix tests/e2e test -- specs/profile/real-profile-data.spec.ts specs/profile/session-list.spec.ts --project=chromium --workers=1` (suites run separately).
