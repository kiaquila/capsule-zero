# Plan 056 — Honest profile data

## Approach

Write and commit failing regression tests before implementation. Remove presentation fallbacks and fixture sessions. Send explicit blank location strings and allow them through the existing Go validation and OpenAPI contract. Preserve existing values without provenance guessing.

## Reuse Check

Searched `buildProfileSnapshot`, `saveProfileAction`, `mock-profile-preferences`, `AuthPort`, `ProfileRepository`, `validateProfileUpdate` and `Repo.Apply`. Extend those existing responsibilities; no new product module is needed. Reuse the existing Jiti test loader pattern and empty Next headers support.

## Verification

| Criterion | Evidence                                                                                                                                                                                                                                                                                                       |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-001    | `real-profile-data.spec.ts` new-profile/action case + `optional-profile-fields.spec.ts` EN/RU save/reload: green in Chromium and WebKit (12 total cases).                                                                                                                                                      |
| AC-002    | Same browser cases assert zero device rows/current badges and visible localized unavailable copy; snapshot asserts empty sessions.                                                                                                                                                                             |
| AC-003    | `real-profile-data.spec.ts` former-default equality and cross-user isolation + browser reload assertions pass.                                                                                                                                                                                                 |
| AC-004    | `real-profile-data.spec.ts` captures explicit API PATCH blanks and cookie-free location reload. `go vet ./... && go test ./...` passes, including `TestValidateProfileUpdateAcceptsValidAndOmitted` and `TestApplyDistinguishesClearedAndOmittedLocation`; null/invalid/oversized negative handler cases pass. |
| AC-005    | `real-profile-data.spec.ts` rejected API PATCH preserves previous cookie, returns `ok: false`.                                                                                                                                                                                                                 |
| Delivery  | Pending required GitHub gates and native Codex review of final head                                                                                                                                                                                                                                            |

## TDD Evidence

Failing tests committed in `971f0ba` before implementation: Chromium EN/RU form cases fail on `1992-06-15`; module regressions fail on defaults/cross-user fallback and missing PATCH clear fields; Go validation regression fails with “Country cannot be blank”. Implementation rerun: 12/12 Playwright cases green and all Go packages green.

## Local Checks

`npm run check:api-contract`, app/e2e lint (warnings only), app/e2e typechecks pass. `npm run build`, `npm run check:repo`, feature-memory validation and CSS lint (existing warnings only) also pass. GitHub integration evidence is recorded on the PR. Existing large profile/mock modules are edited in place to remove behavior; splitting them is outside this focused fix.
