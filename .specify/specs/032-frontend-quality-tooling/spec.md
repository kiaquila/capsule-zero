# Spec 032 — Frontend Quality Tooling & Quick-Win Cleanups

## Goal

Add the missing automated controls that would have caught the shipped
invisible-auth-error bug (a duplicate/overriding CSS rule), and apply the safest
quick-win cleanups surfaced by the 2026-07 frontend quality audit
(`docs_capsule_zero/project/frontend/frontend-quality-audit-2026-07.md`).

## Scope

### In scope
- **stylelint** for `app/**/*.css` — focused, warnings-first config
  (`app/stylelint.config.mjs`): `no-duplicate-selectors` (`disallowInList`),
  `declaration-block-no-duplicate-properties`, and an error-colour-token rule.
  New `lint:css` script with a `--max-warnings 102` regression baseline; wired
  into `ci:check`, the pre-commit `lint-staged`, the repo-root `lint:css`
  projection + `preflight`, and the required `baseline-checks` CI job.
- **eslint-plugin-jsx-a11y** label rules turned on (warn).
- Quick-wins: delete the dead `Button.tsx` design system + drop `framer-motion`;
  remove the second live duplicate-override (`.dashboard-more-item-active`);
  replace the 5 solid hardcoded `#FFD600` literals with `var(--color-error)`.
- The consolidated audit report (findings + tooling proposal + sequencing).

### Out of scope (deferred to follow-ups, tracked in the audit report)
- `error.tsx`/`loading.tsx` boundaries; `WardrobeListShell` extraction; CSS
  `@layer`/per-feature split; `palette-compatibility.ts` unification.
- Auth a11y label fix (the auth form is edited in the open auth-slice PR).
- rgba error-tint alpha tokens; the "honesty pass" on the fake flows (needs a
  founder decision).
- Ratcheting the new lint rules from `warning` to `error` (blocked on the CSS
  split; the legacy `globals.css` carries ~196 duplicate selectors).

## Negative Scenarios

- **A newly introduced duplicate selector** (the original bug class) is flagged
  by stylelint `no-duplicate-selectors` at commit time (pre-commit lint-staged:
  any changed app CSS triggers a whole-tree lint) and in `lint:css`, and fails
  the run via the `--max-warnings 102` baseline. Verified empirically against
  the original `.auth-server-message` case (probe: 104 found → exit 2).
- **A raw `#FFD600` reintroduced for a `color`/`background`/`border`** is flagged
  by the disallowed-list rule.
- **The tooling must not break CI on legacy debt:** all new rules are
  warnings-first, so `lint`/`lint:css` exit 0 at the current 102-warning
  baseline — while any warning past the baseline fails the run.

## TDD Waiver

This change is tooling, config, dependency, and non-behavioural CSS/dead-code
cleanup — no product behaviour changes. Per the constitution's TDD scope
(application code only; infra/config/tooling excluded), the failing-test-first
loop does not apply. Evidence is `npm run ci:check` (lint + lint:css + typecheck
+ build) green, recorded in `plan.md`.
