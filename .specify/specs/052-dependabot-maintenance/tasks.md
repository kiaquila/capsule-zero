# Tasks 052 — Dependabot Maintenance

## Tasks

- [x] T001 Identify the failing required checks on the first dependency PR.
- [x] T002 Add dependency-maintenance feature memory and a non-application TDD waiver.
- [x] T003 Refresh vulnerable transitive dependencies without advisory suppression.
- [x] T004 Run local manifest, lockfile, and repository verification.
- [x] T005 Request Codex review on the final PR #145 head and resolve its findings.
- [x] T006 Confirm all required PR #145 checks and review threads are green before merge.
- [x] T007 Sync PR #146 with the sequentially merged #145 baseline.
- [x] T008 Reject the isolated app `@types/node` 26 update, restore the Node 22
      declaration graph, and verify clean install, typecheck, and production build.
- [x] T009 Replace vulnerable `sharp` and `source-map-js` releases and document the
      exact, expiring no-fix `braces` exception.
- [x] T010 Complete required GitHub checks and native Codex review for PR #146.
- [x] T011 Reproduce PR #147's ESLint 10 peer conflict and restore the supported
      ESLint 9.39.4 manifest and lockfile graph.
- [x] T012 Complete required GitHub checks and native Codex review for PR #147.
- [x] T013 Reject PR #148's isolated e2e Node 26 declarations and restore the verified
      Node 22 manifest and lockfile graph.
- [x] T014 Complete required GitHub checks and native Codex review for PR #148.
- [x] T015 Sync PR #149 with the sequentially merged baseline and verify the coordinated
      AWS SDK/Smithy patch module graph through tidy, verify, vet, tests, and OSV.
- [x] T016 Complete required GitHub checks and native Codex review for PR #149.
- [x] T017 Sync PR #150 with the sequential baseline, preserve the frozen Supabase
      graph, and remediate the fixable `golang.org/x/text` advisory.
- [x] T018 Complete required GitHub checks and native Codex review for PR #150.
- [x] T019 Sync PR #151 with the sequential baseline and verify the S3 client update
      through tidy, module verification, vet, tests, and OSV.
- [x] T020 Complete required GitHub checks and native Codex review for PR #151.
- [x] T021 Reproduce PR #152's ESLint 10 peer conflict and restore the supported
      ESLint 9.39.4 manifest and lockfile graph.
- [x] T022 Complete required GitHub checks and native Codex review for PR #152.
- [x] T023 Reject PR #153's isolated app Node 26 declarations and restore the verified
      Node 22 manifest and lockfile graph.
- [x] T024 Complete required GitHub checks and native Codex review for PR #153.
- [x] T025 Reject PR #154's isolated e2e Node 26 declarations and restore the verified
      Node 22 manifest and lockfile graph.
- [ ] T026 Complete required GitHub checks and native Codex review for PR #154.

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
- PR #146 keeps development declarations on Node 22 because a compiler-only pass with
  Node 26 types cannot prove those APIs exist in the deployed Node 22 runtime.
- PR #146 updates `sharp` and `source-map-js` to the first patched releases reported by
  their current GitHub advisories instead of suppressing those findings.
- `braces` 3.0.3 is dev-only through stylelint/micromatch, receives only
  repository-controlled glob input, and has no patched npm release as of 2026-10-06;
  its exact exception expires on 2026-11-06.
- PR #147 keeps ESLint 9.39.4 because the latest JSX accessibility, import, and React
  plugins still declare peer support only through ESLint 9; peer-ignore flags are not
  an acceptable compatibility strategy.
- PR #148 keeps e2e declarations on Node 22 because its engine and every executable
  runtime contract remain on Node 22.
- PR #149 keeps the Dependabot-generated AWS SDK/Smithy patch set together because Go
  resolves matching direct and transitive modules as one verified graph.
- PR #150 accepts the supported Next, next-intl, stylelint, ESLint, and typescript-eslint
  maintenance updates while leaving the frozen Supabase dependency graph unchanged.
- PR #150 updates `golang.org/x/text` to the first OSV-reported fixed release instead
  of suppressing GO-2026-6629.
- PR #151 accepts the isolated S3 client minor update because the resolved AWS module
  graph remains internally consistent and passes API regression coverage.
- PR #152 keeps ESLint 9.39.4 because `eslint-plugin-jsx-a11y` 6.10.2 rejects
  ESLint 10.12.0; bypassing peer resolution would leave an unsupported lint graph.
- PR #153 keeps app declarations on Node 22 because the repository engine and every
  required executable workflow still use Node 22.
- PR #154 keeps e2e declarations on Node 22 because its engine and required test
  workflow continue to execute Node 22.

### Known Issues

- PR #154 required GitHub checks and native Codex review remain pending on the
  restored e2e Node 22 declaration graph.
- The dev-only `braces` exception must be removed or renewed with fresh upstream
  evidence by 2026-11-06.
