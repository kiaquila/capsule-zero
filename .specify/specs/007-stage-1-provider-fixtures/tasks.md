# Tasks: Stage 1 Provider Fixtures

**Input**: `.specify/specs/007-stage-1-provider-fixtures/spec.md`, `plan.md`

## Phase 1: Setup

- [x] T001 Refresh GitHub state and confirm open PR / CI status before planning the next step.
- [x] T002 Resolve stale local conflict markers in `docs_capsule_zero/project/devops/codex-implementation-validation.md`.
- [x] T003 Create branch `codex/stage-1-provider-fixtures` from `origin/main`.
- [x] T004 Fetch current Next.js App Router docs through Context7 before adding route/server boundary code.

## Phase 2: Provider Boundary Code

- [x] T005 Add `server-only` dependency for server provider boundary protection.
- [x] T006 Define provider/domain contracts in `app/src/lib/providers/contracts.ts`.
- [x] T007 Add deterministic mock fixtures in `app/src/lib/providers/mock/fixtures.ts`.
- [x] T008 Implement mock provider registry behavior in `app/src/lib/providers/mock/index.ts`.
- [x] T009 Add provider mode selector in `app/src/lib/providers/registry.ts`.
- [x] T010 Add provider exports in `app/src/lib/providers/index.ts`.
- [x] T011 Add `/api/health` Route Handler in `app/src/app/api/health/route.ts`.
- [x] T012 Add `CAPSULE_PROVIDER_MODE=mock` to `app/.env.local.example`.

## Phase 3: Documentation

- [x] T013 Update `docs_capsule_zero/project/backend/backend-docs.md` with provider-boundary source paths.
- [x] T014 Add SENAR spec in `.specify/specs/007-stage-1-provider-fixtures/spec.md`.
- [x] T015 Add SENAR implementation plan in `.specify/specs/007-stage-1-provider-fixtures/plan.md`.
- [x] T016 Update this task file with final verification evidence before declaring complete.

## Phase 4: Verification

- [x] T017 Run `npm --prefix app run typecheck`.
- [x] T018 Run `npm --prefix app run lint`.
- [x] T019 Run `npm --prefix app run build`.
- [x] T020 Run `npm run check:repo`.
- [x] T021 Run `npm run check:api-contract`.
- [x] T022 Run `/api/health` local smoke check.
- [x] T023 Run `npm run check:feature-memory -- --worktree`.
- [x] T024 Run final `git diff --check`.

## Process Memory

### Dead Ends

- `npm --prefix app run lint` and `npm --prefix app run build` initially exited with code `-1` and no diagnostics because the current local surface failed to execute the `.bin` wrappers for `eslint` and `next`.
- Direct JS entrypoints worked: `node node_modules/eslint/bin/eslint.js .` and `node node_modules/next/dist/bin/next build --webpack`.

### Decisions

- Kept the Stage 1 boundary server-only and added the small `server-only` package so future service-role, payment, and image-provider code cannot be imported into Client Components accidentally.
- Defaulted provider mode to `mock` when `CAPSULE_PROVIDER_MODE` is unset, matching ADR-006 and avoiding required provider credentials in local agent sessions.
- Made `supabase` mode an explicit integration-gate error instead of a partially wired placeholder.
- Added `/api/health` as the first Route Handler because it is low-risk, public in the OpenAPI contract, and proves the provider registry can be instantiated through the App Router.
- Updated app scripts to call Next and ESLint JS entrypoints directly so standard `npm run lint` and `npm run build` are locally reproducible in this worktree.
- Reused the upload target's deterministic job id when completing photo uploads so the same job remains pollable and can transition into background removal.
- Moved mock coin-spend idempotency lookup ahead of balance enforcement so accepted retries return the existing ledger entry even if the current balance later changes.
- Aligned mock coin-pack ids with the OpenAPI enum values (`coins_5`, `coins_15`, `coins_30`) so billing routes do not need fixture-specific translation.
- Rewrote marketplace import candidates to keep the submitted URL as `sourceUrl` so confirmed wardrobe items preserve the user's actual link.
- Stored created capsules in mock registry state and made `getCurrentCapsule` read the latest capsule for the user.

### Known Issues

- The mock registry is intentionally in-memory and deterministic; it is not a persistence substitute for Supabase integration testing.
- Fixture image paths are representative placeholders. Product-screen PRs should add real visual assets or generated assets when UI needs to render fixture images.
- Full OpenAPI payload clients are still a follow-up before route-handler-heavy feature work.
