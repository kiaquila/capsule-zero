# Implementation Plan: GSD Architecture Validation

## Technical Approach

1. Create a clean branch from current `origin/main` so the validation includes
   the merged OSV fix and Sprint 0 foundation.
2. Use Context7 and a pinned GSD Core CLI probe to confirm current setup and
   convergence mechanics.
3. Read current architecture, backend, frontend, mobile, API, Supabase, and
   Sprint 0 docs to build a codebase-grounded validation snapshot.
4. Commit a repo-native architecture report instead of introducing `.planning/`
   as a competing planning source.
5. Update the Phase 5 entrance checklist to include architecture convergence
   validation around founder approval.

## Verification

| Acceptance criterion                                         | Evidence                                                                                                                                                                                                                                                            |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-001: GSD version/setup/runbook documented                 | `npx --yes @opengsd/gsd-core@1.3.1 --help`; `npx --yes @opengsd/gsd-core@1.3.1 --codex --global --config-dir /tmp/capsule-zero-gsd-codex-config --profile=standard`; report section "GSD Core Probe".                                                               |
| FR-002: Current repo evidence used                           | `npm run check:repo`; `npm run check:api-contract`; `npm run check:runtime-tooling -- --allow-missing`; `npm run check:runtime-env -- --env app/.env.local.example --env mobile/.env.example --allow-placeholders`; report section "Repository Readiness Snapshot". |
| FR-003: Stack vs approval blockers separated                 | Report sections "Decision Delta", "Remaining Sprint 0 Blockers", and "Advisory Concerns".                                                                                                                                                                           |
| FR-004: No competing `.planning/` source committed           | `git status --short` and final diff show only Capsule Zero docs/spec files.                                                                                                                                                                                         |
| FR-005: Phase 5 checklist updated                            | Diff in `docs_capsule_zero/project/architecture/phase-5-entrance-checklist.md`.                                                                                                                                                                                     |
| Negative scenario: native GSD unavailable in current surface | Report notes formal native GSD pass is not claimed and provides future native runbook.                                                                                                                                                                              |

## Validation Commands

```bash
npm ci --ignore-scripts
npm run check:repo
npm run check:api-contract
npm run check:runtime-tooling -- --allow-missing
npm run check:runtime-env -- --env app/.env.local.example --env mobile/.env.example --allow-placeholders
npm run check:feature-memory -- --worktree
git diff --check
```
