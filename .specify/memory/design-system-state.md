# Capsule Zero — Design System State & Governance

> Governance/state annex to the descriptive [`design-system.md`](./design-system.md).
> Produced by the `design-system` skill's Step 0 (reconnaissance) for feature
> `039-design-system-consistency`. Source of truth is **code**; this file classifies it.
> Metrics measured on branch `refactor/039-design-system-consistency` (off `main`).

## System state
- **Maturity:** `complete-but-inconsistent`
- **Justification:** a strong, fully tokenized foundation exists (`app/src/styles/tokens.css`,
  305 lines, Tailwind v4 `@theme`, sourced from `html-prototypes/design-system.html`), **but
  adherence leaks badly at the usage layer** — hundreds of hardcoded values bypass the tokens
  and radii drift off-scale, all inside one ~6.5k-line stylesheet. This is the "even with a
  design system it starts spreading apart" case exactly.
- **Source of truth:** code — `app/src/styles/tokens.css` (tokens) + `app/src/app/globals.css` (usage, 6534 lines). Prototype reference (input only): `html-prototypes/design-system.html`. Descriptive doc: `.specify/memory/design-system.md`.
- **Last audited:** 2026-07-09

## Foundation — strong (keep, don't rebuild)
`app/src/styles/tokens.css` defines, as real tokens: achromatic palette + 10-step gray scale;
semantic `--color-error:#FFD600` (yellow) + `--color-fav`; `--glass-*` surfaces; text-on-glass
white `.95/.70/.38`; `--btn-*`/`--card-*`/`--input-*`/`--toggle-*`/`--tab-active-*`/`--nav-*`;
type (Helvetica Neue, 9→64px, `--text-editorial` weight **300**, leading/tracking); 8px spacing
grid; radius `xs6/sm8/md14/lg20/pill50/circle`; shadows/transitions/z-index/layout.

## Drift register (reconciliation backlog — prioritized)
Fix level per `design-system` skill: **screen / component / token**. Order by blast radius (screen first, token last); ratify token decisions with `ui-ux-designer`.

| # | Inconsistency (evidence, this branch) | Canonical decision | Fix level |
|---|---|---|---|
| 1 | **374** raw `rgba(255,255,255,α)` literals in `app/src/app/globals.css` bypassing `--glass-*`/`--btn-*`/`--input-*`/`--text-*` | **RATIFIED 2026-07-10** → [`design-system.md` §9.2](./design-system.md): 222 exact matches → existing tokens (Lane A, T006); all 38 off-token alphas / 152 occ mapped — 7 new `--color-white-aNN` primitives + text ramp `.95/.78/.50/.38` (secondary retuned `.70→.78`); 1 documented exception (data-URI stroke) | token (ramp + retunes) + component/screen application (Lane B, T007) |
| 2 | **4** raw hex bypassing tokens (e.g. `#2a2a2a`, `#fff` in `globals.css`) | **RATIFIED** → existing `--color-*` tokens, Lane A exact-match (T006); no new tokens needed | component |
| 3 | **Radius drift** — off-scale one-offs not in the token set: `999px`×4, `2px`×3, `11px`×2, `5px`, `4px`, `18px`, `10px`; plus literals duplicating tokens: `8px`×16 (=sm), `6px`×3 (=xs), `20px`×2 (=lg), `14px`×2 (=md) | **RATIFIED** → [`design-system.md` §9.3/§9.5](./design-system.md): **one button radius = `--radius-pill`** (CTA family; 5 entry-surface buttons migrate from sm ⚑); `999/11/2px` → pill (pixel-identical via corner clamping), `4/5px` → xs, `10px` → sm, `18px` → lg; zero radius exceptions; dupes are Lane A | token adherence (Lane A) + **component** (button family migration, Lane B) |
| 4 | Effectively **one ~6534-line `globals.css`** (2 css files total incl. tokens.css) — no per-component modularization | Extract per-component styles → one home per component (mechanism ratified in spec US4: dedupe ~196 selectors first, then ordered `@import`/`@layer` split — T020/T021) | architecture (root enabler of all drift) |
| 5 | Low contrast: `--color-text-secondary` white `.70` + placeholder `.38` over grayscale wallpaper; error = **yellow #FFD600** on light glass | **RATIFIED** → [`design-system.md` §9.7](./design-system.md): hybrid — secondary `.70→.78` + dim `.62–.68` band snaps up; local `--color-scrim` (black `.35`) backing behind every `#FFD600` text run and under-AA text panels (generalizes the existing `.my-items-photo-error` pattern); `--input-focus-border` `.36→.82`; placeholder `.38` kept (exempt, labels mandatory); `#FFD600` unchanged | **token** (2 retunes + `--color-scrim`/`--color-text-muted`) + **component** (scrim chips) + review (T012–T014 axe/sampling) |
| 6 | Thin weight in working UI: `.text-editorial{font-weight:300}`, profile titles 25px/300 | **RATIFIED** → [`design-system.md` §9.6](./design-system.md): `<20px → ≥400` · `20–27px → ≥300` · `≥28px → ≥200` (display numerals/hero only). 24–25px/300 titles remain; `.landing-manifesto p` 17px/300 → 400 ⚑; audit global `h2{300}` in T013 | token/typography (rule) + **screen** (per-screen audits) |
| 7 | **Background image** `wall.png` behind glass UI | *Design decision, not a bug — reconfirmed:* wallpaper + gradient overlay stay untouched; readability lands via the §9.7 local-scrim policy, not overlay re-tinting | design decision + review |
| 8 | Tab affordance (verified 2026-07-10): capsule-result has **4** tabs (`items\|outfits\|gaps\|shopping`) as `aria-pressed` buttons with **no hover/focus-visible styles and no tablist/tab roles**; journey + favorites tabs have `role="tab"` + hover but no focus-visible; none have arrow keys — **three divergent implementations**. Dashboard first-run hero exists but panels render headed with blank bodies; **no `loading.tsx`/`error.tsx` app-wide**; nested/empty cards on Outfits *(designer live-app observations — Vanya, refined by code audit)* | One shared tab treatment across all three families (`--tab-active-*` tokens; states per canonical list — behavior spec lands via `design-handoff` in T015); panel empty states + app-level loading/error; flatten nested cards; modal backdrops unify on new `--color-backdrop` (§9.4) | component + screen |

> **Canonical decisions ratified 2026-07-10** (T005): full tables in [`design-system.md` §9](./design-system.md) —
> 22 new tokens (7 white primitives, 3 text/control-state, 3 scrims/backdrop, 2 dot-rings, 3 error tints, 4 shadows — §9.1),
> 2 retunes (`--color-text-secondary`, `--input-focus-border`), 1 documented exception. Doc follow-up for T022:
> `docs_capsule_zero/project/frontend/styling.md` still quotes the stale "12px buttons / 24px panels" radii —
> actualize together with the §9 outcomes in the same change (AGENTS §9 no-doc-drift).

## Guardrails ("зашить в гардрейлы" — stop drift at the source)
- **CI/lint:** **extend the existing `app/stylelint.config.mjs`** (wired into `lint:css` → required `baseline-checks` CI + root `preflight` + lint-staged since the 2026-07 audit, with a `--max-warnings 102` duplicate-selector budget) to also forbid raw `rgba(` and raw hex outside `tokens.css` and off-scale radius literals; manage the warnings budget so `baseline-checks` stays green mid-refactor, then ratchet to `error`. Kills drift #1–#3 permanently. No spacing rule in 039 — it lands with its remediation in a follow-up spec (single-severity constraint).
- **Extract components** out of `globals.css` (fixes #4 root cause).
- Every component ships the **canonical state list** (interaction hover/focus/active/disabled · content default/loading/empty/error · viewport mobile).
- **Token changes proposed by `frontend`, ratified by `ui-ux-designer`**; fix at the right level.

## Component inventory (verified partial — full audit is task 1)
| Component | Shared/tokenized? | States seen | Notes |
|---|---|---|---|
| Button | yes (`--btn-*`) | hover, disabled | radius inconsistent (drift #3) |
| Input | yes (`--input-*`) | focus, error | |
| Select | yes | focus | `profile-select` |
| Toggle | yes (`--toggle-*`) | on/off | |
| Card | yes (`--card-*`) | hover | nested/empty on Outfits (drift #8) |
| Tabs | tokens exist (`--tab-active-*`) | **missing** — renders as plain text | drift #8 |
| Nav / Sheet / Modal | yes (`--glass-nav/-sheet`, `--z-modal`) | — | |
| Badge/Tag · Tooltip · Empty state · Error state | **audit needed** | — | `--z-tooltip` exists; empty states reported missing |
