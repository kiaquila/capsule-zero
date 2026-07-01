# Tasks: Stage 1 My Items

**Input**: `.specify/specs/015-stage-1-my-items/spec.md`, `plan.md`

## Phase 1: Setup

- [x] T001 Refresh GitHub state with `git fetch --all --prune`.
- [x] T002 Confirm open PR status, CI state, latest merged PR, and `origin/main`.
- [x] T003 Create branch `codex/stage-1-my-items` from current `origin/main`.
- [x] T004 Fetch current Next.js App Router documentation through Context7.
- [x] T005 Fetch current next-intl App Router documentation through Context7.
- [x] T006 Read approved My Items prototype, feature docs, screen docs, current dashboard/capsule navigation, i18n messages, categories, and mock provider fixtures.

## Phase 2: Feature Memory

- [x] T007 Create SENAR spec, plan, and tasks files for `015-stage-1-my-items`.

## Phase 3: Route and Data

- [x] T008 Add `/{locale}/my-items` route that requires the existing mock session.
- [x] T009 Remove `my-items` from the constrained future dashboard redirect route.
- [x] T010 Build a serializable My Items snapshot from mock provider/category/capsule/wardrobe fixtures.

## Phase 4: My Items UI

- [x] T011 Implement My Items shell with sidebar/topbar, language switcher, sign-out, filters, sort control, grid, detail panel, toast/notice, mobile bottom nav, and more sheet.
- [x] T012 Implement category and color filtering plus name/category/recent/price sorting.
- [x] T013 Implement item cards with favorite toggle, color dots, source/status/capsule indicators, and add item card.
- [x] T014 Implement detail/edit/add panel with required-field validation and max three color dots.
- [x] T015 Implement local-only sale/repair transitions that update status, clear capsule membership, and update counts.
- [x] T016 Add EN/RU My Items messages with no ES-AR active controls.
- [x] T017 Add responsive glass CSS for My Items.

## Phase 5: Verification

- [x] T018 Run React TSX best-practices checklist.
- [x] T019 Run `npm run check:feature-memory -- --worktree`.
- [x] T020 Run `npm --prefix app run lint`.
- [x] T021 Run `npm --prefix app run typecheck`.
- [x] T022 Run `npm --prefix app run build`.
- [x] T023 Run `npm run preflight`.
- [x] T024 Run `git diff --check`.
- [x] T025 Start local dev server.
- [x] T026 Browser smoke-check unauthenticated redirect, dashboard navigation, EN/RU My Items, filters, sort, detail/edit/add/favorite/status interactions, no ES-AR controls, and mobile viewport.

## Phase 6: Local Review Fixes

- [x] T027 Auto-hide My Items notices after a short visible interval.
- [x] T028 Make the edit drawer panel effectively opaque so the wallpaper/grid does not bleed through.
- [x] T029 Restyle edit color controls so swatches stay contained and remove icons do not protrude.
- [x] T030 Verify and fix mobile Save visibility/clickability.

## Process Memory

### Dead Ends

- Browser automation `fill()` did not reliably mutate the controlled name input in this runtime; keyboard input (`Meta+A`, `Backspace`, typed text) verified the same validation and save paths successfully.

### Decisions

- Use `015-stage-1-my-items` because `014-stage-1-capsule-result` is merged and My Items is the next foundational wardrobe screen linked from dashboard and capsule navigation.
- Start from `origin/main` instead of local `main` because local `main` is stale and diverged.
- Keep all item mutations client-local in this slice; real persistence and provider-backed photo/upload workflows remain later integration-gate work.
- Filter fixture-only image URLs (`/fixtures/...`, `mock://`) before rendering so the approved fallback visual appears instead of broken image placeholders.
- Show My Items action feedback through one fixed toast with a 3.6 second timeout; this keeps Save feedback visible on mobile even when the form is scrolled to the footer.
- Keep the edit drawer almost opaque while preserving an achromatic premium surface, because the previous glass layer let the wallpaper and cards compete with form fields.

### Known Issues

- No known issues.
