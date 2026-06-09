# Tasks: Stage 1 Capsule Result

**Input**: `.specify/specs/014-stage-1-capsule-result/spec.md`, `plan.md`

## Phase 1: Setup

- [x] T001 Refresh GitHub state with `git fetch --all --prune`.
- [x] T002 Confirm open PR status, CI state, latest merged PR, and `origin/main`.
- [x] T003 Create branch `codex/stage-1-capsule-result` from current `origin/main`.
- [x] T004 Fetch current Next.js App Router documentation through Context7.
- [x] T005 Fetch current next-intl App Router documentation through Context7.
- [x] T006 Read approved capsule result prototype, feature docs, screen docs, current dashboard/guided routes, i18n messages, category/methodology docs, and mock provider fixtures.

## Phase 2: Feature Memory

- [x] T007 Create SENAR spec, plan, and tasks files for `014-stage-1-capsule-result`.

## Phase 3: Route and Data

- [x] T008 Add `/{locale}/capsule-result` route that requires the existing mock session.
- [x] T009 Add canonical `/{locale}/capsule/{id}` route for the current mock capsule.
- [x] T010 Build a serializable capsule result snapshot from mock provider/category/catalog/color fixtures.

## Phase 4: Capsule Result UI

- [x] T011 Implement capsule result shell with sidebar/topbar, language switcher, sign-out, header, OPR, palette, counts, and responsive navigation.
- [x] T012 Implement Items tab with item cards, color dots, favorite toggle, local actions, and Add Item picker.
- [x] T013 Implement Outfits tab with static view-only outfit cards.
- [x] T014 Implement Gap Analysis and Shopping List tabs from current local capsule state.
- [x] T015 Add local-only remove/add/replace interactions with palette compatibility blocking and preview recalculation.
- [x] T016 Add EN/RU capsule result messages with no ES-AR active controls.
- [x] T017 Add responsive glass CSS for capsule result.
- [x] T018 Unlock dashboard capsule actions and Guided Journey handoff to the result screen.

## Phase 5: Verification

- [x] T019 Run `npm run check:feature-memory -- --worktree`.
- [x] T020 Run `npm --prefix app run lint`.
- [x] T021 Run `npm --prefix app run typecheck`.
- [x] T022 Run `npm --prefix app run build`.
- [x] T023 Run `npm run preflight`.
- [x] T024 Run `git diff --check`.
- [x] T025 Start local dev server.
- [x] T026 Browser smoke-check unauthenticated redirect, dashboard result link, Guided Journey handoff, EN/RU result, tab switching, local management interactions, compatibility blocking, and mobile viewport.
- [x] T027 Browser smoke-check restored Outfits view toggle icons and line/square layout behavior after user review.
- [x] T028 Remove temporary downloaded garment debug assets from the app before PR scope freeze.
- [x] T029 Address Codex review P2 findings: filter retired wardrobe statuses from picker candidates and sync tab state after URL query changes.

## Process Memory

### Dead Ends

- An old `next-server` process on port 3000 accepted connections but returned no bytes; stopped it and restarted a fresh `next dev` server on `127.0.0.1:3000`.
- The in-app browser tab that had seen the dead server remained on a generated Chrome error `data:` URL; opened a fresh tab after the server restart.
- The initial incompatible picker explanation depended on attempting to click an `aria-disabled` button; moved the reason into visible disabled-card copy so the block is explained immediately.

### Decisions

- Use `014-stage-1-capsule-result` because `013-stage-1-guided-journey` is merged and its known issue names Capsule Result as the next slice.
- Start from `origin/main` instead of local `main` because local `main` is stale and diverged.
- Keep `/capsule-result` as the Stage 1 review route because Dashboard and Guided Journey already link to it; add `/capsule/{id}` in the same slice to align with the canonical screen docs.
- Keep result mutations client-local in this slice; server-side capsule persistence and real recomputation remain later provider-backed work.
- Keep visible UI copy product-facing and move mock/local constraints to implementation and SENAR evidence instead of showing technical labels in the result screen.
- Match the Outfits view toggle to the approved prototype: filled three-line and 2x2 icons, line view as a horizontal layer row, square view as a 2x2 moodboard collage.
- Remove the temporary downloaded garment images before PR because they were only used for local visual inspection and are not part of the approved PR scope.
- Keep Add/Replace picker candidates limited to `active` and `uncapsulated` wardrobe statuses; `for_sale` and `for_repair` remain outside capsule composition until restored to wardrobe eligibility.
- Sync the active Capsule Result tab from `?tab=` on every client-side URL query change so dashboard/sidebar links keep working without a page reload.

### Known Issues

- No known issues after local preflight and browser smoke checks.
