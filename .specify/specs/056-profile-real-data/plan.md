# Plan 056 — Honest profile data

## Approach

Write and commit failing regression tests before implementation. Remove presentation fallbacks and fixture sessions. Send explicit blank location strings and allow them through the existing Go validation and OpenAPI contract. Preserve existing values without provenance guessing.

## Reuse Check

Searched `buildProfileSnapshot`, `saveProfileAction`, `mock-profile-preferences`, `AuthPort`, `ProfileRepository`, `validateProfileUpdate` and `Repo.Apply`. Extend those existing responsibilities; no new product module is needed. Reuse the existing Jiti test loader pattern and empty Next headers support.

## Verification

| Criterion | Evidence                                                            |
| --------- | ------------------------------------------------------------------- |
| AC-001    | Pending snapshot/action and browser regressions                     |
| AC-002    | Pending localized browser and snapshot regressions                  |
| AC-003    | Pending save/reload and cross-user regressions                      |
| AC-004    | Pending action/API validation/repository and browser regressions    |
| AC-005    | Pending rejected-provider regression                                |
| Delivery  | Pending required GitHub gates and native Codex review of final head |
