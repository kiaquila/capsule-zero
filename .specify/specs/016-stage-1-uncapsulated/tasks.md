# Tasks: Stage 1 Uncapsulated

**Input**: `.specify/specs/016-stage-1-uncapsulated/spec.md`, `plan.md`

## Phase 1: Setup

- [x] T001 Refresh GitHub state with `git fetch --all --prune`.
- [x] T002 Confirm open PR status, CI state, latest merged PR, and `origin/main`.
- [x] T003 Create branch `codex/stage-1-uncapsulated` from current `origin/main`.
- [x] T004 Fetch current Next.js App Router documentation through Context7.
- [x] T005 Fetch current next-intl App Router documentation through Context7.
- [x] T006 Read approved Uncapsulated prototype, wardrobe-management feature docs, screen docs, current My Items implementation, i18n messages, categories, and mock provider fixtures.

## Phase 2: Feature Memory

- [x] T007 Create SENAR spec, plan, and tasks files for `016-stage-1-uncapsulated`.

## Phase 3: Route and Data

- [x] T008 Add `/{locale}/uncapsulated` route that requires the existing mock session.
- [x] T009 Remove `uncapsulated` from the constrained future dashboard redirect route.
- [x] T010 Build a serializable Uncapsulated snapshot from mock provider/category/capsule/wardrobe fixtures.

## Phase 4: Uncapsulated UI

- [x] T011 Implement Uncapsulated shell with sidebar/topbar, language switcher, sign-out, category filters, grid, detail panel, toast/notice, mobile bottom nav, and more sheet.
- [x] T012 Implement category filtering for uncapsulated items only.
- [x] T013 Implement item cards with color dots, source/status context, and local decision actions.
- [x] T014 Implement editable detail panel with local photo preview, name/category/color/brand/material/price fields, Save/Delete, Add to Capsule, Move to Sale, and Move to Repair actions.
- [x] T015 Implement local-only add-to-capsule, sale, and repair transitions that remove items from the grid and update counts.
- [x] T016 Add EN/RU Uncapsulated messages with no ES-AR active controls.
- [x] T017 Add responsive glass CSS for Uncapsulated-specific controls.

## Phase 5: Verification

- [x] T018 Run React TSX best-practices checklist.
- [x] T019 Run `npm run check:feature-memory -- --worktree`.
- [x] T020 Run `npm --prefix app run lint`.
- [x] T021 Run `npm --prefix app run typecheck`.
- [x] T022 Run `npm --prefix app run build`.
- [x] T023 Run `npm run preflight`.
- [x] T024 Run `git diff --check`.
- [x] T025 Start local dev server.
- [x] T026 Browser smoke-check unauthenticated redirect, dashboard navigation, EN/RU Uncapsulated, category filtering, detail/add-to-capsule/sale/repair interactions, no ES-AR controls, and mobile viewport.

## Process Memory

### Dead Ends

- `npm --prefix app run dev -- -p 3001` could not start while a stale Next dev process from the same `app` directory held the dev lock. The stale `3000` process had been running for more than a day, did not answer `/api/health`, and logged `EPIPE`, so it was stopped and replaced with a fresh `3000` dev server.
- Initial Uncapsulated detail implementation incorrectly narrowed the approved prototype to a read-only decision panel. The prototype detail was re-read and the React route was corrected to support editable fields, Save/Delete, and local photo preview upload.

### Decisions

- Use `016-stage-1-uncapsulated` because `015-stage-1-my-items` is merged and Uncapsulated is the next wardrobe lifecycle screen directly enabled by My Items data and navigation.
- Start from `origin/main` instead of local `main` because local `main` is stale and diverged.
- Keep actions client-local in this slice; real persistence, RLS, capsule recomputation, and provider-backed writes remain later integration-gate work.
- Keep Uncapsulated as a scoped shell instead of refactoring My Items shared components because the accepted My Items screen is large and stable, and this slice should avoid unrelated UI abstraction churn.
- Use browser-local object URLs for photo preview in Stage 1. Save stores the object URL in page state only; reloading returns to deterministic mock fixtures and avoids Supabase Storage or background-removal calls.

### Known Issues

- None yet.
