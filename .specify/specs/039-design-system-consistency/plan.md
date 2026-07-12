# Implementation Plan: Design System Consistency

**Branch**: `refactor/039-design-system-consistency` | **Date**: 2026-07-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `.specify/specs/039-design-system-consistency/spec.md`

## Summary

Capsule Zero is `complete-but-inconsistent`: a strong Tailwind-v4 token foundation
(`app/src/styles/tokens.css`, 20 distinct white alphas across ~30 tokens) undermined by
374 raw `rgba(255,255,255,α)` (222 exact-token matches / 152 off-token across 38 alphas),
25 raw black `rgba`, 8 raw error tints, 4 raw hex, and 45 radius literals (32 token dupes
/ 13 off-scale) inside one ~6534-line `globals.css`. This plan reconciles it by (1)
enforcing token adherence in two lanes (exact-match no-diff; designer-ratified
consolidation) + extending the existing stylelint guardrail, (2) resolving canonical
decisions within the editorial constraints and hitting WCAG AA, (3) completing screen
states/affordance, and (4) modularizing the stylesheet with cascade-order preservation. Execution uses the global design kit: `ui-ux-designer` ↔
`frontend` roles with the `design-system` / `design-handoff` / `design-review` skills. The
Step-0 audit is recorded in [`.specify/memory/design-system-state.md`](../../memory/design-system-state.md).

## Technical Context

**Language/Version**: TypeScript / React (Next.js app router)
**Primary Dependencies**: Tailwind CSS v4 (`@theme` tokens in `app/src/styles/tokens.css`); CSS in `app/src/app/globals.css`
**Storage**: N/A (styling-layer change)
**Testing**: Playwright e2e (+ axe for a11y) per constitution §VII; stylelint for guardrails; visual-regression screenshots for behavior-preserving slices
**Target Platform**: Web — iPhone 14+, iPad, Desktop 1280px+
**Project Type**: web-app frontend
**Performance Goals**: Lighthouse Performance 90+, Accessibility 95+; zero console errors; zero FOUC (constitution §VI)
**Constraints**: WCAG AA **while preserving editorial aesthetics** (thin headings, glassmorphism, `wall.png`, achromatic, `#FFD600` error); 2px design precision
**Scale/Scope**: ~6534-line `globals.css`; primary screens = landing, dashboard, Outfits, profile

## Constitution Check

_GATE: passes before Phase 0; re-check after design._

- **§III Design Principles / Editorial Aesthetics — PASS (explicit).** The editorial identity is intentional. This feature **preserves** thin headings, glassmorphism, `wall.png`, achromatic palette, and the yellow error; it reconciles *readability* (scrim/opacity) rather than removing them. Out-of-scope guard in spec.md prevents scope creep into a redesign.
- **§VI Quality Gates — partially verified here, explicitly.** "Min 3 states", "micro-interactions", "WCAG AA preserving aesthetics" → covered by US2/US3 with bound evidence rows. "Zero console errors" → asserted in the Playwright suite (AC-007). Lighthouse 90+/95+ and FOUC → one linked run on the PR head (AC-007); they are measured, not gated, in this spec.
- **§VII Test-First Verification — applied per slice (no blanket waiver; changes are partly user-visible):**
  - **US2 (contrast/AA) and US3 (states/affordance)** are user-visible → **TDD**: a failing Playwright/axe test is committed *before* the product code.
  - **US1 Lane A** and **US4 modularization** are **behavior-preserving refactors** → evidence is **visual-regression no-diff** (screens must look identical), not a new behavioral test.
  - **US1 Lane B** is an **intentional, designer-ratified visual change** → evidence is the ratified mapping table + `design-review` before/after screenshots (not TDD, not no-diff).
  - **The stylelint guardrail** is delivery tooling → evidence is config validation + a **seeded-violation** run that fails the required `baseline-checks` check (the negative scenario), recorded in the Verification table.
- **§VII Process Memory — committed** in `tasks.md` `## Process Memory` before completion.

## Verification _(mandatory — required by SENAR)_

| Acceptance criterion | Evidence |
| -------------------- | -------- |
| AC-001 (US1 Lane A) exact-match swaps are no-diff | `grep -rE "rgba\(255, ?255, ?255" app/src --include='*.css' \| grep -v tokens.css \| wc -l` → `0` (same for hex/black/error tints once both lanes land); visual-regression **no-diff** run vs the T004 baseline for Lane A batches |
| AC-002 (US1 Lane B) consolidation applied exactly as ratified | mapping table in `design-system.md`; every row traceable in the diff; `design-review` before/after screenshots approved; no `999/2/11/5/4/18/10px` radii remain |
| AC-003 (US1) guardrail blocks new off-token values | extended `app/stylelint.config.mjs` in repo; `npm run preflight` green on clean tree; **seeded violation** (`border-radius:7px`) makes `lint:css` exit non-zero → required **`baseline-checks`** check red (paste run link) |
| AC-004 (US2) WCAG AA preserved-aesthetic | Playwright + axe: **0 serious/critical violations** on landing/dashboard/capsule-result; **measured contrast ratios** for secondary/placeholder/error text over the shipped scrim documented in `design-system.md` (axe cannot compute contrast through `backdrop-filter`/images — manual measurement is the binding evidence); `design-review` live-pass screenshots (desktop+mobile) |
| AC-005 (US3) states + tab affordance | Playwright e2e: capsule-result tabs expose `tablist`/`tab`/`aria-selected` + arrow-key nav + visible hover/focus-visible; dashboard loading/empty/error + first-run (test names + run link) |
| AC-006 (US4) no monolith stylesheet | file listing: per-component styles ≤ ~300 lines (soft gate); dedupe-before-split evidence; visual-regression no-diff run; stylelint duplicate rules at `error` with no `--max-warnings` budget |
| AC-007 (§VI gates) console/Lighthouse/FOUC | zero-console-error assertion in the Playwright suite on primary screens; one Lighthouse run linked on the PR head (target Perf 90+ / A11y 95+); FOUC covered by the no-diff baseline + manual check |

Negative scenario evidence:

- Seeded off-token value (`rgba(255,255,255,0.3)` / `border-radius: 7px`) → stylelint fails `preflight` locally and the required **`baseline-checks`** CI check goes red (link the failing run). The `test` check does not run stylelint — do not collect the evidence there. Proves the guardrail independently of the cleanup.

### Evidence recorded — US1 slice (2026-07-10, this branch)

- **AC-001 (Lane A no-diff):** value-resolution equivalence vs pre-refactor HEAD — exactly 9
  resolved diffs, all whitelisted §9.3 clamping snaps (999/11/2px → `--radius-pill`, elements
  ≤42px); every other declaration resolves byte-identical. Visual suite 14/14 no-diff vs the
  T004 baseline before any Lane B change. Commit `aca22d4`.
- **AC-002 (Lane B as ratified):** every §9.2/§9.3/§9.4/§9.10 row applied and traceable in
  diffs `0c1c354` / `9f8262d`; `design-review` (T009): landing pill diff APPROVED, capsule-result
  preview REJECTED → fixed (scrim moved to the background-image layer above the inline item
  colour) → re-run sub-threshold; §9.10 ⚑⚑ avatar-edit verified as the only changed element on
  the profile diff. Residual raw values: 5 documented in-file disables (§9.8 data-URI; T013 focus retune; 3× approved-.78 copy held at its literal until the T013 secondary retune — Codex P2 on PR #78). grep raw `rgba(`/hex/px-radius in app CSS = 0 outside those two lines.
- **AC-003 (guardrail):** token rules at severity **error** (T010). Local negative run: seeded
  `border-radius: 7px` + `rgba(255,255,255,0.3)` fixture → 2 errors, `lint:css` exit 2; removed
  → exit 0. `--max-warnings 101` covers only the remaining duplicate-selector debt (drops in
  US4). CI red-run link: seeded commit `e5e51bc` (reverted in `5b4704e`) dispatched on a scratch branch → `baseline-checks` **failure** — https://github.com/kiaquila/capsule-zero/actions/runs/29155591541. Follow-up P2 on PR #78 closed the uppercase-function bypass: `RGB(255 255 255 / .7)` now fails the same rule (the regexp has the required `i` flag).
- Warning-budget ratchet trail: 102 → 559 (rules added) → 298 (Lane A) → 114 (Lane B) → 101
  (§9.10); colour+radius = 0 warnings, then flipped to error.
- Deflake note: Next dev overlay (`<nextjs-portal>`, "N Issues") raced screenshots — hidden via
  `expect.toHaveScreenshot.stylePath`; 14/14 green three consecutive runs.

## Project Structure

### Documentation (this feature)

```text
.specify/specs/039-design-system-consistency/
├── plan.md      # this file
├── spec.md
└── tasks.md
.specify/memory/design-system-state.md   # Step-0 audit (drift register)
.specify/memory/design-system.md         # canonical descriptive DS (+ record decisions here)
```

### Source (touched)

```text
app/src/styles/tokens.css     # canonical tokens (allowed home for raw rgba/hex)
app/src/app/globals.css       # source of the drift → tokenize + later split
app/src/**                    # per-component stylesheets (US4), screen states (US3)
<stylelint config>            # new guardrail, wired into preflight + CI
tests/**                      # Playwright e2e + axe + visual-regression (per constitution)
```

## Phased approach (maps to the kit loop)

0. **Audit (done)** — `design-system` Step 0 → state recorded in `design-system-state.md`.
1. **Lock the canon** — `ui-ux-designer` ratifies canonical values (incl. the alpha-ramp mapping table); record in `design-system.md`.
2. **Guardrails first** — **extend the existing** `app/stylelint.config.mjs` (warn) and raise the `--max-warnings` budget to the measured total so `baseline-checks` stays green; ratchet the budget down per cleanup batch; flip token rules to error at end of US1.
3. **Reconcile by blast radius** — screen/component fixes → token fixes (live `design-review` after each) → extract components.
4. **Per-screen loop** — `design-handoff` spec → `frontend` implements states → `design-review` live.
5. **Keep green** — guardrails in CI; weekly dedupe (`ui-ux-designer` owns, `frontend` executes).
