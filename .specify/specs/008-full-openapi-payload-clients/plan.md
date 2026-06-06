# Implementation Plan: Full OpenAPI Payload Clients

**Branch**: `codex/full-openapi-payload-clients` | **Date**: 2026-06-06 | **Spec**: `.specify/specs/008-full-openapi-payload-clients/spec.md`

## Summary

Expand the local OpenAPI generator from route/error metadata into payload-aware generated artifacts. The web output gets TypeScript schema and operation payload aliases; the mobile output gets OpenAPI schema and operation payload descriptors without introducing a Dart model-generation dependency.

## Technical Context

**Language/Version**: Node.js ESM generator, TypeScript 5, Dart 3.5-compatible generated metadata
**Primary Dependencies**: Existing `yaml` package, OpenAPI 3.1 contract in `docs_capsule_zero/adr/openapi.yaml`
**Storage**: No persistence changes
**Testing**: `npm run generate:api`, `npm run check:api-contract`, app typecheck/lint/build, feature-memory check, diff check
**Target Platform**: Web generated types under `app/src/lib/api/generated/`, Flutter generated metadata under `mobile/lib/api/generated/`
**Project Type**: API contract generation foundation
**Performance Goals**: Generator remains local and deterministic; no network or provider calls
**Constraints**: Do not add real provider integration, do not change endpoint inventory, do not add generated-client dependencies
**Scale/Scope**: 43 route-methods and all component schemas in the current MVP OpenAPI contract

## Constitution Check

- Glassmorphism, achromatic UI, and prototype fidelity are not directly touched because this is API generation infrastructure.
- Capsule methodology remains source-of-truth driven through existing OpenAPI/provider contracts; no new UI-level methodology branching is added.
- "Direct, not dictate" is preserved by keeping validation/error payload shapes explicit for future explanatory UI flows.
- Premium quality is supported by reducing hand-written API shape drift before feature work.
- Three upload methods are supported through generated payload descriptors for photo upload, marketplace import, and catalog search operations.

## Verification

| Acceptance criterion | Evidence |
| -------------------- | -------- |
| SC-001 / FR-001-FR-005 | `npm run generate:api` |
| SC-002 / FR-006 | `npm run check:api-contract` |
| SC-003 | `npm --prefix app run typecheck` |
| SC-004 | `npm --prefix app run lint` |
| SC-005 | `npm run check:feature-memory -- --worktree` |
| Repo baseline | `npm run check:repo` |
| Build safety | `npm --prefix app run build` |
| Whitespace safety | `git diff --check` |

Negative scenario evidence:

- TypeScript request aliases use `never` when an operation has no JSON request body.
- TypeScript response aliases use `void` when a success response has no JSON response body.
- `npm run check:api-contract` runs the generator in `--check` mode and fails stale generated output.

## Project Structure

```text
scripts/generate-api-clients.mjs
app/src/lib/api/generated/openapi.ts
mobile/lib/api/generated/openapi.dart
.specify/specs/008-full-openapi-payload-clients/
  spec.md
  plan.md
  tasks.md
```

**Structure Decision**: Keep generation in the existing script and generated artifact locations so CI and developer commands continue to use `npm run generate:api` and `npm run check:api-contract`.

## Complexity Tracking

No constitution violations.
