# Implementation Plan: Design System Consistency

**Branch**: `refactor/039-design-system-consistency` | **Date**: 2026-07-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `.specify/specs/039-design-system-consistency/spec.md`

## Summary

Capsule Zero is `complete-but-inconsistent`: a strong Tailwind-v4 token foundation
(`app/src/styles/tokens.css`) undermined by ~374 raw `rgba(255,255,255,α)` + raw hex and
off-scale radii inside one ~6534-line `globals.css`. This plan reconciles it by (1)
enforcing token adherence + CI guardrails, (2) resolving canonical decisions within the
editorial constraints and hitting WCAG AA, (3) completing screen states/affordance, and
(4) modularizing the stylesheet. Execution uses the global design kit: `ui-ux-designer` ↔
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
- **§VI Quality Gates — addressed.** "Min 3 states", "micro-interactions for all elements", "WCAG AA preserving aesthetics", adaptive breakpoints, zero console/FOUC, Lighthouse targets → covered by US2/US3 + the Verification table.
- **§VII Test-First Verification — applied per slice (no blanket waiver; changes are partly user-visible):**
  - **US2 (contrast/AA) and US3 (states/affordance)** are user-visible → **TDD**: a failing Playwright/axe test is committed *before* the product code.
  - **US1 token swap** and **US4 modularization** are **behavior-preserving refactors** → evidence is **visual-regression no-diff** (screens must look identical), not a new behavioral test.
  - **The stylelint guardrail** is delivery tooling → evidence is config validation + a **seeded-violation** run that fails CI (the negative scenario), recorded in the Verification table.
- **§VIII Simplicity — PASS.** No new abstractions; component extraction *reduces* complexity; the guardrail is configuration.
- **§VII Process Memory — committed** in `tasks.md` `## Process Memory` before completion.

## Verification _(mandatory — required by SENAR)_

| Acceptance criterion | Evidence |
| -------------------- | -------- |
| AC-001 (US1) 0 raw `rgba(255,255,255…` + 0 raw hex outside `tokens.css` | `grep -rE "rgba\(255, ?255, ?255" app/src --include='*.css' \| grep -v tokens.css \| wc -l` → `0`; same for hex |
| AC-002 (US1) all radii are token vars / on-scale | grep of `border-radius:` shows only `var(--radius-*)`/on-scale values; no `999/2/11/5/4/18/10px` |
| AC-003 (US1) guardrail blocks new off-token values | stylelint config in repo; `pnpm run preflight` green on clean tree; **seeded violation** (`border-radius:7px`) makes `preflight`/CI `test`+lint fail (paste run link) |
| AC-004 (US2) WCAG AA preserved-aesthetic | Playwright + axe pass on landing/dashboard/Outfits; `design-review` live-pass screenshots (desktop+mobile) attached; decisions in `design-system.md` |
| AC-005 (US3) states + tab affordance | Playwright e2e: tabs keyboard/role-interactive; Outfits/dashboard render loading/empty/error + first-run (test names + run link) |
| AC-006 (US4) no monolith stylesheet | file listing shows per-component styles; visual-regression no-diff run |

Negative scenario evidence:

- Seeded off-token value (`rgba(255,255,255,0.3)` / `border-radius: 7px`) → stylelint fails `preflight` and the required CI lint/`test` check goes red (link the failing run). Proves the guardrail independently of the cleanup.

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
1. **Lock the canon** — `ui-ux-designer` ratifies canonical values; record in `design-system.md`.
2. **Guardrails first** — add stylelint (warn), so cleanup can't regress; flip to error at end of US1.
3. **Reconcile by blast radius** — screen/component fixes → token fixes (live `design-review` after each) → extract components.
4. **Per-screen loop** — `design-handoff` spec → `frontend` implements states → `design-review` live.
5. **Keep green** — guardrails in CI; weekly dedupe (`ui-ux-designer` owns, `frontend` executes).
