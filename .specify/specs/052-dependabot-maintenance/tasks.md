# Tasks 052 — Dependabot Maintenance

## Tasks

- [x] T001 Identify the failing required checks on the first dependency PR.
- [x] T002 Add dependency-maintenance feature memory and a non-application TDD waiver.
- [x] T003 Refresh vulnerable transitive dependencies without advisory suppression.
- [x] T004 Run local manifest, lockfile, and repository verification.
- [x] T005 Request Codex review on the final PR #145 head and resolve its findings.
- [x] T006 Confirm all required PR #145 checks and review threads are green before merge.
- [x] T007 Sync PR #146 with the sequentially merged #145 baseline.
- [x] T008 Verify the app `@types/node` 26 update against clean install, static checks,
      and production build.
- [ ] T009 Complete required GitHub checks and native Codex review for PR #146.

## Process Memory

### Dead Ends

- Treating a Dependabot-generated lockfile as sufficient failed because the repository
  guard also requires complete feature memory for any `/app` manifest change.

### Decisions

- Dependency-only maintenance uses the existing repository checks instead of adding
  product tests or application behavior.
- Vulnerable transitive packages are upgraded to fixed releases; OSV ignores are not
  added.
- The grouped Dependabot update does not advance the frozen Supabase package graph;
  those manifest and lockfile records stay identical to `origin/main`.
- Linux Next/SWC native records retain their `libc` selectors so npm installs only the
  binary compatible with the target image.
- PR #146 advances development-only Node declarations without changing the supported
  runtime engine or any runtime package.

### Known Issues

- PR #146 required GitHub checks and native Codex review remain pending until its
  maintenance commit is pushed to the Dependabot branch.
