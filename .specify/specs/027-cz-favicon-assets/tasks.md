# Tasks: Cz Favicon Assets

**Input**: `.specify/specs/027-cz-favicon-assets/spec.md`, `plan.md`

## Phase 1: Asset Delivery

- [x] T001 Replace `app/src/app/favicon.ico` with a transparent multi-size Cz wordmark favicon.
- [x] T002 Add `app/src/app/icon.png` as a transparent 512x512 Cz wordmark icon.
- [x] T003 Confirm Next.js App Router file conventions need no runtime code change for these files.

## Phase 2: Feature Memory

- [x] T004 Inspect the failed `guard` check and confirm it requires a complete feature-memory folder for `app/` product-root changes.
- [x] T005 Add `.specify/specs/027-cz-favicon-assets/spec.md`.
- [x] T006 Add `.specify/specs/027-cz-favicon-assets/plan.md`.
- [x] T007 Add `.specify/specs/027-cz-favicon-assets/tasks.md`.
- [x] T008 Record the static-asset TDD waiver in the spec and plan.

## Phase 3: Verification

- [x] T009 Run `sips -g hasAlpha -g pixelWidth -g pixelHeight app/src/app/icon.png`.
- [x] T010 Run `magick identify app/src/app/favicon.ico`.
- [x] T011 Run `git diff --name-status origin/main...HEAD -- app/src/app`.
- [x] T012 Run `git diff --check origin/main...HEAD`.
- [x] T013 Run `node scripts/check-feature-memory.mjs origin/main HEAD`.
- [ ] T014 Push the feature-memory update to `chore/cz-favicon`.
- [ ] T015 Update PR #54 body so the SENAR Done Gate references this feature-memory package instead of saying no spec exists.
- [ ] T016 Trigger a fresh Codex review with `@codex review` after the final pushed head SHA is available.
- [ ] T017 Recheck PR #54 checks until `guard`, `baseline-checks`, `test`, `AI Review`, and `osv-scan` are green.

## Process Memory _(mandatory - required by SENAR; written before declaring work complete)_

### Dead Ends

- The original PR body treated the change as asset-only with no spec. That documented the practical scope correctly, but the repository `guard` workflow still requires complete feature memory whenever a product root under `app/` changes.
- Considered leaving this as a PR-body-only SENAR waiver. Rejected because the machine gate only accepts a changed `.specify/specs/<feature-id>/{spec,plan,tasks}.md` package.

### Decisions

- **Feature folder is `027-cz-favicon-assets`**. Reason: `origin/main` currently has specs through `025`, and the parallel `feat/026-dev-cd-pipeline` branch already owns `026-dev-cd-pipeline`.
- **No app code change**. Reason: Next.js already discovers `favicon.ico` and `icon.png` by file convention.
- **TDD waiver is explicit**. Reason: the repository requires TDD for product behavior in specs >= 025; this PR changes static binary assets only, so executable behavior tests would be noise.
- **Verification uses image metadata commands**. Reason: binary assets cannot be reviewed with meaningful line diffs.

### Known Issues

- The transparent black wordmark can be faint on dark browser tab backgrounds. This is an accepted visual trade-off of the requested transparent Cz mark, not a merge blocker for the asset replacement.
- The local `main` branch in an existing worktree was stale versus `origin/main`; all PR readiness checks here use fresh `origin/main` and the PR head instead.
