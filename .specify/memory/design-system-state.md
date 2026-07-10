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
| 1 | **374** raw `rgba(255,255,255,α)` literals in `app/src/app/globals.css` bypassing `--glass-*`/`--btn-*`/`--input-*`/`--text-*` | Replace with existing tokens | component/screen (systemic) |
| 2 | **4** raw hex bypassing tokens (e.g. `#2a2a2a`, `#fff` in `globals.css`) | Use `--color-*` tokens | component |
| 3 | **Radius drift** — off-scale one-offs not in the token set: `999px`×4, `2px`×3, `11px`×2, `5px`, `4px`, `18px`, `10px`; plus literals duplicating tokens: `8px`×16 (=sm), `6px`×3 (=xs), `20px`×2 (=lg), `14px`×2 (=md) | Snap all radii to the token scale; **decide one button radius** (pill vs sm) — the mechanism behind the square-vs-rounded button | token adherence |
| 4 | Effectively **one ~6534-line `globals.css`** (2 css files total incl. tokens.css) — no per-component modularization | Extract per-component styles → one home per component | architecture (root enabler of all drift) |
| 5 | Low contrast: `--color-text-secondary` white `.70` + placeholder `.38` over grayscale wallpaper; error = **yellow #FFD600** on light glass | Raise min text opacity / add local scrim; reconsider error hue | token + review |
| 6 | Thin weight in working UI: `.text-editorial{font-weight:300}`, profile titles 25px/300 | Min weight for body/labels/dense UI (keep 300 for hero/marketing only) | token/typography |
| 7 | **Background image** `wall.png` behind glass UI | *Design decision, not a bug:* glass morphism depends on a wallpaper. Reconcile readability via overlay/scrim strength, don't remove | design decision + review |
| 8 | Tabs (Items/Outfits/Missing) render as plain text; missing hover/focus/active broadly; unclear first-run; nested/empty cards on Outfits *(designer live-app observations — Vanya)* | Tabs get real affordance + states; add onboarding/empty states; flatten nested cards | component + screen |

## Guardrails ("зашить в гардрейлы" — stop drift at the source)
- **CI/lint:** forbid raw `rgba(255,255,255…` and raw hex outside `tokens.css`; forbid off-scale radius/spacing literals (stylelint `declaration-property-value-disallowed-list` / allowed-list, or a custom check) in `preflight` + CI. Kills drift #1–#3 permanently.
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
