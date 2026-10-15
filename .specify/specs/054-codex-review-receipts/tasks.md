# Tasks 054 — Native Codex Review Receipts

## Tasks

- [x] Reproduce the incompatibility using PR #161's authentic prefixed receipt.
- [x] Extend the existing helper while preserving trusted-author and SHA checks.
- [x] Test owner-triggered PR-label recovery and its negative authorization scenarios.
- [x] Update the canonical contract, recovery runbook and feature memory.
- [x] Run the 46 library/workflow tests and repository baseline checks.

Final delivery is controlled by PR #163's current-head native review, five required
checks and resolved threads. The post-merge Dependabot pilot is a separate live check.

## Process Memory

### Dead Ends

- Rerunning the old default-branch gate cannot recognize the new native receipt.
- A bare compound Bash test with `set -e` did not reliably stop invalid inputs in
  the local shell regression. Recovery uses an explicit conditional and `exit 1`.
- The first review found the canonical contract and feature memory missing from
  the initial repair diff; both are now included in the same PR.

- The full local preflight exhausted the host disk after lint; remove only dependencies
  installed for this attempt and use required GitHub CI for full validation.

- Native review identified that a `workflow_dispatch` check is not evaluated by PR
  required-check rules. Recovery now uses the owner's `pull_request: labeled` event
  after native clean review of the exact event head, with no write-token expansion.

### Decisions

- Strip only the observed v1 prefix; reject duplicate/conflicting content and retain
  author, current-head and abbreviation-uniqueness checks.
- Structured summaries are current-head wake-up signals only. Native receipts and
  formal reviews retain ownership of the verdict; reactions and table text do not.
- Handle edited events and sort receipts by updated time. Bound active-run waiting
  and deduplicate reruns by evidence timestamp versus the latest run attempt.
- Check unresolved native threads across heads and recheck HEAD before success/rerun.
- Require native clean review before selecting immutable recovery gate code.
- Keep normal events on default-branch helpers and preserve all merge protection.

### Known Issues

- Before this repair reaches `main`, affected PRs still use the incompatible old
  parser. Their branches must be refreshed and newly changed heads reviewed afterward.
