# Implementation Plan: Brace Expansion OSV Fix

**Branch**: `codex/fix-brace-expansion-osv` | **Date**: 2026-06-05 | **Spec**: `.specify/specs/005-brace-expansion-osv-fix/spec.md`
**Input**: Feature specification from `.specify/specs/005-brace-expansion-osv-fix/spec.md`

## Summary

Update only the nested `brace-expansion` lockfile resolution that OSV flagged, then verify the app lockfile still installs and linting still passes.

## Technical Context

**Language/Version**: TypeScript / JavaScript, Node.js app tooling  
**Primary Dependencies**: npm, Next.js app dependency lockfile  
**Storage**: N/A  
**Testing**: npm install/audit/lint commands  
**Target Platform**: Web app development and GitHub Actions dependency scanning  
**Project Type**: Web application maintenance  
**Performance Goals**: N/A  
**Constraints**: Minimal security PR with no product behavior change  
**Scale/Scope**: One lockfile entry and feature-memory docs

## Constitution Check

- Glassmorphism UI language: N/A, no UI changes.
- Achromatic interface: N/A, no UI changes.
- Capsule methodology: N/A, no domain behavior changes.
- Direct, not dictate: N/A, no user-facing behavior changes.
- Premium quality bar: dependency gates should pass before development resumes.

## Verification

| Acceptance criterion | Evidence |
| -------------------- | -------- |
| `FR-001` | `rg -n 'brace-expansion-5\\.0\\.5|"version": "5\\.0\\.5"' app/package-lock.json` has no vulnerable nested `5.0.5` match after the change; `app/package-lock.json` now resolves the nested entry to `5.0.6`. |
| `FR-002` | `git diff --stat` shows the dependency fix plus this feature-memory folder; the lockfile code diff is only `6` changed lines. |
| `FR-003` | `npm ci --ignore-scripts` in `app`; `npm audit --package-lock-only` in `app`; `npm run lint` in `app`. |
| `SC-001` | PR #23 `osv-scan` check on GitHub Actions. |

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
└── package-lock.json
```

**Structure Decision**: Use the existing app lockfile in place; no new source structure is introduced.

## Complexity Tracking

No constitution violations.
