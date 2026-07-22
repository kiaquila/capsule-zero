# Implementation Plan: Brace Expansion OSV Fix

**Branch**: `codex/fix-brace-expansion-osv` | **Date**: 2026-06-05 | **Spec**: `.specify/specs/005-brace-expansion-osv-fix/spec.md`
**Input**: Feature specification from `.specify/specs/005-brace-expansion-osv-fix/spec.md`

## Summary

Update only the nested `brace-expansion` lockfile resolution that OSV flagged, then verify the app lockfile still installs and linting still passes.

The 2026-07-22 follow-up promotes `osv-scan` to a required `main` gate and
reuses the focused dependency fix from PR #92 for newly published `sharp` and
`fast-uri` advisories. No application source or product behavior changes.

## Technical Context

**Language/Version**: TypeScript / JavaScript, Node.js app tooling  
**Primary Dependencies**: npm, Next.js app dependency lockfile  
**Storage**: N/A  
**Testing**: npm install/audit/lint commands  
**Target Platform**: Web app development and GitHub Actions dependency scanning  
**Project Type**: Web application maintenance  
**Performance Goals**: N/A  
**Constraints**: Scoped security changes with no product behavior change
**Scale/Scope**: Two dependency overrides, their lockfile closure, branch rules, and merge-contract docs

## Constitution Check

- Glassmorphism UI language: N/A, no UI changes.
- Achromatic interface: N/A, no UI changes.
- Capsule methodology: N/A, no domain behavior changes.
- Direct, not dictate: N/A, no user-facing behavior changes.
- Premium quality bar: dependency gates should pass before development resumes.

## Verification

### Original verification (2026-06-05)

| Acceptance criterion | Evidence |
| -------------------- | -------- |
| `FR-001` | `rg -n 'brace-expansion-5\\.0\\.5|"version": "5\\.0\\.5"' app/package-lock.json` has no vulnerable nested `5.0.5` match after the change; `app/package-lock.json` now resolves the nested entry to `5.0.6`. |
| `FR-002` | `git diff --stat` shows the dependency fix plus this feature-memory folder; the lockfile code diff is only `6` changed lines. |
| `FR-003` | `npm ci --ignore-scripts` in `app`; `npm audit --package-lock-only` in `app`; `npm run lint` in `app`. |
| `SC-001` | PR #23 `osv-scan` check on GitHub Actions. |

### Required-gate follow-up verification (2026-07-22)

| Acceptance criterion | Evidence |
| -------------------- | -------- |
| `FR-004` | `npm --prefix app ls sharp fast-uri --depth=8` resolves only `sharp@0.35.0` and `fast-uri@3.1.4`; both are pinned in the existing overrides block. |
| `FR-005` | `git diff origin/main -- app/package.json app/package-lock.json` is limited to the two overrides plus the `sharp` dependency closure and `fast-uri`. |
| `FR-006` | GitHub ruleset API for `main protection` ID `18282361` returns `osv-scan` with GitHub Actions integration ID `15368` in `required_status_checks`. |
| `FR-007` | Repository diff updates `AGENTS.md`, `CLAUDE.md`, `PRODUCT-PLAN.md`, the CI/branch-protection and SENAR runbooks, ADR-004, and the PR template. |
| `SC-004` | PR #93 `osv-scan` on the current head SHA is the authoritative remote evidence; local equivalent uses the CI-pinned OSV Scanner `v2.3.5`. |
| `SC-005` | `npm --prefix app run typecheck`, `npm --prefix app run lint`, `npm --prefix app run build`, and a `sharp@0.35.0` AVIF/WebP encode smoke pass. |
| `SC-006` | GitHub PR #93 merge state, required-check rollup, reviews, and review-thread query on the final head SHA. |

Negative scenario evidence:

- `git diff -- app/package-lock.json` shows no app source-code changes and no unrelated package metadata churn.

## Project Structure

### Documentation (this feature)

```text
.specify/specs/005-brace-expansion-osv-fix/
├── plan.md
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
app/
├── package.json
└── package-lock.json
```

**Structure Decision**: Use the existing app lockfile in place; no new source structure is introduced.

## Complexity Tracking

No constitution violations.
