# Implementation Plan: Stage 1 Provider Fixtures

**Branch**: `codex/stage-1-provider-fixtures` | **Date**: 2026-06-06 | **Spec**: `.specify/specs/007-stage-1-provider-fixtures/spec.md`

## Summary

Add a server-only provider boundary layer for Stage 1 product work, default it to deterministic mocks, and expose `/api/health` as a minimal proof that the Next.js Route Handler can instantiate the provider registry without real external services.

## Technical Context

**Language/Version**: TypeScript 5, React 19.2, Next.js 16.2.6 App Router
**Primary Dependencies**: Next.js Route Handlers, `server-only`, existing generated OpenAPI metadata
**Storage**: Mock fixtures only; real Supabase remains an integration gate
**Testing**: `npm run check:repo`, `npm run check:api-contract`, app lint/typecheck/build, local `/api/health` smoke check
**Target Platform**: Web app under `app/src/`, future Flutter consumers through the shared API contract
**Project Type**: Web application foundation layer
**Performance Goals**: Mock provider registry instantiates synchronously enough for route/server code; no real network calls in Stage 1
**Constraints**: No production credentials, no real provider calls, no client bundling of server provider registry
**Scale/Scope**: One foundation PR supporting upcoming landing/auth/journey/wardrobe slices

## Constitution Check

- Glassmorphism and prototype fidelity are not directly touched because this PR does not implement product screens.
- Achromatic UI rule is unaffected.
- Capsule methodology is preserved by keeping palette validation behind a methodology port and by avoiding UI-level direct color-rule branching.
- "Direct, not dictate" is preserved by preparing explanation-bearing validation results and blocked states.
- Premium quality bar is supported by deterministic failure/timeout/payment fixtures before real-provider QA.
- Three upload methods are represented as separate provider surfaces: photo/storage/background removal, marketplace import, and catalog search.

## Verification

| Acceptance criterion | Evidence                                                                                                                                                                                           |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| US1 / FR-001         | `app/src/lib/providers/contracts.ts` defines shared provider ports for auth/profile, wardrobe, storage, image processing, marketplace import, catalog search, billing, capsules, and methodology.  |
| US1 / FR-002         | `app/src/lib/providers/mock/index.ts` implements every port; `npm --prefix app run typecheck` verifies interface coverage.                                                                         |
| US2 / FR-002         | `app/src/lib/providers/mock/fixtures.ts` includes deterministic wardrobe, catalog, upload timeout, marketplace success/failure, OpenAPI-aligned coin-pack fixtures, and review-fix evidence below. |
| US3 / FR-003         | `app/src/lib/providers/registry.ts` defaults unset `CAPSULE_PROVIDER_MODE` to `mock`; `app/.env.local.example` declares `CAPSULE_PROVIDER_MODE=mock`.                                              |
| US3 / FR-004         | `app/src/lib/providers/registry.ts` rejects `supabase` mode with an integration-gate error.                                                                                                        |
| FR-005               | `app/src/lib/providers/registry.ts` and `app/src/lib/providers/mock/index.ts` import `server-only`; `npm --prefix app run build` validates the server boundary.                                    |
| FR-006               | `app/src/app/api/health/route.ts`; local smoke check with `curl http://localhost:3000/api/health`.                                                                                                 |
| FR-007               | `docs_capsule_zero/project/backend/backend-docs.md` documents provider-boundary paths.                                                                                                             |
| SC-001               | `npm --prefix app run typecheck`                                                                                                                                                                   |
| SC-002               | `npm --prefix app run lint`                                                                                                                                                                        |
| SC-003               | `npm --prefix app run build`                                                                                                                                                                       |
| SC-004               | `curl -sS http://127.0.0.1:3101/api/health` returned `providerMode: "mock"` with fixture counts `users: 1`, `wardrobeItems: 4`, `catalogItems: 2`, `coinPacks: 3`.                                 |
| SC-005               | `npm run check:feature-memory -- --worktree`                                                                                                                                                       |

Negative scenario evidence:

- Static review of `app/src/lib/providers/registry.ts` verifies `CAPSULE_PROVIDER_MODE=supabase` rejects with an explicit integration-gate error before real provider evidence exists.
- `server-only` import in registry/mock implementation plus `npm --prefix app run build` verifies server-only protection remains compatible with the App Router build.
- Review-fix smoke evidence: `app/src/lib/providers/mock/index.ts` keeps upload target job ids pollable after completion/background-removal transition and returns accepted coin-spend retries by idempotency key before current-balance rejection.
- Second review-fix evidence: `app/src/lib/providers/mock/fixtures.ts` uses OpenAPI coin-pack ids, `app/src/lib/providers/mock/index.ts` propagates submitted marketplace URLs to candidates, and created capsules are preserved in mock registry state for create-to-read flows.

## Project Structure

```text
app/src/
  app/api/health/route.ts
  lib/providers/
    contracts.ts
    index.ts
    registry.ts
    mock/
      fixtures.ts
      index.ts

docs_capsule_zero/project/backend/backend-docs.md
.specify/specs/007-stage-1-provider-fixtures/
  spec.md
  plan.md
  tasks.md
```

**Structure Decision**: Keep provider contracts under `app/src/lib/providers/` so Server Actions and Route Handlers can share the same domain ports. Keep fixtures under `mock/` so product UI cannot confuse deterministic Stage 1 data with real provider payloads.

## Complexity Tracking

No constitution violations.
