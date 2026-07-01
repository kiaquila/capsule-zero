# Tasks 032 — Frontend Quality Tooling & Quick-Win Cleanups

## Tasks

- [x] Consolidated audit report (3 parallel reviewers) under `docs_capsule_zero/project/frontend/`
- [x] Add stylelint + `app/stylelint.config.mjs` + `lint:css` + wire into `ci:check` and `lint-staged`
- [x] Enable `eslint-plugin-jsx-a11y` label rules (warn)
- [x] Delete dead `Button.tsx`; remove `framer-motion`
- [x] Remove the stale `.dashboard-more-item-active` duplicate
- [x] Replace solid `#FFD600` with `var(--color-error)`
- [x] Verify `npm run ci:check` green
- [x] Wire `lint:css` into the required CI path (root projection + `baseline-checks` step + `preflight`) with a `--max-warnings 102` baseline (Codex P2)
- [x] Renumber feature folder `030` → `032` (numbers taken on `main` by specs 030/031)

## Process Memory

### Dead Ends
- Considered running stylelint at `error` severity on PR-changed CSS files only
  (three-dot diff + `xargs stylelint`). Rejected: stylelint warnings are
  file-scoped, and effectively all legacy debt lives in the single
  `globals.css` — any edit to it would drag all ~102 legacy warnings into
  `error` and wall off the main stylesheet. The whole-tree `--max-warnings`
  baseline gives the same new-regression protection without that trap.
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
  commit time (pre-commit `lint-staged`: a changed app CSS file triggers a
  whole-tree stylelint run). Ratchet to `error` after the CSS split.
- **`--max-warnings 102` baseline (Codex P2 follow-up).** The required
  `baseline-checks` job runs the repo-root `npm run lint`, which never invoked
  `lint:css` — the CSS lint ran in zero CI paths. Wired a root `lint:css`
  projection (modeled on `lint:e2e`), a dedicated "Run CSS lint" step in
  `ci.yml`, and the `preflight` chain. The pinned baseline turns warnings-first
  into real regression protection: the 102 legacy warnings stay green, any new
  warning fails the run (live probe: 104 found → exit 2). The severity ratchet
  to `error` (and dropping the baseline) still waits for the CSS split.
- **Feature folder renumbered `030` → `032`.**
  `030-remove-stale-flutter-mobile-shell` and `031-agent-instructions-cleanup`
  landed on `main` first and took the numbers.
- **`no-duplicate-selectors` uses `disallowInList: true`** — the default only
  catches identical full rules, but the original bug had the selector reused
  across *different* grouped lists. Verified `disallowInList` flags it.
- **Auth a11y labels not fixed here.** `AuthPanel.tsx` is being edited in the
  open auth-slice PR; fixing labels here would double-edit the same file. Left
  as surfaced warnings + a documented follow-up.
- **Report location:** `docs_capsule_zero/project/frontend/frontend-quality-audit-2026-07.md`,
  the frontend-docs home, so the findings are discoverable during ongoing `/app`
  frontend work (`/app` is canonical — no `/app`→`/web` rename planned).

### Known Issues
- The count-based `--max-warnings` baseline is coarse: a PR that fixes N legacy
  warnings and introduces N new ones nets zero and passes. Accepted until the
  CSS split enables `error` severity per rule.
- 102 stylelint + 14 jsx-a11y warnings remain against legacy debt (intentional,
  warnings-first). The larger refactors that clear them (CSS `@layer`/split,
  `WardrobeListShell`, error/loading boundaries, palette-compatibility
  unification, the honesty pass on the fake capsule/wardrobe flows) are deferred
  to their own PRs and enumerated in the audit report's remediation sequencing.
