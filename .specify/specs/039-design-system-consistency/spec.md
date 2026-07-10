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

After this ships, Capsule Zero's UI renders **entirely from its design tokens**, CI **blocks any new off-token value**, and the primary screens meet the constitution's state + contrast gates — so the interface reads as one deliberate editorial system, not an inconsistent one.

## Scope _(mandatory)_

In scope:

- `app/src/app/globals.css`, `app/src/styles/tokens.css`, and component styles under `app/src/`.
- **Token adherence:** replace the 374 raw `rgba(255,255,255,α)` + raw hex literals with existing tokens; snap all `border-radius` values to the token scale.
- **Guardrails:** stylelint (or equivalent) rules wired into `preflight` + CI that forbid raw white `rgba`/raw hex outside `tokens.css` and off-scale radius/spacing literals.
- **Canonical token decisions** (ratified by `ui-ux-designer`): one button radius; minimum readable weight for dense UI; WCAG-AA contrast for secondary/placeholder text and the yellow error over `wall.png` — via scrim/opacity, **preserving editorial aesthetics**.
- **Screen states + affordance** on the primary screens (landing, dashboard, Outfits, profile): interactive tabs, default/loading/empty/error, first-run.
- **Modularize** `globals.css` (≈6534 lines) into per-component stylesheets.
- Design docs: `.specify/memory/design-system.md` (+ `design-system-state.md` annex).

Out of scope:

- **Abandoning the editorial identity.** Thin wide headings, glassmorphism, `wall.png`, achromatic palette, and `#FFD600` error are constitution §III identity — we reconcile *readability*, we do not remove them.
- New features/screens, backend/API, auth flows (spec 038 owns auth), the React Native app.
- Any new brand direction or visual redesign beyond consistency + gate compliance.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Token adherence + drift guardrails (Priority: P1)

Every UI value comes from a token, and CI blocks new raw values, so the UI cannot silently drift again.

**Why this priority**: kills the systemic leak (374 raw whites, 4 raw hex, off-scale radii) and permanently prevents regression — the foundation the other stories build on.

**Independent Test**: grep for raw `rgba(255,255,255` and raw hex outside `tokens.css` returns 0; stylelint passes; a seeded violation fails CI; visual regression shows the screens unchanged (tokens equal the values they replaced).

**Acceptance Scenarios**:

1. **Given** `globals.css` has 374 raw white `rgba` + 4 raw hex, **When** the refactor lands, **Then** grep outside `tokens.css` returns 0 for both and the primary screens render pixel-identical (visual-regression no-diff).
2. **Given** a PR adds `rgba(255,255,255,0.3)` or `border-radius: 7px`, **When** CI runs, **Then** stylelint fails and blocks merge.

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

**Why this priority**: satisfies constitution §VI Quality Gates ("min 3 states", "micro-interactions for all elements") and fixes tabs-as-plain-text and unclear first-run.

**Independent Test**: Playwright e2e — the Items/Outfits/Missing tabs are keyboard/role-interactive with visible states; Outfits/dashboard render loading/empty/error and a first-run state.

**Acceptance Scenarios**:

1. **Given** the tabs render as plain text, **When** implemented, **Then** they expose interactive roles + hover/focus/active and keyboard navigation.
2. **Given** a new user with no data, **When** they land, **Then** an empty/first-run state names the next action instead of a blank populated dashboard.

---

### User Story 4 - Modularize globals.css (Priority: P4)

Per-component stylesheets replace the ~6534-line monolith.

**Why this priority**: removes the root cause that *enables* drift; lower priority because the US1 guardrails already prevent new drift.

**Independent Test**: no single stylesheet exceeds the agreed size; each component has one style home; visual regression no-diff.

**Acceptance Scenarios**:

1. **Given** one 6534-line `globals.css`, **When** split, **Then** component styles live in per-component files and the screens render unchanged.

### Negative scenario _(mandatory)_

A contributor introduces an off-token value — raw `rgba(255,255,255,0.3)`, a raw hex, or an off-scale `border-radius: 7px` — the stylelint guardrail **fails `preflight`/CI and the change cannot merge** until it uses a token. (Proves the guardrail, not just the one-time cleanup.)

### Edge cases

- A genuinely one-off value (e.g. a computed gradient) requires a documented, reviewed stylelint exception — not a silent literal.
- `tokens.css` is the single allowed home for raw `rgba`/hex; the guardrail excludes it.
