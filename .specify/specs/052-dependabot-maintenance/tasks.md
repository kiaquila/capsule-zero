# Tasks 052 — Dependabot Maintenance

## Tasks

- [x] T001 Identify the failing required checks on the first dependency PR.
- [x] T002 Add dependency-maintenance feature memory and a non-application TDD waiver.
- [x] T003 Refresh vulnerable transitive dependencies without advisory suppression.
- [x] T004 Run local manifest, lockfile, and repository verification.
- [ ] T005 Request Codex review on the final head and resolve any findings.
- [ ] T006 Confirm all required checks and review threads are green before merge.

## Process Memory

### Dead Ends

- Treating a Dependabot-generated lockfile as sufficient failed because the repository
  guard also requires complete feature memory for any `/app` manifest change.

### Decisions

- Dependency-only maintenance uses the existing repository checks instead of adding
  product tests or application behavior.
- Vulnerable transitive packages are upgraded to fixed releases; OSV ignores are not
  added.

### Known Issues

- Final GitHub checks and native Codex review remain pending until the maintenance
  commit is pushed to the Dependabot branch.
