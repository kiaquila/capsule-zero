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

PR reviewers (human and AI) reject PRs for specs `025` and onward that introduce product behavior without a corresponding test commit that landed first. Specs `001-024` are grandfathered for the TDD-history requirement.

**This loop applies to application code only** — user-visible web UI, the React Native app, and Go API behaviors. Infrastructure and delivery wiring (CI/CD workflows, Dockerfiles, `docker-compose` files, nginx and service config, deploy/provisioning scripts), documentation, and other non-product support changes are **out of scope** for the failing-test-first loop. They still need Supervised Verification, but the evidence is layer-appropriate — `docker compose config`, `nginx -t`, a smoke/health check against the deployed surface, or a linked successful run, recorded in the spec's `## Verification` table. A change that is entirely infra/docs/support carries a one-line waiver in `spec.md`, and the `test` check does not gate it.

## What lives where

### `tests/e2e/` — Playwright web tests

- **Language**: TypeScript, strict mode.
- **Target today**: `http://localhost:3000` (Next.js `/app`). `/app` remains the canonical web frontend; POM classes should survive component rewrites as long as `data-testid` contracts are preserved.
- **Run locally**:
  ```bash
  npm run test:e2e:install   # one-time: install Playwright deps and browsers
  npm run lint:e2e           # enforce POM selector rules
  npm run typecheck:e2e      # typecheck test fixtures, pages, and specs
  npm run test:e2e           # run all specs against /app
  ```
  From `tests/e2e/` directly:
  ```bash
  npm run test               # full suite
  npm run test:headed        # with visible browser
  npm run test:report        # open last HTML report
  ```
- **Run in CI**: job `test` in `.github/workflows/test.yml` runs e2e lint, e2e typecheck, `/app` build, and Playwright. Required check on `main`.

### `tests/unit/` — Go unit tests (stub)

`go test ./tests/unit/...` will be the entry once Go API code lands. Per-package table-driven tests; helpers live in `tests/unit/internal/`. See `tests/unit/README.md`.

### `tests/mobile/` — Detox tests (stub)

`detox test` against the React Native binary once the RN app lands. POM/Screen-Object discipline matches `tests/e2e/`. See `tests/mobile/README.md`.

## Rules for `tests/e2e/`

### Page Object Model (POM) is mandatory

- **All selectors live in `tests/e2e/pages/`.** Subclasses of `BasePage`, named after the screen or component.
- **Specs MUST NOT call `page.locator()` or `page.getBy*()` directly.** Use a POM accessor.
- This rule is enforced by ESLint (`no-restricted-syntax`) in `tests/e2e/eslint.config.mjs`. Running `npm run lint:e2e` fails the build on a violation, and the required `test` job runs it before Playwright.

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

### Visual baseline (`*.visual.spec.ts`, spec 039)

Opt-in screenshot suite (`specs/visual/`) — the no-diff reference for
behavior-preserving CSS refactors (spec 039 US1 Lane A / US4). **Not part of
the CI `test` job**: Playwright snapshots are platform-specific (macOS local vs
ubuntu CI), so the evidence is a **same-machine before/after run** attached to
the PR; CI drift protection is the stylelint token guardrail.

```bash
# generate/update baselines (before the refactor):
E2E_VISUAL=1 npm --prefix tests/e2e run test -- --project visual-desktop --project visual-mobile --update-snapshots
# compare (after the refactor) — must be green:
E2E_VISUAL=1 npm --prefix tests/e2e run test -- --project visual-desktop --project visual-mobile
```

Projects: `visual-desktop` (Desktop Chrome) and `visual-mobile` (chromium
mobile emulation, 375×812 — one engine on purpose, least snapshot flake).
Animations are disabled via the shared `toHaveScreenshot` config.

### Standalone origin guard (`*.standalone.spec.ts`)

Most specs run against the `next dev` server on `localhost:3000` (projects
`chromium` + `webkit-iphone`). A **defect that only manifests under the
production standalone server** (`node server.js`, `HOSTNAME=0.0.0.0`) cannot be
caught there — `next dev` never runs that way. The `origin-guard` Playwright
project exists for exactly that class of bug (introduced for spec 037's
callback-redirect fix):

- **Naming**: a guard spec is named `*.standalone.spec.ts`. The browser projects
  `testIgnore` that suffix; only the `origin-guard` project `testMatch`es it.
- **Opt-in**: it is gated behind `E2E_ORIGIN_GUARD=1` because it rebuilds `/app`
  as a standalone bundle (~2 min). CI sets the flag in
  `.github/workflows/test.yml` (required `test` job); local `npm test` skips it
  unless you export the flag. It never runs against an external `E2E_BASE_URL`.
- **Isolation**: the guard build uses `NEXT_DIST_DIR=.next-origin-guard` so it
  never clobbers the `.next` the dev server uses; shared constants
  (canary origin, port) live in `fixtures/origin-guard.ts` and are imported by
  both `playwright.config.ts` and the spec so they can't drift. The matching
  `.next-origin-guard/**/types` globs are pre-included in `app/tsconfig.json` so
  local guard builds do not rewrite the worktree.
- **Assertion style**: these are request-level (`request.get(url, {
  maxRedirects: 0 }`)) — no rendered UI, so no Page Object. Assert on the
  response status and headers.

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

## Stable Selector Map

| Contract                                  | Current value                                            |
| ----------------------------------------- | -------------------------------------------------------- |
| `playwright.config.ts` webServer          | `npm --prefix ../../app run dev`                         |
| `pages/LandingPage.path`                  | `/en`                                                    |
| `data-testid` attrs on landing components | keep stable when `/app/src/components/landing/*` changes |
| origin-guard flag / spec suffix / port    | `E2E_ORIGIN_GUARD=1` · `*.standalone.spec.ts` · `3100`   |
| origin-guard canary origin                | `fixtures/origin-guard.ts` (`https://origin-guard.canary.test`) |

The POM classes should not change for markup-only rewrites.
