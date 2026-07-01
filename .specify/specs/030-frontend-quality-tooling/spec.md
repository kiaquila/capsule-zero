# Spec 030 — Frontend Quality Tooling & Quick-Win Cleanups

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
  New `lint:css` script; wired into `ci:check` and the pre-commit `lint-staged`.
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
  by stylelint `no-duplicate-selectors` at commit time (pre-commit lint-staged
  on the changed `*.css`) and in `lint:css`. Verified empirically against the
  original `.auth-server-message` case.
- **A raw `#FFD600` reintroduced for a `color`/`background`/`border`** is flagged
  by the disallowed-list rule.
- **The tooling must not break CI:** all new rules are warnings-first, so
  `lint`/`lint:css` exit 0 despite existing debt.

## TDD Waiver

This change is tooling, config, dependency, and non-behavioural CSS/dead-code
cleanup — no product behaviour changes. Per the constitution's TDD scope
(application code only; infra/config/tooling excluded), the failing-test-first
loop does not apply. Evidence is `npm run ci:check` (lint + lint:css + typecheck
+ build) green, recorded in `plan.md`.
