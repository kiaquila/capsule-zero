# Tasks: Stage 1 Guided Journey

**Input**: `.specify/specs/013-stage-1-guided-journey/spec.md`, `plan.md`

## Phase 1: Setup

- [x] T001 Refresh GitHub state with `git fetch --all --prune`.
- [x] T002 Confirm open PR status, CI state, latest merged PR, and `origin/main`.
- [x] T003 Create branch `codex/stage-1-guided-journey` from current `origin/main`.
- [x] T004 Fetch current Next.js App Router documentation through Context7.
- [x] T005 Attempt current next-intl documentation lookup through Context7 and fall back to existing local next-intl patterns when snippets are unavailable.
- [x] T006 Read approved guided journey prototype, feature docs, screen docs, current dashboard route, i18n messages, categories, color methodology, and mock provider fixtures.

## Phase 2: Feature Memory

- [x] T007 Create SENAR spec, plan, and tasks files for `013-stage-1-guided-journey`.

## Phase 3: Route and Data

- [x] T008 Add `/{locale}/guided-journey` route that requires the existing mock session.
- [x] T009 Build a serializable guided journey snapshot from mock provider/category/catalog/color fixtures.

## Phase 4: Guided Journey UI

- [x] T010 Implement Step 1 wardrobe type cards.
- [x] T011 Implement Step 2 filtered category checklist, steppers, min-8 validation, and custom category validation.
- [x] T012 Implement Step 3 Upload Photos, Paste Links, Search Catalog, added-item previews, and local mock creation handoff.
- [x] T013 Implement 51-color palette picker with group compatibility, max color limits, and item compatibility blocking.
- [x] T014 Add EN/RU guided journey messages with no ES-AR active controls.
- [x] T015 Add responsive glass CSS for guided journey.
- [x] T016 Unlock dashboard primary creation CTAs to `/guided-journey`.

## Phase 5: Verification

- [x] T017 Run `npm run check:feature-memory -- --worktree`.
- [x] T018 Run `npm --prefix app run lint`.
- [x] T019 Run `npm --prefix app run typecheck`.
- [x] T020 Run `npm --prefix app run build`.
- [x] T021 Run `npm run preflight`.
- [x] T022 Run `git diff --check`.
- [x] T023 Start local dev server.
- [x] T024 Browser smoke-check unauthenticated redirect, dashboard CTA, EN/RU journey, Step 2 validation, Step 3 tabs, palette blocking, and mobile viewport.

## Process Memory

### Dead Ends

- Context7 resolved the official next-intl library, but both official and mirror documentation queries returned no snippets for this turn. The implementation follows the already-merged local `next-intl` routing/message patterns instead.

### Decisions

- Use `013-stage-1-guided-journey` because `012` is already occupied by the merged palette-alignment slice.
- Start from `origin/main` after PR #31 because the palette compatibility rules changed immediately before this slice.
- Keep capsule creation local/mock-only in this slice; Capsule Result remains the next destination screen slice.
- Use the canonical group compatibility matrix from `docs_capsule_zero/project/methodology/colors.md`; temperature stays explanatory metadata only.
- Keep empty category-only capsule creation available because the existing feature/spec calls that a valid "plan" state.
- Mark incompatible palette colors with `aria-disabled=true`; keep the default palette copy concise because compatibility is already enforced by the algorithm.
- Preserve non-Latin custom category identifiers with Unicode-aware slugs so RU users can add multiple custom categories.
- Treat duplicate marketplace links by URL-derived item id rather than host-derived display name, allowing multiple products from one store.
- Validate marketplace mock colors before adding link imports and revalidate new palette colors against already added item colors.
- Omit unavailable `/fixtures/` catalog image URLs from the guided journey snapshot so catalog-added cards use the existing icon fallback.
- Reset Step 3 draft state, notices, inputs, and upload object URLs whenever a wardrobe type is selected so stale items/palette cannot carry into a different type flow.

### Known Issues

- Capsule Result, My Items persistence, and real provider-backed item creation remain future slices; this guided journey prepares and reviews the flow locally without saving a real capsule.
