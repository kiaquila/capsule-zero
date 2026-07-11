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
- [x] T003 [P] **Extend the existing** `app/stylelint.config.mjs` (do **not** add a new tool — it has been wired into `lint:css` → required `baseline-checks` CI + root `preflight` + lint-staged since the 2026-07 audit) with **warn**-severity rules: raw `rgba(` colour literals outside `tokens.css`, raw hex outside `tokens.css`, off-scale `border-radius` literals (allowed: 6/8/14/20/50px, 50%, 0, inherit, var()). Then measure the new warning total and set `--max-warnings` in `app/package.json` `lint:css` to exactly that number — the current budget (102) would blow up and turn `baseline-checks` red. Ratchet the number down with every cleanup batch.
- [x] T004 [P] Add a **visual-regression baseline**: dedicated Playwright project (`visual`, opt-in via `E2E_VISUAL=1`, **excluded from the CI `test` job**) with `toHaveScreenshot` for landing, dashboard, capsule-result (all four tabs), profile; animations/motion disabled. Snapshots are platform-specific — the no-diff evidence for US1-Lane-A/US4 is a **same-machine before/after run** attached to the PR, not a cross-platform CI gate (CI drift protection is the stylelint guardrail).

## Phase 2: Foundational (blocking — canonical decisions)

**⚠️ Must complete before US1 token edits.**

- [x] T005 `ui-ux-designer`: ratify canonical values and record them in `.specify/memory/design-system.md`:
  - the **white alpha-ramp mapping table**: each of the 38 off-token alphas (152 occurrences; hot spots `.16`×16, `.14`×12, `.06`×12, `.24`×10, `.62`×8, `.26`×7) → target token (existing or newly minted ramp step). This is the largest decision — no-diff is impossible for these, every row is an intentional micro-change;
  - one **button radius** token (pill vs sm) + explicit targets for the 13 off-scale radius literals (`999px`×4 → `--radius-pill` renders identically on the current ≤42px elements; `2/4/5/10/11/18px` need ratified targets);
  - **shadow/overlay/error-tint tokens**: 16 raw black shadows use geometries beyond the 4 `--shadow-*` tokens; 6 non-token black overlays; 8 `rgba(255,214,0,…)` error tints (the audit's documented follow-up) — mint the minimal set, in the `--color-*`/`--shadow-*` namespaces only;
  - **minimum readable weight** for body/labels/dense UI (keep 300 for hero/marketing only);
  - **WCAG-AA approach** for secondary/placeholder text + `#FFD600` error over `wall.png` (scrim/overlay/opacity), preserving editorial aesthetics — `#FFD600` itself **stays** (constitution §III);
  - confirm **spacing fate**: no spacing lint in 039 (single-severity constraint); rule + mass grid-snap land together in a follow-up spec;
  - map each drift-register row to its fix **level** (screen/component/token).

## Phase 3: US1 — Token adherence + guardrails (P1)

- [x] T006 [US1] **Lane A (behavior-preserving)** `frontend`: replace the 222 exact-token-match raw whites with `--glass-*`/`--btn-*`/`--input-*`/`--card-*`/`--color-text-*` tokens (**not** `--text-*` — that `@theme` namespace is font sizes), the 32 exact radius dupes with `var(--radius-*)`, the 2 exact overlay blacks with `--color-overlay-*`, and the raw hex with `--color-*`; sweep the `WardrobeItemCard.tsx` stroke literal. Section by section; verify **pixel-identical vs the T004 baseline** after each batch.
- [x] T007 [US1] **Lane B (ratified consolidation)** `frontend`: apply the T005 mapping table — 152 off-token whites → ramp tokens; 13 off-scale radii → ratified targets; remaining black shadows/overlays and error tints → the newly minted tokens. `design-review` approves before/after screenshots per batch.
- [x] T008 [US1] Ratchet `--max-warnings` down as each batch lands (`npm run lint:css` → set the new lower number in `app/package.json`).
- [x] T009 [US1] After each batch: `ui-ux-designer` runs `design-review` live pass (Lane A: confirm no visual diff; Lane B: confirm the delta matches the ratified row).
- [x] T010 [US1] Flip the **token rules** (raw rgba/hex/off-scale radius) to **error** severity; keep `--max-warnings` only for the remaining duplicate-selector debt (drops in US4). No new CI wiring needed — `lint:css` already runs in `baseline-checks` and `preflight`.
- [x] T011 [US1] **Negative-scenario** guard evidence: a fixture with `border-radius: 7px` / raw white `rgba` makes `lint:css` exit non-zero locally, and a scratch commit shows the required **`baseline-checks`** check red (link the run). Evidence for AC-003 — do not collect it from the `test` check; it never runs stylelint.
- **Gate (AC-001/002/003):** grep raw `rgba(`/hex outside `tokens.css` = 0 in `app/src` CSS; no off-scale radii; seeded violation fails `baseline-checks`.

## Phase 4: US2 — Canonical + WCAG-AA (P2)  *(test-first)*

- [ ] T012 [US2] Commit **failing** Playwright + axe test asserting WCAG AA on landing/dashboard/Outfits (secondary/placeholder text + error over wallpaper).
- [ ] T013 [US2] `frontend`: apply the T005 token-level decisions (scrim/opacity for contrast; single button radius) → make T012 pass. Token edits **ratified by `ui-ux-designer`**.
- [ ] T014 [US2] `ui-ux-designer`: `design-review` live pass (desktop + mobile) — confirm editorial look preserved (thin headings, wallpaper, glass intact). Attach screenshots.

## Phase 5: US3 — Screen states & affordance (P3)  *(test-first, per screen)*

- [ ] T015 [US3] `ui-ux-designer`: `design-handoff` behavior spec for capsule-result (4 tabs: `items | outfits | gaps | shopping`), dashboard, landing (canonical state list: interaction hover/focus/active/disabled · content default/loading/empty/error · viewport mobile). Include the Outfits nested-card flattening (panel > card > layer-thumb triple nesting, placeholder-only innermost tiles).
- [ ] T016 [US3] Commit **failing** Playwright e2e: capsule-result tabs expose `tablist`/`tab` roles + `aria-selected` + arrow-key nav + visible hover/focus-visible (today: `aria-pressed` buttons, no hover/focus styles at all).
- [ ] T017 [US3] `frontend`: implement via **one shared tab treatment** (use `--tab-active-*` tokens) normalizing all three divergent families — `.capsule-result-tab`, `.journey-tab-*`, `.favorites-tab-*` (reuse rule AGENTS §7: extend the existing pattern, don't add a fourth variant) → make T016 pass. Keep URL-driven tab state (`?tab=`).
- [ ] T018 [US3] Commit **failing** e2e for dashboard panel empty states (Shopping list / Recently added render headed panels with blank bodies today), zero-stats treatment, app-level `loading.tsx`/`error.tsx` (none exist app-wide), and the Outfits empty/first-run flow; then implement → pass.
- [ ] T019 [US3] `design-review` live pass on each screen; polish to 2px.

## Phase 6: US4 — Modularize globals.css (P4)  *(behavior-preserving)*

- [ ] T020 [US4] `frontend`: **dedupe the ~196 duplicate/overriding selectors first** (rule order is load-bearing — the shipped invisible-auth-error bug was an override-order bug), then extract per-component styles out of `globals.css` into per-component files composed via **ordered `@import`/`@layer`** (per the 2026-07 audit); keep `tokens.css` canonical. Soft gate: ≤ ~300 lines per stylesheet; add the CSS row to the AGENTS §7 module-size table in the same change.
- [ ] T021 [US4] Verify **no visual diff** vs T004 baseline; complete the documented stylelint ratchet — flip `no-duplicate-selectors`/`declaration-block-no-duplicate-properties` to **error** and drop `--max-warnings` from `lint:css`; record the cross-file-duplicates limitation in Process Memory (per-file lint can't see them; review is the guard).

## Phase 7: Wrap

- [ ] T022 Update `.specify/memory/design-system.md` (decisions; **fix its stale radius scale** — the doc says 12px/24px, the real token scale is 6/8/14/20/50px) + `design-system-state.md` (drift register closed/updated).
- [ ] T023 Fill the `## Verification` table in `plan.md` with real evidence (commands, test names, run links, screenshots) — AC-003/negative evidence comes from `baseline-checks`, not `test`.
- [ ] T024 `npm run preflight` (repo root) green; open PR; do **not** merge until required checks are green + human approval.

---

## Process Memory

### Decisions
- **Editorial identity is intentional (constitution §III):** thin headings, glassmorphism, `wall.png`, achromatic palette, and `#FFD600` error are **kept**. Readability is reconciled via scrim/opacity, not by removing them. This is the guard against "de-slopping" the brand away.
- **Two-lane US1 (2026-07-10, verified by measurement):** 59 unique raw white alphas vs 20 token alphas — only 222 of 374 occurrences have an exact token; "replace with existing tokens + pixel-identical" is mathematically impossible for the other 152. Lane A = exact-match no-diff; Lane B = designer-ratified consolidation with expected micro-deltas.
- **Stylelint already existed** (2026-07 audit) with a `--max-warnings 102` budget wired into `baseline-checks`/`preflight`/lint-staged. 039 **extends** that config and owns the budget ratchet; adding warn rules without bumping the budget would have broken `baseline-checks` on the first commit.
- **Guardrail CI home is `baseline-checks`** (ci.yml runs `lint:css`); the `test` check never runs stylelint.
- **Visual baseline is same-machine before/after evidence**, not a CI gate — Playwright snapshots are platform-specific (macOS local vs ubuntu CI); CI drift protection is the stylelint guardrail.
- **No spacing lint in 039:** a stylelint rule instance has a single severity — a warn-only spacing pattern inside the colour/radius rules would block their `error` flip at T010. The spacing rule + the ~286-literal snap land together in a follow-up spec.
- Guardrails go in **before** mass cleanup (warn → error) so the refactor cannot regress and future drift is blocked at the source.
- Token changes are **proposed by `frontend`, ratified by `ui-ux-designer`** (tokens = the visual system the designer owns).
- Reconcile **by blast radius**: screen/component first, tokens last, live-review after each token change.
- New colour tokens go in the `--color-*` `@theme` namespace only — `--text-*` is font sizes in Tailwind v4; a colour there generates broken utilities.

### Dead ends
- **The audit's colour classes (white/black/yellow/hex) missed a fifth family** — 15 dark-grey
  chrome values; surfaced only because the stylelint rule counts refused to reconcile. Ratified
  post-hoc as §9.10. Lesson: derive cleanup scope from the guardrail's own counts, not from
  hand-picked grep classes.
- **Class-level scrim vs inline style:** `.capsule-result-preview-fallback` scrim was silently
  defeated by the component's inline `backgroundColor` — caught by design-review, fixed by
  painting the scrim in the `background-image` layer. Token swaps are NOT automatically safe
  where inline styles compose with classes.
- **Token normalization can collapse state pairs:** raising CTA rest .26 → `--btn-primary-bg`
  (.36) made rest == hover; the minted `--btn-primary-hover-bg` had to be applied in the same
  slice. Watch for rest/hover/active pairs whenever two drifted values consolidate onto one token.
- **Next dev overlay races screenshots** (`<nextjs-portal>` "N Issues") — the profile/mobile
  flake; excluded via `toHaveScreenshot.stylePath`, not by retries.

### Dead ends
- **"Snap everything to existing tokens with no visual diff"** — dead on arrival: 38 of 59 unique white alphas have no exact token (152 occurrences, hot spots `.16`×16, `.14`×12, `.06`×12). Nearest-token snapping without ratification would visibly shift high-count clusters.
- **Collecting the seeded-violation evidence from the `test` check** — it never runs stylelint; only `baseline-checks` does.

### Known issues / follow-ups
- Exact `globals.css` line numbers shift between branches — rely on the grep counts (374 raw white / 25 raw black / 8 error tints / 4 raw hex on this branch), not fixed lines.
- Genuine one-off values need a **documented stylelint exception**, not a silent literal — keep the exception list short and reviewed.
- Button-radius decision (pill vs sm) is **open** until T005.
- **Outfits content mismatch (product logic, out of 039 scope):** `buildOutfits()` renders at most 3 hardcoded synthetic cards while the count line shows the independently computed `outfitCount` — needs its own follow-up.
- **Post-split lint blindness:** per-file `no-duplicate-selectors` cannot see cross-file duplicates after US4 — review is the guard until a cross-file check exists.
- ~286 off-grid spacing literals ship unguarded beyond a warn rule — follow-up spec owns the snap.
