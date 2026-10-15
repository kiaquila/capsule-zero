# Tasks 054 — Native Codex Review Receipts

## Tasks

- [x] Reproduce the incompatibility using PR #161's authentic prefixed receipt.
- [x] Extend the existing helper while preserving trusted-author and SHA checks.
- [x] Test owner-labeled recovery and its negative authorization scenarios.
- [x] Update the canonical contract, recovery runbook and feature memory.
- [x] Run the 35 library/workflow tests and repository baseline checks.

Final delivery is controlled by PR #163's current-head native review, five required
checks and resolved threads. The post-merge Dependabot pilot is a separate live check.

## Process Memory

### Dead Ends

- ECR rejected the same pinned Go test image in three successive hosted attempts
  with `toomanyrequests: Data limit exceeded`. Stop rerunning the unchanged failure;
  use SHA-pinned official setup-go with the exact go.mod version, keeping vet/tests
  and production ECR builds intact.

- A fixed praise whitelist rejected a genuine "Bravo." receipt. A prose denylist
  then failed review because arbitrary contradictory text could pass. Recovery now
  requires the latest exact full-SHA native JSON state with explicit clean flags;
  receipt wording cannot authorize selection of PR gate code.

- Rerunning the old default-branch gate cannot recognize the new native receipt.
- A bare compound Bash test with `set -e` did not reliably stop invalid inputs in
  the local shell regression. Recovery uses an explicit conditional and `exit 1`.
- The first review found the canonical contract and feature memory missing from
  the initial repair diff; both are now included in the same PR.

- Manual dispatch cannot satisfy required PR checks; recovery instead uses the
  owner-authored `pull_request: labeled` event. A persistent label cannot authorize
  later pushes.

### Decisions

- Ordinary label events execute the normal required validator. Skipping its job
  would report success and could cancel a genuine in-progress check.

- Strip only the observed v1 prefix; do not relax author or reviewed-commit checks.
- Require native clean review before selecting immutable recovery gate code.
- Keep normal events on default-branch helpers and preserve all merge protection.

### Known Issues

- Before this repair reaches `main`, affected PRs still use the incompatible old
  parser. Their branches must be refreshed and newly changed heads reviewed afterward.
