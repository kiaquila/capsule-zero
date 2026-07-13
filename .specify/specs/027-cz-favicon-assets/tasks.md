# Tasks: Cz Favicon Assets

**Input**: `.specify/specs/027-cz-favicon-assets/spec.md`, `plan.md`

## Phase 1: Asset Delivery

- [x] T001 Replace `app/src/app/favicon.ico` with a transparent multi-size Cz wordmark favicon.
- [x] T002 Add `app/src/app/icon.png` as a transparent 512x512 Cz wordmark icon.
- [x] T003 Confirm Next.js App Router file conventions need no runtime code change for these files.
- [x] T018 Replace the non-adaptive `app/src/app/icon.png` with `app/src/app/icon.svg`.
- [x] T019 Add a `prefers-color-scheme: dark` SVG override so the Cz mark switches from `#1C1C1C` to `#EDEDED`.
- [x] T020 Confirm current Next.js metadata file convention docs support `icon.svg` under `app/`.

## Phase 2: Feature Memory

- [x] T004 Inspect the failed `guard` check and confirm it requires a complete feature-memory folder for `app/` product-root changes.
- [x] T005 Add `.specify/specs/027-cz-favicon-assets/spec.md`.
- [x] T006 Add `.specify/specs/027-cz-favicon-assets/plan.md`.
- [x] T007 Add `.specify/specs/027-cz-favicon-assets/tasks.md`.
- [x] T008 Record the static-asset TDD waiver in the spec and plan.
- [x] T021 Update `.specify/specs/027-cz-favicon-assets/{spec,plan,tasks}.md` for the theme-adaptive SVG follow-up.

## Phase 3: Verification

- [x] T009 Record prior `sips -g hasAlpha -g pixelWidth -g pixelHeight app/src/app/icon.png` evidence for the original PNG package before the SVG follow-up superseded it.
- [x] T010 Run `magick identify app/src/app/favicon.ico` to confirm the unchanged ICO fallback keeps 16x16, 32x32, and 48x48 entries.
- [x] T011 Run `git diff --name-status origin/main...HEAD -- app/src/app`.
- [x] T012 Run `git diff --check origin/main...HEAD`.
- [x] T013 Run `node scripts/check-feature-memory.mjs origin/main HEAD`.
- [x] T022 Run `xmllint --noout app/src/app/icon.svg`.
- [x] T023 Run `rg -n "prefers-color-scheme: dark|#1C1C1C|#EDEDED" app/src/app/icon.svg`.
- [x] T024 Run `test -f app/src/app/favicon.ico && test -f app/src/app/icon.svg && test ! -e app/src/app/icon.png`.
- [ ] T014 Push the feature-memory update to `feat/favicon-theme-adaptive-svg`.
- [ ] T015 Update PR #59 body so the SENAR Done Gate references this feature-memory package.
- [ ] T016 Trigger or await a fresh review after the final pushed head SHA is available.
- [ ] T017 Recheck PR #59 checks until `guard`, `baseline-checks`, `test`, and `osv-scan` are green.

## Process Memory _(mandatory - required by SENAR; written before declaring work complete)_

### Dead Ends

- The original PR body treated the change as asset-only with no spec. That documented the practical scope correctly, but the repository `guard` workflow still requires complete feature memory whenever a product root under `app/` changes.
- Considered leaving this as a PR-body-only SENAR waiver. Rejected because the machine gate only accepts a changed `.specify/specs/<feature-id>/{spec,plan,tasks}.md` package.
- The first favicon asset PR shipped a transparent PNG app icon, but review on PR #59 confirmed the follow-up must also update feature memory because replacing that product-root asset with SVG still changes `app/`.

### Decisions

- **Feature folder is `027-cz-favicon-assets`**. Reason: `origin/main` currently has specs through `025`, and the parallel `feat/026-dev-cd-pipeline` branch already owns `026-dev-cd-pipeline`.
- **No app code change**. Reason: Next.js already discovers `favicon.ico` and `icon.svg` by file convention.
- **TDD waiver is explicit**. Reason: the repository requires TDD for product behavior in specs >= 025; this PR changes static binary assets only, so executable behavior tests would be noise.
- **Verification uses image metadata commands**. Reason: binary assets cannot be reviewed with meaningful line diffs.
- **Theme-adaptive follow-up stays in feature folder `027-cz-favicon-assets`**. Reason: this is the same favicon asset surface, not a new product feature.
- **Use `icon.svg` instead of parallel PNG and SVG assets**. Reason: Next.js supports SVG under the `icon` convention, and a single modern source prevents browsers from selecting the stale non-adaptive PNG.
- **Keep `favicon.ico` unchanged as fallback**. Reason: some clients may not support SVG favicons, and the existing ICO already covers legacy browser requests.

### Known Issues

- The transparent black wordmark can be faint on dark browser tab backgrounds if a client ignores the SVG dark-mode media query. `favicon.ico` remains the legacy fallback; the modern `icon.svg` covers browsers that honor SVG media queries.
- The local `main` branch in an existing worktree was stale versus `origin/main`; all PR readiness checks here use fresh `origin/main` and the PR head instead.
