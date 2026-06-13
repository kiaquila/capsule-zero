# Tasks: Stage 1 For Sale

**Input**: `.specify/specs/018-stage-1-for-sale/spec.md`, `plan.md`

## Phase 1: Setup

- [x] T001 Refresh GitHub state with `git fetch --all --prune`.
- [x] T002 Confirm open PR status, CI state, latest merged PR, and `origin/main`.
- [x] T003 Create branch `codex/stage-1-for-sale` from current `origin/main`.
- [x] T004 Fetch current Next.js App Router documentation through Context7.
- [x] T005 Read approved For Sale prototype, wardrobe-management feature docs, screen docs, current My Items/Uncapsulated/Favorites implementation, i18n messages, categories, and mock provider fixtures.

## Phase 2: Feature Memory

- [x] T006 Create SENAR spec, plan, and tasks files for `018-stage-1-for-sale`.

## Phase 3: Route and Data

- [x] T007 Add deterministic `for_sale` mock fixture coverage.
- [x] T008 Add `/{locale}/for-sale` route that requires the existing mock session.
- [x] T009 Remove `for-sale` from the constrained future dashboard redirect route.
- [x] T010 Build a serializable For Sale snapshot from mock provider/category/wardrobe fixtures.

## Phase 4: For Sale UI

- [x] T011 Implement For Sale shell with sidebar/topbar, language switcher, sign-out, info text, category/color filters, sort controls, shared wardrobe grid card, unified detail panel, toast/notice, mobile bottom nav, and more sheet.
- [x] T012 Implement grid favorite toggle, detail-panel Add-to-Capsule, To-My-Items, delete, save, catalog visibility, and local photo preview flows.
- [x] T013 Add EN/RU For Sale messages with no ES-AR active controls.
- [x] T014 Add responsive glass CSS for For Sale-specific controls.

## Phase 5: Verification

- [x] T015 Run React TSX best-practices checklist.
- [x] T016 Run `npm run check:feature-memory -- --worktree`.
- [x] T017 Run `npm --prefix app run lint`.
- [x] T018 Run `npm --prefix app run typecheck`.
- [x] T019 Run `npm --prefix app run build`.
- [x] T020 Run `npm run preflight`.
- [x] T021 Run `git diff --check`.
- [x] T022 Start or reuse local dev server.
- [x] T023 Browser smoke-check unauthenticated redirect, dashboard navigation, EN/RU For Sale, filtering/sorting, grid favorite toggle, capsule/return/delete/edit/photo/catalog interactions, no ES-AR controls, and mobile viewport.
- [x] T024 Address Codex review P2 by excluding `for_sale` items from dashboard wardrobe statistics/recent items while preserving the separate For Sale count.

## Process Memory

### Dead Ends

- `npm --prefix app run dev -- --hostname 127.0.0.1 --port 3001` could not start because Next detected the same app already running on `http://localhost:3000` with PID `20086`; local review used that existing server instead of killing user state.
- Raw `document.body.textContent` contains hidden Next.js flight scripts with all message strings, so validation/i18n checks use accessibility snapshots, visible text, and targeted DOM selectors instead of whole-body substring checks.
- The in-app Browser runtime does not expose a safe file-selection API such as `setInputFiles`; photo upload was verified through the rendered `Change photo` control, file input `accept` contract, and client-side validation code rather than an actual OS file chooser interaction.
- A one-off For Sale grid card/action strip initially duplicated an object type already implemented in My Items/Uncapsulated/Favorites; it was removed in favor of the shared wardrobe card contract.

### Decisions

- Use `018-stage-1-for-sale` because `017-stage-1-favorites` is merged and `for-sale` is still represented by the future dashboard redirect.
- Start from `origin/main` instead of local `main` because local `main` is stale/diverged.
- Keep all For Sale interactions client-local in this slice; real persistence and provider-backed status/item writes remain later integration-gate work.
- Add one deterministic `for_sale` fixture without a public image so the default screen exercises the polished fallback visual rather than broken placeholder assets.
- Harden valid Save by clearing stale form errors after validation passes.
- Preserve accessible names for compact mobile icon buttons with localized `aria-label` strings while hiding visual action text at 375px.
- Use `app/src/components/wardrobe/WardrobeItemCard.tsx` and `app/src/components/wardrobe/WardrobeItemDetailPanel.tsx` as the shared implementation for wardrobe item cards and item edit panels across My Items, Uncapsulated, Favorites, and For Sale.
- Keep favorite add/remove only on the grid heart. Detail panels do not duplicate favorite actions; section-specific actions appear after `Save`, and `Delete` is the final action with the simple `Delete` label.
- Record the broader engineering consistency rule in root `AGENTS.md`: if a product or technical object type already exists, reuse its component/service/adapter/schema/helper/CSS/API contract and let review reject copy-pasted variants under DRY/SOLID.
- Replace the For Sale detail `Mark as Sold` action with `Add to Capsule`, shorten the return label to `To My Items`, and clamp detail footer SVGs to the shared 18px icon box so the action row matches the other item edit panels.
- Keep For Sale quick-access/list counts separate from dashboard wardrobe statistics: `for_sale` items remain visible in For Sale, but dashboard total items, My Items navigation badge, and recent wardrobe items exclude them until return to My Items.

### Known Issues

- No known product issues after browser smoke verification. Photo file chooser execution remains a test-tool limitation noted above.
