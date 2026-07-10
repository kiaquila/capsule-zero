# Feature Specification: Design System Consistency

**Feature Branch**: `refactor/039-design-system-consistency`
**Created**: 2026-07-09
**Status**: Draft
**Input**: Refactor the frontend + design system so Capsule Zero stops drifting away from its own tokens. Based on designer feedback (Vanya) and a `design-system` Step-0 audit → state `complete-but-inconsistent` (see `.specify/memory/design-system-state.md`).

> **Workflow:** implement with the global design kit — roles `ui-ux-designer` (owns visual
> system, states, consistency, live review) ↔ `frontend` (owns implementation, a11y,
> responsive, tech constraints), and skills `design-system` / `design-handoff` /
> `design-review`. Start every task from the `design-system` Step-0 audit already recorded
> in `.specify/memory/design-system-state.md`.

## Goal _(mandatory)_

After this ships, Capsule Zero's UI CSS draws **every colour and radius value from its design tokens**, CI **blocks any new off-token colour/radius value**, and the primary screens meet the constitution's state + contrast gates — so the interface reads as one deliberate editorial system, not an inconsistent one. (Spacing-grid adherence is **not linted in 039** — the spacing rule lands together with its remediation in a follow-up spec; see Out of scope.)

## Scope _(mandatory)_

In scope:

- `app/src/app/globals.css`, `app/src/styles/tokens.css`, and component styles under `app/src/`.
- **Token adherence — two lanes** (measured on this branch: 374 raw white `rgba` = **222 exact-token matches + 152 occurrences across 38 off-token alphas**; 25 raw black `rgba`; 8 raw `rgba(255,214,0,…)` error tints; 4 raw hex; 32 radius literals duplicating tokens + 13 off-scale):
  - **Lane A (behavior-preserving):** replace every literal whose value exactly equals an existing token — verified pixel-identical against the visual baseline.
  - **Lane B (designer-ratified consolidation):** off-token white alphas, off-scale radii, shadow/overlay blacks, and error tints map onto a canonical ramp ratified in the foundational phase (new tokens minted only there); small visual deltas are expected and approved via `design-review`.
- **Guardrails:** **extend the existing** `app/stylelint.config.mjs` (already wired into `lint:css` → the required `baseline-checks` CI check, root `preflight`, and lint-staged since the 2026-07 frontend-quality audit) with rules forbidding raw `rgba(`/raw hex outside `tokens.css` and off-scale `border-radius` literals; manage the `--max-warnings` budget so `baseline-checks` never goes red mid-refactor. No spacing rule in 039 — a stylelint rule instance has a single severity, so bundling spacing into the colour/radius rules would block their `error` flip; the spacing rule ships with its remediation in a follow-up spec.
- **Canonical token decisions** (ratified by `ui-ux-designer`): the white **alpha-ramp mapping table** for the 38 off-token alphas; one button radius; off-scale radius mapping; shadow/overlay/error-tint token additions; minimum readable weight for dense UI; WCAG-AA contrast for secondary/placeholder text and the yellow error over `wall.png` — via scrim/opacity, **preserving editorial aesthetics**.
- **Screen states + affordance** on the primary screens — real routes: `/[locale]` (landing), `/[locale]/dashboard`, `/[locale]/capsule-result` (tabs `items | outfits | gaps | shopping`; "Missing" = `gaps`), `/[locale]/profile`. Proper tab semantics (tablist/tab roles, `aria-selected`, hover/focus-visible, arrow keys) via **one shared tab treatment** that also normalizes `.journey-tab-*` and `.favorites-tab-*`; dashboard panel empty states; app-level `loading.tsx`/`error.tsx`; first-run.
- **Modularize** `globals.css` (≈6534 lines) into per-component stylesheets (mechanism and cascade-order preservation: US4).
- Design docs: `.specify/memory/design-system.md` (+ `design-system-state.md` annex).

Out of scope:

- **Abandoning the editorial identity.** Thin wide headings, glassmorphism, `wall.png`, achromatic palette, and `#FFD600` error are constitution §III identity — we reconcile *readability*, we do not remove them.
- **Spacing-grid lint + remediation.** ~286 off-4px-grid `margin`/`padding`/`gap` literals exist; snapping them is a visible layout change. Both the spacing stylelint rule and the snap land together in a follow-up spec (a rule instance has one severity — it cannot ride along warn-only inside the colour/radius rules that flip to `error` in this spec).
- **Outfit-generation product logic.** `buildOutfits()` renders at most 3 synthetic cards while the count line shows the independently computed `outfitCount` — a product-logic inconsistency recorded as a known issue, not a styling fix.
- **Garment-colour hex data** in TS modules (the 51-colour methodology in `guided-journey-data.ts` etc.) — data, not UI styling; colour comes from the user's items by design.
- New features/screens, backend/API, auth flows (spec 038 owns auth), the React Native app.
- Any new brand direction or visual redesign beyond consistency + gate compliance.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Token adherence + drift guardrails (Priority: P1)

Every UI colour/radius value in CSS comes from a token, and CI blocks new raw values, so the UI cannot silently drift again.

**Why this priority**: kills the systemic leak (374 raw whites, 25 raw blacks, 8 raw error tints, 4 raw hex, 45 radius literals) and permanently prevents regression — the foundation the other stories build on.

**Independent Test**: grep for raw `rgba(` and raw hex in `app/src` CSS outside `tokens.css` returns 0; the stylelint token rules run at severity `error`; a seeded violation fails the required `baseline-checks` check; Lane A verified pixel-identical vs the visual baseline; Lane B approved by `design-review` against the ratified mapping table.

**Acceptance Scenarios**:

1. **Given** the measured literals on this branch, **When** Lane A lands (exact-token matches: 222 whites, 32 radius dupes, 2 overlay blacks, raw hex), **Then** grep for those values outside `tokens.css` returns 0 and the primary screens render pixel-identical (visual-regression no-diff — tokens equal the values they replaced).
2. **Given** the 152 off-token white alphas + 13 off-scale radii + remaining black/error-tint literals, **When** Lane B lands per the ratified mapping table, **Then** grep returns 0, every mapping row is applied exactly as ratified, and `design-review` approves the (intentionally small) visual deltas with before/after screenshots.
3. **Given** a PR adds `rgba(255,255,255,0.3)` or `border-radius: 7px`, **When** CI runs, **Then** stylelint fails the required `baseline-checks` check and blocks merge.

One TSX styling literal (the `WardrobeItemCard.tsx` colour-dot stroke) is swept in this story; garment-colour hex **data** stays (see Out of scope).

---

### User Story 2 - Canonical decisions + WCAG-AA reconciliation (Priority: P2)

Ambiguous drift is resolved once — one button radius, a minimum readable weight, AA contrast — while keeping the editorial look.

**Why this priority**: removes the square-vs-rounded class of drift and satisfies the contrast gate without breaking identity.

**Independent Test**: an axe/Playwright accessibility check asserts WCAG AA on landing/dashboard/Outfits; a `design-review` live pass (desktop + mobile) confirms the editorial look is preserved; decisions are recorded in `design-system.md`.

**Acceptance Scenarios**:

1. **Given** secondary/placeholder text and the yellow error over `wall.png`, **When** measured, **Then** contrast meets WCAG AA (via scrim/opacity), with thin headings and the wallpaper retained.
2. **Given** buttons currently use mixed radii, **When** normalized, **Then** every button uses the single canonical radius token.

---

### User Story 3 - Screen states & affordance (Priority: P3)

The primary screens have every required state and real interactive affordance.

**Why this priority**: satisfies constitution §VI Quality Gates ("min 3 states", "micro-interactions for all elements") and fixes weak tab affordance, missing empty/loading/error surfaces, and unclear first-run.

**Independent Test**: Playwright e2e — the capsule-result tabs (`items | outfits | gaps | shopping`) expose `tablist`/`tab` roles with `aria-selected`, arrow-key navigation, and visible hover/focus-visible states; dashboard renders loading/empty/error and a first-run state.

**Acceptance Scenarios**:

1. **Given** three divergent tab implementations today (`.capsule-result-tab` — `aria-pressed` buttons with **no hover and no focus-visible styles**; `.journey-tab-*` and `.favorites-tab-*` — `role="tab"` with hover but no focus-visible; none with arrow-key nav), **When** normalized through one shared tab treatment, **Then** all three expose `tablist`/`tab`/`aria-selected`, keyboard arrow navigation, and visible hover/focus-visible/active states.
2. **Given** a new user with no data, **When** they open the dashboard, **Then** the existing first-run hero is complemented by real empty states in the Shopping-list and Recently-added panels (no headed glass panels with blank bodies, no zero-stats row without treatment), and app-level `loading.tsx`/`error.tsx` surfaces exist (none exist app-wide today).
3. **Given** the Outfits tab's triple-nested placeholder tiles (panel > outfit card > layer thumb, innermost showing only a generic icon + 8px colour dot), **When** restyled per the `design-handoff` spec, **Then** the card hierarchy is flattened — no bordered box whose only content is a placeholder icon.

---

### User Story 4 - Modularize globals.css (Priority: P4)

Per-component stylesheets replace the ~6534-line monolith without changing the cascade outcome.

**Why this priority**: removes the root cause that *enables* drift; lower priority because the US1 guardrails already prevent new drift.

**Independent Test**: no single stylesheet exceeds **~300 lines** (soft gate mirroring the AGENTS §7 TS/React row — add a CSS row to that table in the same change); each component has one style home; cascade order is preserved (dedupe the ~196 duplicate/overriding selectors **before** splitting, then split into ordered `@import`/`@layer` files per the 2026-07 audit); visual regression no-diff; the documented stylelint ratchet completes (duplicate rules flip to `error`, `--max-warnings` budget dropped).

**Acceptance Scenarios**:

1. **Given** one 6534-line `globals.css` with ~196 duplicate/overriding selectors (rule order is load-bearing — the shipped invisible-auth-error bug was an override-order bug), **When** deduped and split, **Then** component styles live in per-component files (≤ ~300 lines each, soft gate), the screens render unchanged (no-diff vs baseline), and stylelint runs at `error` severity with no warning budget.
2. **Given** the split, **Then** the known limitation that per-file `no-duplicate-selectors` cannot see cross-file duplicates is recorded in Process Memory, with review as the guard.

### Negative scenario _(mandatory)_

A contributor introduces an off-token value — raw `rgba(255,255,255,0.3)`, a raw hex, or an off-scale `border-radius: 7px` — the stylelint guardrail **fails `preflight` locally and the required `baseline-checks` CI check remotely; the change cannot merge** until it uses a token. (Proves the guardrail, not just the one-time cleanup.)

### Edge cases

- A genuinely one-off value (e.g. a computed gradient) requires a documented, reviewed stylelint exception — not a silent literal.
- `tokens.css` is the single allowed home for raw `rgba`/hex; the guardrail excludes it.
- Boundary: the guardrail lints CSS only. UI styling literals in TSX are swept once in US1 (`WardrobeItemCard.tsx` stroke); garment-colour hex in data modules is exempt by design.
- New colour tokens must be minted in the `--color-*` namespace: Tailwind v4 `@theme` derives utility classes from the prefix, and `--text-*` is the **font-size** namespace — a colour minted there would generate broken `text-*` utilities.
