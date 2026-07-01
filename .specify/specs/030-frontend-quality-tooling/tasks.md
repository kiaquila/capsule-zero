# Tasks 030 — Frontend Quality Tooling & Quick-Win Cleanups

## Tasks

- [x] Consolidated audit report (3 parallel reviewers) under `docs_capsule_zero/project/frontend/`
- [x] Add stylelint + `app/stylelint.config.mjs` + `lint:css` + wire into `ci:check` and `lint-staged`
- [x] Enable `eslint-plugin-jsx-a11y` label rules (warn)
- [x] Delete dead `Button.tsx`; remove `framer-motion`
- [x] Remove the stale `.dashboard-more-item-active` duplicate
- [x] Replace solid `#FFD600` with `var(--color-error)`
- [x] Verify `npm run ci:check` green

## Process Memory

### Dead Ends
- Considered extending `stylelint-config-standard`. Rejected for now: on a
  6,392-line hand-written `globals.css` it floods hundreds of formatting/naming
  warnings and drowns the signal. Used a focused rule set targeting the actual
  bug classes (duplicate selectors, hardcoded error colour). Ratchet to the
  standard config after the CSS is split into layered per-feature files.
- Considered enforcing `var(--color-error)` for the `rgba(255,214,0,α)` error
  *tints* too. Rejected: converting them to `var()` drops the alpha; they need
  dedicated alpha tokens (a follow-up), so the disallowed-list rule was narrowed
  to the solid hex only.

### Decisions
- **Warnings-first.** All new stylelint + jsx-a11y rules are `warning`, not
  `error`, because the legacy CSS carries ~196 duplicate selectors and the app
  has 14 a11y label gaps. This keeps CI green while surfacing new issues at
  commit time (pre-commit `lint-staged` runs stylelint on changed CSS). Ratchet
  to `error` after the CSS split.
- **`no-duplicate-selectors` uses `disallowInList: true`** — the default only
  catches identical full rules, but the original bug had the selector reused
  across *different* grouped lists. Verified `disallowInList` flags it.
- **Auth a11y labels not fixed here.** `AuthPanel.tsx` is being edited in the
  open auth-slice PR; fixing labels here would double-edit the same file. Left
  as surfaced warnings + a documented follow-up.
- **Report location:** `docs_capsule_zero/project/frontend/frontend-quality-audit-2026-07.md`,
  the frontend-docs home, so the findings are discoverable during `/web` work.

### Known Issues
- 102 stylelint + 14 jsx-a11y warnings remain against legacy debt (intentional,
  warnings-first). The larger refactors that clear them (CSS `@layer`/split,
  `WardrobeListShell`, error/loading boundaries, palette-compatibility
  unification, the honesty pass on the fake capsule/wardrobe flows) are deferred
  to their own PRs and enumerated in the audit report's remediation sequencing.
