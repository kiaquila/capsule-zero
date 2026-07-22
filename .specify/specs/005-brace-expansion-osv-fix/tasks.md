# Tasks: Brace Expansion OSV Fix

## Implementation

- [x] T001 Identify the OSV finding from the scheduled GitHub Actions log.
- [x] T002 Update the nested `brace-expansion` resolution in `app/package-lock.json` from `5.0.5` to `5.0.6`.
- [x] T003 Keep the lockfile diff limited to the vulnerable nested entry.
- [x] T004 Run local install/audit/lint verification.
- [x] T005 Open PR #23 for the isolated security fix.
- [x] T006 Add feature memory required by the PR guard.

### Required-Gate Follow-up (2026-07-22)

- [x] T007 Add `osv-scan` to the active `main protection` ruleset without
  changing the other required checks or bypass policy.
- [x] T008 Synchronize the canonical required-check lists and PR checklist.
- [x] T009 Inspect the failing PR #93 OSV log and identify `sharp@0.34.5` and
  `fast-uri@3.1.3` as the two High findings.
- [x] T010 Reuse the focused dependency upgrade already verified by PR #92
  instead of generating a second lockfile resolution.
- [x] T011 Extend this existing OSV feature memory for the follow-up rather
  than add another dependency-security spec.
- [x] T012 Run repository, app, dependency-tree, and image-encode verification
  before pushing the final PR head.

## Process Memory

### Dead Ends

- Local Docker CLI is installed, but the Docker daemon was not running, so the GitHub OSV action image could not be executed locally.
- `npx osv-scanner` is not available because `osv-scanner` is not published as an npm package.
- Go is not installed locally, so the official OSV scanner could not be run via `go run`.

### Decisions

- Use a minimal lockfile-only fix instead of broad `npm update` output because npm added unrelated `peer: true` metadata churn.
- Preserve older `brace-expansion@1.x` entries because the GitHub OSV finding targeted the nested `5.0.5` dev dependency.
- Reuse commit `8731676` from PR #92 for the `sharp`/`fast-uri` upgrade; it is
  already limited to the vulnerable packages and has a green OSV run.
- Keep `osv-scan` fail-closed in the ruleset. Fix the dependency state rather
  than bypassing, suppressing, or temporarily removing the new required gate.
- Extend spec `005` because it already owns focused OSV dependency remediation;
  a new feature-memory folder would duplicate that responsibility.

### Known Issues

- None for the lockfile change. GitHub Actions remains the authoritative OSV verification path for this PR.
- PR #92 carries the same dependency commit. Until one PR merges, both remain
  intentionally self-contained; Git will deduplicate the identical patch when
  the other branch is refreshed from `main`.
