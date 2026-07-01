# Plan 032 — Frontend Quality Tooling & Quick-Win Cleanups

## Implementation

1. Add `stylelint` (+ `app/stylelint.config.mjs`, `lint:css` script with a
   `--max-warnings 102` regression baseline), wire into `ci:check`, the repo-root
   `lint:css` projection + `preflight` chain, the required `baseline-checks` CI
   job (`.github/workflows/ci.yml`, step "Run CSS lint"), and the repo-root
   `lint-staged.config.mjs` (any changed `app/**/*.css` triggers a whole-tree
   CSS lint).
2. Enable `eslint-plugin-jsx-a11y` label rules (warn) in `app/eslint.config.mjs`.
3. Delete `app/src/components/ui/Button.tsx`; remove `framer-motion`.
4. Remove the stale `.dashboard-more-item-active` duplicate in `globals.css`.
5. Replace solid `#FFD600` literals with `var(--color-error)`.
6. Ship the consolidated audit report under `docs_capsule_zero/project/frontend/`.

## Verification

| # | Acceptance criterion | Evidence |
|---|----------------------|----------|
| 1 | `npm run ci:check` (lint + lint:css + typecheck + build) is green | ✅ local run 2026-07-01: build emitted the full route manifest; chain is `lint && lint:css && typecheck && build`, so all stages passed |
| 2 | stylelint flags a duplicate selector (the original bug class) | ✅ `lint:css` reports `.dashboard-more-item-active` (5966↔528) and the `.auth-server-message` case; 102 warnings, 0 errors, exit 0 |
| 3 | Legacy debt is non-blocking, but NEW CSS warnings fail the run | ✅ `lint:css` exit 0 at the 102-warning baseline; live probe (duplicate selector + raw `#FFD600` appended) → `Max warnings exceeded: 104 found. 102 allowed`, exit 2; tree restored, exit 0 again (2026-07-01). `lint` exit 0 (14 jsx-a11y warnings) |
| 4 | Solid hardcoded `#FFD600` removed | ✅ `grep -ic '#ffd600' app/src/app/globals.css` → `0`; replaced by `var(--color-error)` |
| 5 | Dead `Button.tsx` + `framer-motion` removed | ✅ file deleted; `framer-motion` absent from `app/package.json`; build green with no importers |
| 6 | Negative scenario: a re-introduced duplicate selector / raw `#FFD600` is flagged | ✅ demonstrated live — the row-3 probe fired both `no-duplicate-selectors` (disallowInList) and `declaration-property-value-disallowed-list`, and the run failed with exit 2 |
| 7 | `lint:css` runs in the required CI path (Codex P2) | ✅ `.github/workflows/ci.yml` job `baseline-checks` gained the step "Run CSS lint" → root `npm run lint:css` (projection modeled on `lint:e2e`); also chained into root `preflight` |

## Risks / Rollback

- **Warning noise:** 102 stylelint + 14 a11y warnings surface against legacy debt.
  Mitigation: warnings-first (legacy stays non-blocking via the `--max-warnings
  102` baseline); pre-commit triggers on changed CSS and lints the whole tree.
- Rollback is mechanical: revert the tooling config + script; the quick-win
  deletions are independent and safe.
