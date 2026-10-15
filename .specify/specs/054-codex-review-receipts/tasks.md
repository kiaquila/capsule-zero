# Tasks 054 — Native Codex Review Receipts

## Tasks

- [x] Reproduce the incompatibility using PR #161's authentic prefixed receipt.
- [x] Extend the existing helper while preserving trusted-author and SHA checks.
- [x] Test owner-dispatched recovery and its negative authorization scenarios.
- [x] Update the canonical contract, recovery runbook and feature memory.
- [x] Run the 32 library/workflow tests and repository baseline checks.

Final delivery is controlled by PR #163's current-head native review, five required
checks and resolved threads. The post-merge Dependabot pilot is a separate live check.

## Process Memory

### Dead Ends

- Rerunning the old default-branch gate cannot recognize the new native receipt.
- A bare compound Bash test with `set -e` did not reliably stop invalid inputs in
  the local shell regression. Recovery uses an explicit conditional and `exit 1`.
- The first review found the canonical contract and feature memory missing from
  the initial repair diff; both are now included in the same PR.

### Decisions

- Strip only the observed v1 prefix; do not relax author or reviewed-commit checks.
- Require native clean review before selecting immutable recovery gate code.
- Keep normal events on default-branch helpers and preserve all merge protection.

### Known Issues

- Before this repair reaches `main`, affected PRs still use the incompatible old
  parser. Their branches must be refreshed and newly changed heads reviewed afterward.
