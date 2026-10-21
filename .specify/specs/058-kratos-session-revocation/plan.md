# Plan 058 — Session revocation

## Approach

Commit failing Go/client/action/render tests, implement through the existing public-token boundary, verify with disposable Kratos, then deliver through the established review and CD sequence.

## Reuse Check

Searched Client.Logout, Client.ListSessions, Handler.Sessions, buildAuthPort, profile actions, ProfileSessions, ProfilePasswordForm, profile-ghost-button and ProfilePage. Extend these units; Logout ends the current session and cannot implement other-session revocation. Shared delete transport stays in the Kratos adapter; auth-owned UUID validation does not import another bounded context's private upload/guest validators.

## Verification

| Criterion | Evidence                                                           |
| --------- | ------------------------------------------------------------------ |
| AC-001    | Pending: Go handler/client tests and disposable Kratos integration |
| AC-002    | Pending: negative and router throttling tests                      |
| AC-003    | Pending: signed-token provider/action tests                        |
| AC-004    | Pending: EN/RU control tests and browser verification              |
| AC-005    | Pending: real runtime, PR gates, readiness and deployment receipts |

## Documentation Sources

Context7 lookup rejected by monthly quota. Official pinned source: https://github.com/ory/kratos/blob/v26.2.0/session/handler.go (deleteMySession / deleteMySessions). Next server functions guide and cookies reference read from installed next/dist/docs.
