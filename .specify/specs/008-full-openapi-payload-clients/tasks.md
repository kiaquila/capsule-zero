# Tasks: Full OpenAPI Payload Clients

**Input**: `.specify/specs/008-full-openapi-payload-clients/spec.md`, `plan.md`

## Phase 1: Setup

- [x] T001 Refresh GitHub state and confirm open PR / CI status before planning the next step.
- [x] T002 Create branch `codex/full-openapi-payload-clients` from `origin/main`.
- [x] T003 Fetch current OpenAPI documentation through Context7 before changing schema generation behavior.

## Phase 2: Generator

- [x] T004 Expand `scripts/generate-api-clients.mjs` to resolve local OpenAPI references, parameters, request bodies, and JSON success responses.
- [x] T005 Generate TypeScript component schema aliases and operation payload helper aliases.
- [x] T006 Generate Dart component schema descriptors and operation payload descriptors.
- [x] T007 Preserve existing route metadata and error-code exports.

## Phase 3: Generated Artifacts

- [x] T008 Run `npm run generate:api`.
- [x] T009 Update `app/src/lib/api/generated/openapi.ts`.
- [x] T010 Update `mobile/lib/api/generated/openapi.dart`.

## Phase 4: Verification

- [x] T011 Run `npm run check:api-contract`.
- [x] T012 Run `npm run check:repo`.
- [x] T013 Run `npm --prefix app run typecheck`.
- [x] T014 Run `npm --prefix app run lint`.
- [x] T015 Run `npm --prefix app run build`.
- [x] T016 Run `npm run check:feature-memory -- --worktree`.
- [x] T017 Run final `git diff --check`.

## Process Memory

### Dead Ends

- None.

### Decisions

- Kept the generator dependency-free beyond the existing `yaml` package instead of introducing a full OpenAPI generator dependency for this slice.
- Generated TypeScript payload aliases for strong web compile-time checking.
- Generated Dart JSON descriptors rather than full Dart model classes because the Flutter shell does not yet need a serialization dependency or generated model lifecycle.
- Represented missing request bodies as `never` and missing JSON success bodies as `void` in TypeScript so future handlers cannot accidentally accept phantom payloads.

### Known Issues

- Dart output exposes payload descriptors, not hand-friendly model classes. Full Dart models remain a later step when Flutter feature work needs them.

### Verification Evidence

- `npm run generate:api` generated API clients for 43 operations.
- `npm run check:api-contract` passed and verified generated clients for 43 operations.
- `npm run check:repo` passed.
- `npm --prefix app run typecheck` passed.
- `npm --prefix app run lint` passed.
- `npm --prefix app run build` passed.
- `npm run check:feature-memory -- --worktree` passed for `008-full-openapi-payload-clients`.
- `git diff --check` passed.
- `npm run preflight` passed.
