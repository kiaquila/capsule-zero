# Tasks: JavaScript Toolchain Major Refresh

- [x] Rebase PR #108 on the latest `origin/main` and regenerate its root lockfile without
      losing the already merged minor/patch dependency refresh.
- [x] Verify lint-staged 17's runtime and configuration contract through Context7.
- [x] Raise the root Node engine and both required Node-based workflows to the supported
      Node 22 line.
- [x] Pass clean installs, staged-file verification, and the full CI-mode preflight.
- [ ] Trigger and clear the head-bound native Codex review and required GitHub checks.

## Process Memory

### Dead Ends

- Rebasing the generated PR directly produced expected conflicts in `package.json` and
  `package-lock.json` because PR #107 had updated adjacent root dependencies. Resolving
  from `origin/main` and regenerating only lint-staged preserved the merged graph.
- npm can install lint-staged 17 under an unsupported Node version with only an engine
  warning. A green install alone therefore is not compatibility evidence.

### Decisions

- Spec 049 was checked first and explicitly excludes major upgrades, so this separate
  reusable feature-memory unit owns PRs #108-#114.
- Use Node 22 in CI and declare `>=22.22.1` at the root instead of weakening or ignoring
  lint-staged 17's engine contract. The production web image already uses Node 22.
- Keep the existing `.husky/pre-commit` and `lint-staged.config.mjs`; upstream v17 still
  supports the current object/glob command configuration.
- PR #108's final local preflight completed with 78 passed and 8 intentionally skipped
  browser scenarios; no retry or toolchain-related failure remained.

### Known Issues

- PRs #109-#114 remain isolated major upgrades and need their own compatibility evidence
  before their checkboxes can be completed here.
