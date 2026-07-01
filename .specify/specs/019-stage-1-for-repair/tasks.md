# Tasks: Stage 1 For Repair

**Input**: `.specify/specs/019-stage-1-for-repair/spec.md`, `plan.md`

## Phase 1: Setup

- [x] T001 Refresh GitHub state with `git fetch --all --prune`.
- [x] T002 Confirm open PR status, latest merged PR, current CI state, and local `main` divergence.
- [x] T003 Create branch `codex/stage-1-for-repair` from current `origin/main`.
- [x] T004 Fetch current Next.js and next-intl App Router documentation through Context7.
- [x] T005 Read For Repair prototype, wardrobe-management docs, screen docs, MVP spec US-024, and neighboring My Items/Uncapsulated/Favorites/For Sale implementations.

## Phase 2: Feature Memory

- [x] T006 Create SENAR spec, plan, and tasks files for `019-stage-1-for-repair`.

## Phase 3: Route and Data

- [x] T007 Add shared statistic exclusion for `for_repair` items.
- [x] T008 Add For Repair snapshot builder from mock provider fixtures.
- [x] T009 Add authenticated `/{locale}/for-repair` route.
- [x] T010 Remove `for-repair` from future dashboard redirect routes.

## Phase 4: For Repair UI

- [x] T011 Implement For Repair shell with sidebar/topbar, language switcher, sign-out, info text, filters, sorting, bottom nav, and More sheet.
- [x] T012 Reuse shared wardrobe item cards for the repair grid and favorite toggle without grid-level action buttons.
- [x] T013 Reuse shared wardrobe detail panel for local edit, repair notes, photo preview validation, Save, Mark as Fixed, and Delete.
- [x] T014 Add EN/RU For Repair messages with no ES-AR active controls.
- [x] T015 Add scoped CSS for textarea notes and delete accent while keeping grid card styling on shared `my-items-card`.

## Phase 5: Verification

- [x] T016 Run React TSX best-practices checklist.
- [x] T017 Run JSON parse check for EN/RU messages.
- [x] T018 Run `npm run check:feature-memory -- --worktree`.
- [x] T019 Run `npm --prefix app run lint`.
- [x] T020 Run `npm --prefix app run typecheck`.
- [x] T021 Run `npm --prefix app run build`.
- [x] T022 Run `npm run preflight`.
- [x] T023 Start or reuse local dev server.
- [x] T024 Browser smoke-check unauthenticated redirect, EN/RU For Repair, filters/sort, favorite, save, note edit, detail Delete, detail Mark as Fixed, no ES-AR controls, shared grid-card styling, and mobile viewport.

## Process Memory

### Dead Ends

- Initial Browser login fallback retried the `Log In` locator after the first click had already navigated to dashboard; verified the URL and continued with fresh snapshots instead of repeating the stale locator.

### Decisions

- Use `019-stage-1-for-repair` because `018-stage-1-for-sale` is merged and `for-repair` remained in future-route redirect state.
- Start from `origin/main` instead of local `main` because local `main` is stale/diverged.
- Treat fixed repair items as returning to Uncapsulated/My Items, not to their prior capsule, matching the wardrobe-management edge case for sale/repair returns.
- Extend the shared wardrobe statistic helper so both `for_sale` and `for_repair` are excluded from My Items/dashboard wardrobe statistics.
- Keep repair notes client-local in Stage 1; provider-backed persistence remains out of scope.
- Source-verify unsupported photo rejection because the available Browser smoke API does not expose file upload; MIME and 10 MB guards run before preview URL creation.
- Keep lifecycle actions out of grid cards after local review feedback; For Repair and Uncapsulated cards use the shared `my-items-card` visual contract and expose lifecycle actions from the detail panel.

### Known Issues

- No unresolved implementation issues found in local verification. Provider-backed persistence for repair notes/status writes remains out of scope for Stage 1.
