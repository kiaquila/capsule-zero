# Tasks: Stage 1 Favorites

**Input**: `.specify/specs/017-stage-1-favorites/spec.md`, `plan.md`

## Phase 1: Setup

- [x] T001 Refresh GitHub state with `git fetch --all --prune`.
- [x] T002 Confirm open PR status, CI state, latest merged PR, and `origin/main`.
- [x] T003 Create branch `codex/stage-1-favorites` from current `origin/main`.
- [x] T004 Fetch current Next.js App Router documentation through Context7.
- [x] T005 Fetch current next-intl App Router documentation through Context7.
- [x] T006 Read approved Favorites prototype, Favorites feature docs, screen docs, current My Items/Uncapsulated implementation, i18n messages, categories, and mock provider fixtures.

## Phase 2: Feature Memory

- [x] T007 Create SENAR spec, plan, and tasks files for `017-stage-1-favorites`.

## Phase 3: Route and Data

- [x] T008 Add `/{locale}/favorites` route that requires the existing mock session.
- [x] T009 Remove `favorites` from the constrained future dashboard redirect route.
- [x] T010 Build a serializable Favorites snapshot from mock provider/category/wardrobe fixtures.
- [x] T011 Adjust deterministic mock fixtures so Stage 1 has both a My Items favorite and a catalog-derived favorite.

## Phase 4: Favorites UI

- [x] T012 Implement Favorites shell with sidebar/topbar, language switcher, sign-out, My Items / From Catalogs tabs, category filters, grid, detail panel, toast/notice, mobile bottom nav, and more sheet.
- [x] T013 Implement category filtering for the active Favorites section.
- [x] T014 Implement favorite item cards with shared My Items-style favorite controls, color dots, source/status context, and catalog badges.
- [x] T015 Implement editable detail panel with local photo preview, name/category/color/brand/material/price fields, Save, Remove Favorite, Add to Capsule, Delete Item, Move to Sale, and Move to Repair actions.
- [x] T016 Implement local-only favorite removal, add-to-capsule, deletion, and status transitions that update visible counts.
- [x] T017 Add EN/RU Favorites messages with no ES-AR active controls.
- [x] T018 Add responsive glass CSS for Favorites-specific controls.

## Phase 5: Verification

- [x] T019 Run React TSX best-practices checklist.
- [x] T020 Run `npm run check:feature-memory -- --worktree`.
- [x] T021 Run `npm --prefix app run lint`.
- [x] T022 Run `npm --prefix app run typecheck`.
- [x] T023 Run `npm --prefix app run build`.
- [x] T024 Run `npm run preflight`.
- [x] T025 Run `git diff --check`.
- [x] T026 Start local dev server.
- [x] T027 Browser smoke-check unauthenticated redirect, dashboard navigation, EN/RU Favorites, section tabs, category/color filtering, sort controls, favorite removal, detail edit/save/add-to-capsule/delete/status interactions, no ES-AR controls, and mobile viewport.

## Process Memory

### Dead Ends

- First `npm run preflight` attempt failed because it was started in parallel with a separate `npm --prefix app run build`; Next refused the second simultaneous build with `Another next build process is already running`. Re-running preflight after the standalone build finished passed.
- Browser automation `fill()` did not reliably trigger the empty controlled-name validation state in the first validation attempt. Keyboard input (`Meta+A`, `Backspace`) verified the same validation path successfully with `Name is required.` and `aria-invalid=true`.

### Decisions

- Use `017-stage-1-favorites` because `016-stage-1-uncapsulated` is merged and Favorites is the next route still represented by the future dashboard redirect.
- Start from `origin/main` instead of local `main` because local `main` is stale/diverged and checked out by another worktree.
- Keep all Favorites interactions client-local in this slice; real persistence and provider-backed favorite/item writes remain later integration-gate work.
- Use an existing catalog-derived wardrobe fixture as the From Catalogs favorite instead of inventing a separate catalog persistence model in this screen slice.
- Implement Favorites detail as an editable side panel aligned with My Items and Uncapsulated because the user explicitly required no shortcut for object edit cards.
- Keep the card favorite control scoped to "remove from Favorites"; expose local Delete Item only inside the edit/detail panel because the user explicitly requested delete parity there.
- Follow-up parity patch keeps the My Items circular favorite display as the shared visual contract across My Items, Uncapsulated, and Favorites, and uses the Uncapsulated yellow destructive button treatment for remove/delete actions in Favorites and My Items.
- Address Codex review by aligning `FR-010`, scope, success criteria, and verification evidence with the user-requested Favorites `Add to Capsule` and `Delete Item` actions.

### Known Issues

- No known issues.
