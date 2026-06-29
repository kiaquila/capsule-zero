# Feature Specification: E2E Tests + TDD Doctrine + `test` Gate

**Feature Branch**: `feat/025-e2e-tests`
**Created**: 2026-06-29
**Status**: Draft
**Input**: User direction (2026-06-29): introduce a mandatory `test` GitHub check with Playwright e2e tests, organise tests in their own folder using POM/OOP, write first tests against shipped functionality (cookie banner + auth popup), and codify TDD as the standard going forward.

## Goal _(mandatory)_

Every Capsule Zero PR must prove its acceptance criteria with at least one automated test that fails before the implementation lands and passes after it, enforced by a new required GitHub check named `test`.

## Scope _(mandatory)_

In scope:

- New required CI gate: `.github/workflows/test.yml` with a job whose `name` is `test`, running Playwright e2e tests against the legacy Next.js app under `/app`.
- New top-level `tests/` directory:
  - `tests/README.md` — TDD doctrine, POM rules, run-command reference, layer map.
  - `tests/e2e/` — full standalone Playwright project (TypeScript, POM, OOP, ESLint with `eslint-plugin-playwright`, fixtures, locale dictionary).
  - `tests/unit/` and `tests/mobile/` — placeholder folders with README stubs (Go unit tests and Detox mobile tests are added by later specs).
- First two Playwright specs against shipped functionality on `/app`: cookie banner consent flow, landing auth popup open/close/mode-switch.
- Minimal source modifications to `/app/src/components/landing/CookieBanner.tsx` and `LandingPage.tsx` to expose stable `data-testid` attributes for POM selectors. No logic, copy, or styling change.
- TDD pointer block (≤ 5 lines) added to `AGENTS.md` and `CLAUDE.md` referencing `tests/README.md`.
- New constitution sub-principle `Test-First Verification` under principle VII.
- Update `docs_capsule_zero/project/devops/senar-mapping.md` to replace its current "No new GitHub Actions check" stance with the new `test` gate description.
- New row in the SENAR Done Gate of `.github/pull_request_template.md` for TDD evidence.
- Root `package.json`: new `lint:e2e` / `typecheck:e2e` / `test:e2e` / `test:e2e:install` scripts; `preflight` extended to run e2e lint, typecheck, and Playwright.

Out of scope:

- Adding the `test` check to GitHub branch-protection on `main` (admin UI action; documented as follow-up).
- Writing Go unit tests or React Native (Detox) mobile tests — no Go/RN product code exists on this branch yet.
- Migrating tests to `/web` (only happens after `/app` deletion in the iteration following spec-024).
- Modifying any other workflow (`ci.yml`, `pr-guard.yml`, `ai-review.yml`, `claude-*.yml`, `osv-scan.yml`).
- Modifying `AuthPanel.tsx`, `auth/schemas`, server actions, or Supabase wiring.
- Adding the `test` check requirement to grandfathered specs `001-capsule-zero-mvp`, `002-pipeline-hardening`, `003-sprint-0-foundation`.

## User Scenarios & Testing _(mandatory)_

### User Story 1 — `test` gate is required for every PR (Priority: P1)

As the human merge owner, I want a CI check called `test` to run Playwright e2e tests on every PR so that I have automated evidence — not just an AI-written summary — that the app's user-visible behavior still works.

**Why this priority**: this is the entire point of the PR. Without the gate, the rest is documentation.

**Independent Test**: open a new PR after merge and confirm GitHub shows a `test` check that runs the Playwright suite and reports green/red.

**Acceptance Scenarios**:

1. **Given** a PR is opened, **When** GitHub Actions starts, **Then** the `test` job runs and posts a status to the PR Checks tab.
2. **Given** all Playwright specs pass against `/app`, **When** the job finishes, **Then** the `test` check reports success.

### User Story 2 — Cookie banner behavior is locked by e2e tests (Priority: P1)

As any contributor, I want the cookie banner accept-flow and persistence to be covered by an e2e test so that regressions to spec-023 (cookie consent / ePrivacy) are caught automatically.

**Why this priority**: cookie consent is a legal surface; visual regression alone is not enough.

**Independent Test**: run `npm run test:e2e` locally; the `cookie-banner.spec.ts` file passes both its positive and negative scenarios against a freshly built `/app`.

**Acceptance Scenarios**:

1. **Given** a first-time visitor lands on `/en`, **When** the page finishes loading, **Then** the cookie banner is visible.
2. **Given** the cookie banner is visible, **When** the visitor clicks Accept All, **Then** the banner disappears and `localStorage.capsule_zero_cookie_consent` contains a parsed JSON object with a non-empty `decidedAt`.
3. **Given** the visitor accepted cookies, **When** they reload the page in the same browser context, **Then** the banner does not reappear.

### User Story 3 — Auth popup open/close/mode-switch is locked by e2e tests (Priority: P1)

As any contributor, I want the landing-page auth popup to be covered by an e2e test so that regressions to the visible-on-CTA-click contract are caught automatically.

**Why this priority**: the auth popup is the only entry point to sign-in/sign-up from the landing page.

**Independent Test**: run `npm run test:e2e` locally; the `auth-popup.spec.ts` file passes both its positive and negative scenarios.

**Acceptance Scenarios**:

1. **Given** the visitor is on `/en` with cookies handled, **When** they click the auth CTA, **Then** the popup opens with the sign-in form visible and the sign-up form not present in DOM.
2. **Given** the popup is open, **When** the visitor clicks Close, **Then** the popup is removed from DOM.
3. **Given** the popup is open in sign-in mode, **When** the visitor clicks the mode switch, **Then** the sign-up form becomes visible.

### User Story 4 — Test design is uniform and discoverable (Priority: P2)

As any contributor or AI agent writing a new test, I want a single canonical place (`tests/README.md`) that describes TDD workflow, POM rules, and run commands so that all future tests follow the same shape without re-deriving conventions.

**Why this priority**: prevents conventions drift across future specs.

**Independent Test**: open `tests/README.md` after merge; it explains the TDD loop, lists POM/selector rules, shows run commands, and references the existing `tests/e2e/specs/landing/*` specs as examples.

**Acceptance Scenarios**:

1. **Given** a new contributor wants to add a Playwright test, **When** they read `tests/README.md`, **Then** they find the TDD workflow, the rule that selectors live only in `pages/*`, and the lint check that blocks `page.locator()` in specs.

### User Story 5 — TDD is a written rule, not lore (Priority: P2)

As any agent or human writing product code, I want TDD enforcement to be quotable rules in `AGENTS.md`, `CLAUDE.md`, and the constitution so that "I forgot" is not a valid excuse.

**Why this priority**: durable agent instructions must live where agents are guaranteed to read.

**Independent Test**: `git grep -i "tests/README.md" AGENTS.md CLAUDE.md` matches in both files; `.specify/memory/constitution.md` contains a `Test-First Verification` sub-principle.

**Acceptance Scenarios**:

1. **Given** any agent reads `AGENTS.md` or `CLAUDE.md`, **When** they look for testing rules, **Then** they find a pointer to `tests/README.md` and the TDD requirement for specs ≥ 025.

### Edge Cases

- The `/app` build requires environment variables but no real Supabase backend; CI must seed `app/.env.local` with the stub values from `.env.local.example` so `next build` and `next start` succeed without real credentials.
- The cookie banner uses `localStorage`, not cookies; reloading in a fresh Playwright context resets state. Use `page.reload()` inside the same context for the "does not reappear" assertion.
- next-intl routes redirect `/` to `/{locale}`; tests navigate to `/en` directly to avoid timing on the redirect.

## Negative Scenarios _(mandatory — required by SENAR; waive explicitly if none apply)_

1. **Given** a contributor opens a PR that breaks the cookie banner (e.g., never renders it), **When** `test` runs, **Then** the workflow fails with a red `test` check and the PR is not mergeable on policy.
2. **Given** a contributor adds a new spec under `tests/e2e/specs/` that uses raw `page.locator()` or `page.getBy*()` calls, **When** `npm run lint:e2e` or the required `test` job runs, **Then** ESLint reports a `no-restricted-syntax` violation and exits non-zero before Playwright starts.
3. **Given** a contributor opens a PR that touches `app/src/components/landing/CookieBanner.tsx` without re-running tests, **When** the `test` job runs, **Then** the job re-validates the cookie banner spec automatically and reports failure visibly — there is no path that lets the change land without an e2e signal.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: A GitHub Actions workflow at `.github/workflows/test.yml` MUST define a job whose `name` field is exactly `test` and MUST run on every `pull_request`.
- **FR-002**: The `test` job MUST run `tests/e2e/` lint and typecheck, install Playwright browsers, build the `/app` Next.js project, start it on `http://localhost:3000`, and execute the Playwright suite in `tests/e2e/`.
- **FR-003**: `tests/e2e/` MUST be a standalone npm project with its own `package.json` and `package-lock.json`, isolated from `/app` dependencies.
- **FR-004**: All test selectors MUST live in `tests/e2e/pages/*.ts` files using the Page Object Model; specs MUST consume the POM and MUST NOT call `page.locator()` or `page.getBy*` directly. This MUST be enforced by ESLint (`no-restricted-syntax`) in local scripts and in the required `test` job.
- **FR-005**: The cookie-banner spec MUST cover both the accept-flow happy path and the "does not reappear after consent" negative reload scenario.
- **FR-006**: The auth-popup spec MUST cover open, close, and mode-switch, and MUST assert that the sign-up form is not in DOM until the user switches mode.
- **FR-007**: `tests/README.md` MUST describe (a) the TDD loop, (b) the POM/lint rule, (c) the locale-neutral assertion approach, (d) how to run tests locally and in CI.
- **FR-008**: `AGENTS.md` and `CLAUDE.md` MUST each contain a short block (≤ 5 lines) pointing at `tests/README.md` as the canonical test docs.
- **FR-009**: `.specify/memory/constitution.md` principle VII MUST gain a sub-principle `Test-First Verification` codifying TDD as the standard for specs ≥ 025.
- **FR-010**: `docs_capsule_zero/project/devops/senar-mapping.md` MUST reflect that `test` is a new required CI check (replacing the prior "No new GitHub Actions check" stance for SENAR verification).
- **FR-011**: `.github/pull_request_template.md` SENAR Done Gate MUST include a row requiring a link to the failing-then-passing test commit (or an explicit waiver line).
- **FR-012**: Root `package.json` MUST expose `lint:e2e`, `typecheck:e2e`, `test:e2e`, and `test:e2e:install` scripts and extend `preflight` to run e2e lint, typecheck, and Playwright.
- **FR-013**: The `data-testid` additions in `/app` MUST NOT change rendered output, classnames, accessibility attributes, or component props — only test attributes are added.

### Key Entities

- **`test` job**: GitHub Actions job that owns the e2e gate. Inputs: PR head SHA, Ubuntu runner, Node 20, Playwright cache. Outputs: green/red check, `playwright-report/` artifact on failure.
- **Page Object**: TypeScript class in `tests/e2e/pages/` that exposes named Locators for one logical UI surface and subclasses `BasePage`.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: After merge, every new PR shows `test` in its Checks tab and the job runs to completion.
- **SC-002**: Locally and in CI, `npm run lint:e2e`, `npm run typecheck:e2e`, and `npm run test:e2e` exit 0 with two spec files passing all `test()` cases (each spec covers at least one negative scenario).
- **SC-003**: `grep -RnE "page\.(locator|getBy)" tests/e2e/specs/` returns zero matches; the same grep in `tests/e2e/pages/` returns multiple matches.
- **SC-004**: `tests/README.md`, `AGENTS.md`, `CLAUDE.md`, `.specify/memory/constitution.md`, `docs_capsule_zero/project/devops/senar-mapping.md`, and `.github/pull_request_template.md` all contain the new content per FR-007 through FR-011.
- **SC-005**: The PR's diff under `/app` contains only `data-testid` additions; `git diff --stat origin/main...HEAD -- app/` shows a small line count and no new imports, props, or logic.
