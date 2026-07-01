# Plan: Linguist Language Stats Hygiene

## Summary

Add a root `.gitattributes` file that excludes only Capsule Zero scaffolding/tooling, HTML prototype documentation, and generated API clients from GitHub Linguist language statistics while keeping tests and hand-written product code counted.

## Technical Context

- runtime changes: none
- dependencies: none
- product paths: `.gitattributes`, `.specify/specs/029-linguist-language-stats/`
- verification command: `git check-attr`

## Scope Boundaries

- in scope: Linguist metadata and feature memory
- out of scope: app behavior, generated client regeneration, CI behavior, Supabase legacy cleanup

## Constitution Check

- Spec-first: this feature folder records goal, scope, and verification before PR completion.
- Testable boundaries: `git check-attr` proves the metadata behavior locally before GitHub recalculates the language bar.
- PR-only: the change is prepared on a dedicated branch from fresh `origin/main`.
- Simplicity: use direct `.gitattributes` path rules; no helper script or automation is needed.
- Product quality: the visible repository language mix will better match active implementation work without hiding tests.

## Verification

| Acceptance criterion | Evidence                                                                                                                                                                                                                                 |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-001               | `git check-attr linguist-vendored -- scripts/ai-review-gate.mjs .specify/scripts/bash/common.sh` reports `set`.                                                                                                                          |
| AC-002               | `git check-attr linguist-documentation -- html-prototypes/index.html` reports `set`.                                                                                                                                                     |
| AC-003               | `git check-attr linguist-generated -- app/src/lib/api/generated/openapi.ts mobile/lib/api/generated/openapi.dart` reports `set`.                                                                                                         |
| AC-004               | `git check-attr linguist-vendored linguist-generated linguist-documentation -- tests/e2e/pages/LandingPage.ts tests/e2e/specs/landing/auth-popup.spec.ts tests/e2e/eslint.config.mjs` reports `unspecified` for every queried attribute. |
| AC-005               | `git check-attr linguist-vendored linguist-generated linguist-documentation -- app/src/lib/providers/api/index.ts api/internal/auth/auth.go mobile/lib/main.dart` reports `unspecified` for every queried attribute.                     |

Negative scenario evidence:

- The same `tests/**` and hand-written product-code checks cover NS-001 and NS-002.
- The `.gitattributes` diff uses only explicit top-level scaffolding and generated-client directories, covering NS-003.
- The file diff touches metadata and feature memory only, covering NS-004.

## Risks

- Risk: Overbroad overrides could hide real implementation work.
  Mitigation: keep tests and representative product paths in the verification table and avoid repository-wide language globs.

- Risk: Generated OpenAPI clients may be mistaken for hand-written API code.
  Mitigation: only the `*/src/lib/api/generated/**` and `mobile/lib/api/generated/**` directories are marked generated; provider adapters and API handlers stay counted.

- Risk: The GitHub widget may not update immediately after merge.
  Mitigation: `git check-attr` provides deterministic local evidence; GitHub recalculates after the committed `.gitattributes` lands on the default branch.
