# Plan

Reuse search: `GuestFlow`, `GuestResultStep`, `state.ts`, `AuthPanel`, auth actions/Google callback/session; provider API `apiFetch` and wardrobe adapters; `profiles.Repo`, uploads repository/handler and `httpx`; dashboard/My Items snapshot builders. Existing Go wardrobe storage does not exist. New guest-progress context owns durable collections/records; existing wardrobe and result UI consume it. No new auth implementation or outfit calculator.

## Verification

| AC  | Evidence                                                                                    | Result                                                                                                                            |
| --- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1–2 | Browser email/Google continuation, account reload/draft removal, selected items/result      | RED: browser registration redirects to `/en/dashboard`, expected account result; log `/private/tmp/guest-account-browser-red.log` |
| 3–4 | `go test ./cmd/api -run TestGuestProgressRoutesRequireSession -count=1`                     | RED: all five routes return 404 instead of 401; PostgreSQL probes follow                                                          |
| 5   | Browser canceled auth/storage/save failure and retry cases, live desktop/mobile review      | Pending                                                                                                                           |
| 6   | My Items/dashboard tests, API contract codegen, doc diff                                    | Pending                                                                                                                           |
| All | Repository/static/Go/browser checks and current PR head required GitHub gates/native review | Pending                                                                                                                           |

The linked PR current-head checks are authoritative final delivery evidence. User explicitly authorizes merge after all gates pass, threads are fixed/resolved and two minutes have elapsed from merge readiness.
