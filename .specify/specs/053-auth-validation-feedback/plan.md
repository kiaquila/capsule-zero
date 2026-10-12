# 053 — Implementation and verification

## Plan

1. Reproduce the reported policy with disposable pinned Kratos; inspect shared validation and active contracts.
2. Commit failing Go/browser regressions before application changes.
3. Preserve structured Kratos IDs, map only known password reasons to safe localized codes, and show an accessible requirements hint using AuthField.
4. Align optional registration name validation with OpenAPI/identity; retain existing short-name acceptance and username policy.
5. Verify tests, docs/contracts and current-head native review plus required checks.

## Reuse Check

`rg` over `app/src/features/{auth,profile}`, `app/src/components/auth`, `api/internal/{auth,kratos}`, `infra/kratos` and existing POMs found createSignUpSchema/createProfileFormSchema, authErrorMessageKey, AuthField, firstError/ErrFlowRejected, Registration/validateProfileUpdate, AuthPopup/ProfilePage. Extend these; a small Kratos password-rejection classifier is needed because firstError previously discarded stable message IDs at the error boundary. The existing `scripts/check-api-contract.mjs` owns repository-wide identity/OpenAPI agreement; Go package tests remain self-contained within `api/`.

## Verification

| Criterion | Evidence | Result |
|---|---|---|
| AC-001 | Disposable `oryd/kratos:v26.2.0` with committed config: identifier-match 400/4000031; unrelated underscore + Ян 200. `cd api && go vet ./... && go test ./...`; `CAPSULE_PROVIDER_MODE=api CAPSULE_API_BASE_URL=http://127.0.0.1:18080 E2E_API_VALIDATION=1 npm --prefix tests/e2e run test -- specs/auth/password-policy-fullstack.spec.ts specs/profile/short-personal-name.spec.ts --project=chromium --project=webkit-iphone --workers=1` | Go passed; full stack 8/8 EN/RU Chromium/WebKit passed |
| AC-002 | `npm --prefix tests/e2e run test -- specs/auth/password-validation.spec.ts specs/profile/short-personal-name.spec.ts --project=chromium --project=webkit-iphone --workers=1`; `TestRegistrationPasswordFeedback` covers six known IDs, duplicate/unknown generic failures and no upstream text echo; mobile RU screenshot `/tmp/cz-auth-hint-ru.png` inspected | 8/8 passed; hint and localized field errors fit mobile form |
| AC-003 | Same profile browser cases save trimmed Ян / Л and reject blank inputs; `TestRegistrationOptionalName`, `TestProfileShortNamesRemainValid`, existing profile-boundary tests | EN/RU short-name and negative cases passed |
| AC-004 | `npm run check:api-contract` (44 routes / 18 Go registrations and generated-client freshness); `npm run check:feature-memory -- --worktree`; cross-repository identity/OpenAPI name constraints in the existing API contract gate | Passed; negative contract probe (isolated schema with minLength=3) rejected as expected; live pinned Kratos accepted 1, 2 and 80-character names (200), rejected empty/whitespace/81-character names (400) |
| TDD | `eb68194` committed failing password-hint / stable-code / explicit empty-null name / identity-schema regressions before application changes; green commands above | Red → green recorded in separate commits |
| Build / static | `npm run check:repo`, `npm --prefix app run typecheck`, `npm --prefix tests/e2e run typecheck`, `npm run lint`, `npm run lint:css`, `npm run lint:e2e`, `npm run build`, `git diff --check` | Passed; linters have warnings and no errors |
| Full browser suite | `npm --prefix tests/e2e run test -- --workers=2` | 112 passed / 12 opt-in skips, Chromium + mobile WebKit |
| Merge gate | [PR #156](https://github.com/kiaquila/capsule-zero/pull/156) current-head required checks and native Codex evidence are live GitHub artifacts linked from the PR SENAR checklist, verified after publication; no merge is authorized | Required before merge readiness |

Local output logs: `/tmp/cz-validation-final-go.log`, `/tmp/cz-validation-green-browser-2.log`, `/tmp/cz-validation-fullstack-browser-2.log`, `/tmp/cz-validation-build.log`, `/tmp/cz-validation-full-suite-3.log`. These commands are reproducible; temporary runtimes use disposable local identities and databases.
