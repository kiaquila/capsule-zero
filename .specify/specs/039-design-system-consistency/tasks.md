---
description: "Task list for 039-design-system-consistency"
---

# Tasks: Design System Consistency

**Input**: `.specify/specs/039-design-system-consistency/` (spec.md, plan.md) + `.specify/memory/design-system-state.md`
**Roles**: `ui-ux-designer` (design/consistency/review) ↔ `frontend` (implementation). **Skills**: `design-system`, `design-handoff`, `design-review`.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: can run in parallel (different files, no dependency)
- Every UI-visible slice is **test-first** (constitution §VII): commit the failing Playwright/axe test before the product code.

---

## Phase 1: Setup

- [x] T001 Create feature folder `.specify/specs/039-design-system-consistency/` (spec/plan/tasks).
- [x] T002 Run `design-system` Step 0; record drift register in `.specify/memory/design-system-state.md`.
- [ ] T003 [P] Add stylelint to `app/` in **warn** mode with a config that flags raw `rgba(255,255,255…`, raw hex outside `tokens.css`, and off-scale `border-radius`/spacing literals. Do not wire into CI yet.
- [ ] T004 [P] Add a **visual-regression baseline** (Playwright screenshots) for landing, dashboard, Outfits, profile — the no-diff reference for behavior-preserving slices (US1/US4).

## Phase 2: Foundational (blocking — canonical decisions)

**⚠️ Must complete before US1 token edits.**

- [ ] T005 `ui-ux-designer`: ratify canonical values and record them in `.specify/memory/design-system.md`:
  - one **button radius** token (pill vs sm);
  - **minimum readable weight** for body/labels/dense UI (keep 300 for hero/marketing only);
  - **WCAG-AA approach** for secondary/placeholder text + `#FFD600` error over `wall.png` (scrim/overlay/opacity), preserving editorial aesthetics;
  - map each drift-register row to its fix **level** (screen/component/token).

## Phase 3: US1 — Token adherence + guardrails (P1)

- [ ] T006 [US1] `frontend`: replace raw `rgba(255,255,255,α)` in `app/src/app/globals.css` with `--glass-*`/`--btn-*`/`--input-*`/`--card-*`/`--text-*` tokens, section by section.
- [ ] T007 [US1] `frontend`: replace the raw hex (`#2a2a2a`, `#fff`, …) with `--color-*` tokens.
- [ ] T008 [US1] `frontend`: snap every `border-radius` to a token (`var(--radius-*)`); remove off-scale `999/2/11/5/4/18/10px` and literal dupes of `sm/xs/md/lg`.
- [ ] T009 [US1] After each batch: `ui-ux-designer` runs `design-review` live pass + compare against the T004 baseline → confirm **no visual diff** (tokens equal what they replaced).
- [ ] T010 [US1] Flip stylelint to **error**; wire into `pnpm run preflight` and the CI required checks.
- [ ] T011 [US1] Add the **negative-scenario** guard test: a fixture with `border-radius: 7px` / raw white `rgba` makes lint fail (assert non-zero exit). Evidence for AC-003.
- **Gate (AC-001/002/003):** grep raw white/hex outside `tokens.css` = 0; no off-scale radii; seeded violation fails CI.

## Phase 4: US2 — Canonical + WCAG-AA (P2)  *(test-first)*

- [ ] T012 [US2] Commit **failing** Playwright + axe test asserting WCAG AA on landing/dashboard/Outfits (secondary/placeholder text + error over wallpaper).
- [ ] T013 [US2] `frontend`: apply the T005 token-level decisions (scrim/opacity for contrast; single button radius) → make T012 pass. Token edits **ratified by `ui-ux-designer`**.
- [ ] T014 [US2] `ui-ux-designer`: `design-review` live pass (desktop + mobile) — confirm editorial look preserved (thin headings, wallpaper, glass intact). Attach screenshots.

## Phase 5: US3 — Screen states & affordance (P3)  *(test-first, per screen)*

- [ ] T015 [US3] `ui-ux-designer`: `design-handoff` behavior spec for Outfits, dashboard, landing (canonical state list: interaction hover/focus/active/disabled · content default/loading/empty/error · viewport mobile).
- [ ] T016 [US3] Commit **failing** Playwright e2e: Items/Outfits/Missing tabs expose interactive role + keyboard nav + visible hover/focus/active.
- [ ] T017 [US3] `frontend`: implement interactive tabs (use `--tab-active-*` tokens) → make T016 pass.
- [ ] T018 [US3] Commit **failing** e2e for empty/first-run/loading/error on Outfits + dashboard; then implement → pass. Flatten nested/empty cards on Outfits.
- [ ] T019 [US3] `design-review` live pass on each screen; polish to 2px.

## Phase 6: US4 — Modularize globals.css (P4)  *(behavior-preserving)*

- [ ] T020 [US4] `frontend`: extract per-component styles out of `globals.css` into per-component files; keep `tokens.css` canonical.
- [ ] T021 [US4] Verify **no visual diff** vs T004 baseline; confirm no single stylesheet remains a monolith.

## Phase 7: Wrap

- [ ] T022 Update `.specify/memory/design-system.md` (decisions) + `design-system-state.md` (drift register closed/updated).
- [ ] T023 Fill the `## Verification` table in `plan.md` with real evidence (commands, test names, run links, screenshots).
- [ ] T024 `pnpm run preflight` green; open PR; do **not** merge until required checks are green + human approval.

---

## Process Memory

### Decisions
- **Editorial identity is intentional (constitution §III):** thin headings, glassmorphism, `wall.png`, achromatic palette, and `#FFD600` error are **kept**. Readability is reconciled via scrim/opacity, not by removing them. This is the guard against "de-slopping" the brand away.
- Guardrails go in **before** mass cleanup (warn → error) so the refactor cannot regress and future drift is blocked at the source.
- Token changes are **proposed by `frontend`, ratified by `ui-ux-designer`** (tokens = the visual system the designer owns).
- Reconcile **by blast radius**: screen/component first, tokens last, live-review after each token change.

### Dead ends
- _(record here as encountered)_

### Known issues / follow-ups
- Exact `globals.css` line numbers shift between branches — rely on the grep counts (374 raw white / 4 raw hex on this branch), not fixed lines.
- Genuine one-off values need a **documented stylelint exception**, not a silent literal — keep the exception list short and reviewed.
- Button-radius decision (pill vs sm) is **open** until T005.
