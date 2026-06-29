# Capsule Zero Tests

> Canonical home for **all** automated tests in this repo. Read this before you write or change a test.

## Layout

```
tests/
├── e2e/         Playwright (TypeScript) — web user-visible flows. Currently target: /app (Next.js).
├── unit/        go test — Go API package tests. Stub today; populated when the Go monolith lands.
└── mobile/      Detox — React Native e2e. Stub today; populated when the RN app lands.
```

Each subfolder is a standalone workspace with its own dependencies and run commands. They do **not** share `node_modules` with `/app`.

## TDD is mandatory for every spec ≥ 025

The loop is non-negotiable:

1. **Write a failing test** for the next acceptance criterion from `spec.md`.
2. **Run it** and confirm it fails for the reason you expect (not for a typo, missing import, or mis-spelled selector).
3. **Commit the failing test.** This commit is the visible TDD step in PR history.
4. **Implement the minimum code** that makes the test pass — nothing more.
5. **Run again**, confirm green.
6. **Commit the implementation.**
7. **Refactor with the safety net of the green test.**

PR reviewers (human and AI) reject PRs that introduce product behavior without a corresponding test commit that landed first. Specs `001-003` are grandfathered and out of scope.

## What lives where

### `tests/e2e/` — Playwright web tests

- **Language**: TypeScript, strict mode.
- **Target today**: `http://localhost:3000` (Next.js `/app`). After `/app` is removed, target retargets to `/web` by editing `playwright.config.ts` `webServer.command` and `pages/LandingPage.path`. No spec or POM body changes are required.
- **Run locally**:
  ```bash
  npm run test:e2e:install   # one-time: install Playwright deps and browsers
  npm run test:e2e           # run all specs against /app
  ```
  From `tests/e2e/` directly:
  ```bash
  npm run test               # full suite
  npm run test:headed        # with visible browser
  npm run test:report        # open last HTML report
  ```
- **Run in CI**: job `test` in `.github/workflows/test.yml`. Required check on `main`.

### `tests/unit/` — Go unit tests (stub)

`go test ./tests/unit/...` will be the entry once Go API code lands. Per-package table-driven tests; helpers live in `tests/unit/internal/`. See `tests/unit/README.md`.

### `tests/mobile/` — Detox tests (stub)

`detox test` against the React Native binary once the RN app lands. POM/Screen-Object discipline matches `tests/e2e/`. See `tests/mobile/README.md`.

## Rules for `tests/e2e/`

### Page Object Model (POM) is mandatory

- **All selectors live in `tests/e2e/pages/`.** Subclasses of `BasePage`, named after the screen or component.
- **Specs MUST NOT call `page.locator()` or `page.getBy*()` directly.** Use a POM accessor.
- This rule is enforced by ESLint (`no-restricted-syntax`) in `tests/e2e/eslint.config.mjs`. Running `npm --prefix tests/e2e run lint` fails the build on a violation.

### Selector strategy

- **Prefer `data-testid`** on the product side. They are stable, document test intent, and survive class-name and copy churn.
- When `data-testid` is missing, add it to the product component as part of the same PR (minimal change). If you can't add an attribute, fall back to ARIA roles or semantic HTML attributes (`autocomplete`, `aria-label`) — in that order. CSS class names are last resort.

### Locale-neutral assertions

- UI copy may shift between EN and RU. **Assert on structure and state, not on rendered text.** When a text assertion is unavoidable, source it from `fixtures/locales.ts`.

### One scenario per spec file

- A single `.spec.ts` file describes one user-visible scenario. Keep it under 5 `test()` cases.
- Every spec covers **at least one negative scenario** (what should NOT happen). The first two specs (`cookie-banner.spec.ts`, `auth-popup.spec.ts`) follow this rule.

### Fixtures

- `fixtures/base.ts` exports the project's `test` (custom-extended Playwright `test`) and `expect`. Specs import from there, not from `@playwright/test`.
- Add a new fixture only when at least two specs need it. Premature fixtures hurt readability.

## Adding a new e2e test

1. Open the spec under `.specify/specs/<NNN>-<slug>/spec.md` and pick the next unverified acceptance criterion.
2. Add or extend a Page Object under `tests/e2e/pages/`.
3. Write a new `.spec.ts` under `tests/e2e/specs/<feature>/` that uses the POM.
4. Run `npm run test:e2e`. The test MUST fail because the product code does not satisfy the criterion yet.
5. Commit with message like `test(NNN): cover <AC-id> for <screen>`.
6. Implement the product change (web, mobile, or backend).
7. Run again — green.
8. Commit with message like `feat(NNN): satisfy <AC-id>`.
9. Open PR and link both commits in the SENAR Done Gate row about TDD.

## Migration map (when `/app` is deleted)

| Today                                                                 | After `/web` ships                                       |
| --------------------------------------------------------------------- | -------------------------------------------------------- |
| `playwright.config.ts` webServer = `npm --prefix ../../app run start` | `npm --prefix ../../web run start`                       |
| `pages/LandingPage.path` = `/en`                                      | `/en` (same — next-intl routes match)                    |
| `data-testid` attrs on `/app/src/components/landing/*`                | re-add the same attrs on `/web/src/components/landing/*` |

The POM classes themselves do not change.
