# Spec: Linguist Language Stats Hygiene

## Goal

Make the GitHub Languages widget reflect Capsule Zero product/runtime code more honestly by excluding repository scaffolding, approved HTML prototypes, and generated OpenAPI clients from Linguist statistics while keeping tests visible.

## Scope

In scope:

- add a root `.gitattributes` with explicit Linguist overrides
- mark root repository tooling scripts and Spec Kit shell helpers as `linguist-vendored`
- mark `html-prototypes/**` as `linguist-documentation`
- mark generated API clients under `app`, `web`, and `mobile` as `linguist-generated`
- verify that `tests/**` remains counted by leaving it unmatched by every override

Out of scope:

- hiding test code from Linguist statistics
- hiding hand-written product code, provider code, app screens, API handlers, Go code, or React Native code
- hiding legacy Supabase or deploy SQL/shell code; those paths should be removed by their planned cleanup PR rather than masked here
- changing CI, runtime behavior, or generated client contents

## User Stories

### US1: Honest Language Widget

As the founder, I want GitHub's Languages widget to exclude scaffolding and generated clients so it better represents the active implementation mix.

### US2: Keep Tests Visible

As a maintainer, I want test code to remain counted so the repository still shows the language footprint of the verification suite.

### US3: Explain Generated Clients

As a reviewer, I want generated OpenAPI clients to be clearly marked as generated so repeated machine-written API bindings do not inflate TypeScript or Dart totals.

## Acceptance Criteria

- AC-001: `.gitattributes` marks `scripts/*.mjs` and `.specify/scripts/bash/**` as `linguist-vendored`.
- AC-002: `.gitattributes` marks `html-prototypes/**` as `linguist-documentation`.
- AC-003: `.gitattributes` marks `app/src/lib/api/generated/**` and `mobile/lib/api/generated/**` as `linguist-generated`.
- AC-004: Representative files under `tests/**` report `linguist-vendored`, `linguist-generated`, and `linguist-documentation` as `unspecified`.
- AC-005: Representative hand-written product files report the same Linguist attributes as `unspecified`.

## Negative Scenarios

- NS-001: Do not mark `tests/**` as vendored, generated, or documentation.
- NS-002: Do not mark hand-written app/API/mobile product code as vendored, generated, or documentation.
- NS-003: Do not use broad globs that hide future product code outside the intended scaffolding and generated-client paths.
- NS-004: Do not edit generated client contents, prototypes, tests, or runtime source as part of this metadata-only change.

## Requirements

- FR-001: Add a root `.gitattributes` with a stable commented hygiene block.
- FR-002: Use `linguist-vendored` only for repository scaffolding/tooling paths.
- FR-003: Use `linguist-documentation` for approved HTML prototypes.
- FR-004: Use `linguist-generated` for generated OpenAPI client directories.
- FR-005: Record `git check-attr` evidence in the verification plan.

## Success Criteria

- SC-001: `git check-attr` reports the intended attributes for scaffolding, prototypes, and generated clients.
- SC-002: `git check-attr` reports `unspecified` for tests and representative hand-written product code.
- SC-003: GitHub recalculates the Languages widget after the committed `.gitattributes` reaches the default branch.

## Assumptions

- GitHub Linguist honors `.gitattributes` overrides after the file is committed to the default branch.
- The generated API clients are derived from `docs_capsule_zero/adr/openapi.yaml` and should not be treated as hand-written implementation code.
- The HTML prototypes are approved design documentation and should not dominate the implementation language widget.
