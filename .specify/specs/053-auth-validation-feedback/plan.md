# 053 — Implementation and verification

## Plan

1. Reproduce the reported policy with disposable pinned Kratos; inspect shared validation and active contracts.
2. Commit failing Go/browser regressions before application changes.
3. Preserve structured Kratos IDs, map only known password reasons to safe localized codes, and show an accessible requirements hint using AuthField.
4. Align optional registration name validation with OpenAPI/identity; retain existing short-name acceptance and username policy.
5. Verify tests, docs/contracts and current-head native review plus required checks.

## Reuse Check

`rg` over `app/src/features/{auth,profile}`, `app/src/components/auth`, `api/internal/{auth,kratos}`, `infra/kratos` and existing POMs found createSignUpSchema/createProfileFormSchema, authErrorMessageKey, AuthField, firstError/ErrFlowRejected, Registration/validateProfileUpdate, AuthPopup/ProfilePage. Extend these; a small Kratos password-rejection classifier is needed because firstError previously discarded stable message IDs at the error boundary.

## Verification

| Criterion | Evidence | Result |
|---|---|---|
| AC-001 | Disposable Kratos v26.2.0: identifier-match 400/4000031; unrelated underscore + Ян 200. Go adapter/handler regressions and registration browser scenario | Reproduction passed; automated coverage pending |
| AC-002 | auth password-validation browser scenario, EN/RU field assertions and error-code mapping | Pending |
| AC-003 | profile short-personal-name browser scenario; Go registration/profile validation tests | Pending |
| AC-004 | Go tests; API generation/check, identity-schema cases, feature-memory guard | Pending |
| TDD | Failing-test commit followed by implementation commit | Pending |
| Merge gate | GitHub checks and native Codex evidence bound to final head | Pending |
