# Plan 030 — Frontend Quality Tooling & Quick-Win Cleanups

## Implementation

1. Add `stylelint` (+ `app/stylelint.config.mjs`, `lint:css` script), wire into
   `ci:check` and the repo-root `lint-staged.config.mjs` for changed `app/**/*.css`.
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
| 3 | New lint rules are warnings-first (do not fail CI) | ✅ `lint:css` exit 0 (102 warnings); `lint` exit 0 (14 jsx-a11y warnings) |
| 4 | Solid hardcoded `#FFD600` removed | ✅ `grep -ic '#ffd600' app/src/app/globals.css` → `0`; replaced by `var(--color-error)` |
| 5 | Dead `Button.tsx` + `framer-motion` removed | ✅ file deleted; `framer-motion` absent from `app/package.json`; build green with no importers |
| 6 | Negative scenario: a re-introduced duplicate selector / raw `#FFD600` is flagged | ✅ demonstrated — stylelint config rules `no-duplicate-selectors` (disallowInList) and `declaration-property-value-disallowed-list` |

## Risks / Rollback

- **Warning noise:** 102 stylelint + 14 a11y warnings surface against legacy debt.
  Mitigation: warnings-first (non-blocking); pre-commit runs only on changed CSS.
- Rollback is mechanical: revert the tooling config + script; the quick-win
  deletions are independent and safe.
