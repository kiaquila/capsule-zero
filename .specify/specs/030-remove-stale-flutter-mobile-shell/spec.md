# Spec: Remove Stale Flutter Mobile Shell

## Goal

Remove the stale Flutter/Dart mobile shell left behind by the 2026-06-27 production-stack pivot so the repository no longer presents Flutter, Dart codegen, or `supabase_flutter` as active Capsule Zero mobile architecture. Until the future React Native scaffold lands, `mobile/` should be an explicit React Native placeholder that points to the current mobile docs.

## Scope

In scope:

- delete the tracked Flutter shell files under `mobile/`, including `pubspec.yaml`, Dart sources, generated Dart client output, generated mobile TypeScript output, and `mobile/.env.example`
- keep `mobile/README.md` as a React Native placeholder that records the cleanup and warns against reintroducing Flutter, Dart, or `supabase_flutter`
- remove Dart and mobile-client emission from `scripts/generate-api-clients.mjs`
- remove stale Flutter/mobile runtime checks from local tooling scripts and lint-staged configuration
- correct the mobile architecture docs so they acknowledge the removed Sprint 0 Flutter shell and preserve React Native as the accepted target
- add feature memory required by the product-root guard because this PR edits `mobile/`

Out of scope:

- creating the React Native/Expo scaffold
- adding mobile screens, auth flows, payments, deep links, or native tests
- changing the OpenAPI contract, Go API behavior, web client generation, or app client generation
- rewriting grandfathered Sprint 0 history that accurately records the old Flutter shell
- weakening the feature-memory guard or reclassifying `mobile/` out of product roots

## User Stories

### US1: Remove Retired Mobile Stack

As a maintainer, I want the repository to stop carrying Flutter and Dart artifacts so new work follows the accepted React Native architecture.

### US2: Keep Mobile Placeholder Honest

As a future mobile implementer, I want `mobile/README.md` to explain the current placeholder state so I do not build on a retired scaffold.

### US3: Keep API Generation Focused

As a developer, I want API code generation to emit only active clients so stale mobile targets cannot drift or fail checks.

## Acceptance Criteria

- AC-001: `mobile/` tracks only `mobile/README.md` after the cleanup.
- AC-002: `mobile/README.md` identifies React Native as the mobile target, records that the previous Flutter shell was removed, and warns against Flutter, Dart, and `supabase_flutter` reintroduction.
- AC-003: `scripts/generate-api-clients.mjs` no longer contains `generateDart()` or writes generated clients into `mobile/`.
- AC-004: runtime/tooling checks no longer require Flutter or a mobile `.env.local` while the React Native scaffold is absent.
- AC-005: docs under `docs_capsule_zero/project/mobile/` align with the production-stack pivot and describe the React Native scaffold as future work.
- AC-006: feature-memory guard passes because this spec folder includes `spec.md`, `plan.md`, and `tasks.md` in the PR diff.

## Negative Scenarios

- NS-001: Do not introduce a partial React Native scaffold in this cleanup PR.
- NS-002: Do not reintroduce Supabase, `SUPABASE_*`, Flutter, Dart, or `supabase_flutter` as active mobile runtime dependencies.
- NS-003: Do not remove web or legacy `app/` TypeScript API client generation in this PR.
- NS-004: Do not rewrite historical Sprint 0 feature memory merely to hide that the Flutter shell once existed.

## Requirements

- FR-001: The tracked `mobile/` tree must collapse to a placeholder README until the later React Native scaffold spec creates real source files.
- FR-002: API client generation must keep web and legacy `app/` TypeScript clients intact.
- FR-003: Local runtime checks must not require Flutter tooling after Flutter is retired.
- FR-004: Mobile docs and README must make the architecture handoff explicit: Flutter was removed, React Native arrives later.
- FR-005: Verification evidence must be command-backed in `plan.md`.

## Test-First Verification Waiver

This spec is a stale scaffold/tooling/docs cleanup with no executable mobile behavior remaining after the deletion. The failing-test-first loop for specs >= 025 is waived; verification uses guard, generator, contract, syntax, and file-inventory commands, plus the required green `test` GitHub check.

## Success Criteria

- SC-001: The PR no longer carries Flutter/Dart mobile source or generated output.
- SC-002: The API generator and runtime tooling checks reflect only active targets.
- SC-003: Required GitHub checks pass after feature memory and AI Review are refreshed on the new head SHA.
