# Implementation Plan: E2E Tests + TDD Doctrine + `test` Gate

**Branch**: `feat/025-e2e-tests` | **Date**: 2026-06-29 | **Spec**: `.specify/specs/025-e2e-tests/spec.md`

## Summary

Stand up a Playwright e2e harness under `tests/e2e/` (POM, OOP, ESLint with `eslint-plugin-playwright`), add two specs against shipped `/app` functionality (cookie banner + auth popup), gate every PR on a new `test` GitHub job, and codify TDD as the standard going forward in `AGENTS.md` / `CLAUDE.md` / `constitution.md` / `tests/README.md`.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20
**Primary Dependencies**: `@playwright/test` ^1.51, `eslint-plugin-playwright` ^2.x, `typescript-eslint` ^8.x, `@eslint/js` ^9.x
**Storage**: none
**Testing**: Playwright (e2e)
**Target Platform**: Ubuntu CI runner; projects `chromium` (desktop) + `webkit` (iPhone emulation)
**Project Type**: standalone npm project under `tests/e2e/`, isolated from `/app`
**Performance Goals**: total `test` job runtime under 5 min on a fresh runner
**Constraints**: must not modify the legacy `/app` beyond `data-testid` additions; must not touch other workflows; must not require real third-party credentials
**Scale/Scope**: 2 specs / ~7 test cases initially; folder structure ready for spec-026+

**Touched paths**:

- New: `.specify/specs/025-e2e-tests/{spec,plan,tasks}.md`
- New: `tests/README.md`, `tests/e2e/**`, `tests/unit/{README.md,.gitkeep}`, `tests/mobile/{README.md,.gitkeep}`
- New: `.github/workflows/test.yml`
- Modified: `app/src/components/landing/CookieBanner.tsx`, `app/src/components/landing/LandingPage.tsx` (data-testid only)
- Modified: `AGENTS.md`, `CLAUDE.md`, `.specify/memory/constitution.md`, `docs_capsule_zero/project/devops/senar-mapping.md`, `.github/pull_request_template.md`, `package.json`

**Untouched (explicit)**: `.github/workflows/{ci,pr-guard,ai-review,claude-agent,claude-review,ai-command-policy,osv-scan}.yml`, `scripts/`, `api/`, `mobile/`, `worker/`, `web/`, `infra/`, `supabase/`, `html-prototypes/`.

## Scope Boundaries

- **In scope**: Playwright harness, two specs, `test` workflow, doc/policy updates, minimal `data-testid` additions in `/app`.
- **Out of scope**: branch-protection admin step (follow-up), Go/RN tests (later specs), migration to `/web` (post spec-024), retrofitting grandfathered specs.

## Constitution Check

- **Spec-First Development**: this PR carries `.specify/specs/025-e2e-tests/{spec,plan,tasks}.md`.
- **Supervised Verification**: SC-002 binds the test outcome to runnable commands (`npm run lint:e2e`, `npm run typecheck:e2e`, `npm run test:e2e`) and the green `test` check.
- **Process Memory**: `tasks.md` records TDD-loop decisions, dead ends, and the data-testid trade-off before completion.
- **Test-First Bias**: this PR establishes the bias; the test commits land before the `/app` changes.
- **Simplicity**: one new workspace (`tests/e2e/`), one new workflow, minimal `/app` change.
- **Engineering Reuse Rule**: POM (`BasePage`, `LandingPage`, `AuthPopup`) is the reuse unit for future specs.

## Verification _(mandatory — required by SENAR)_

| Acceptance criterion | Evidence                                                                                                                                                                                |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| US1 / FR-001         | `.github/workflows/test.yml` exists with `jobs.test.name: test`; PR Checks tab shows a green `test` status on the head SHA of this PR.                                                  |
| US1 / FR-002         | Workflow steps show install → build → Playwright; CI logs show all spec files run; `playwright-report/` artifact attached on failure (`if: always()`).                                  |
| US2 / FR-005         | `tests/e2e/specs/landing/cookie-banner.spec.ts` contains two `test()` cases — accept + reload — both green in CI.                                                                       |
| US3 / FR-006         | `tests/e2e/specs/landing/auth-popup.spec.ts` contains three `test()` cases — open/close/switch — all green in CI; sign-up form is asserted absent before mode switch.                   |
| US4 / FR-007         | `tests/README.md` exists with sections "TDD loop", "POM rules", "Running tests", "Layers".                                                                                              |
| US5 / FR-008         | `git grep "tests/README.md" AGENTS.md CLAUDE.md` returns matches in both files.                                                                                                         |
| US5 / FR-009         | `.specify/memory/constitution.md` contains a `### Test-First Verification` heading inside section VII.                                                                                  |
| FR-003               | `tests/e2e/package.json` and `tests/e2e/package-lock.json` exist; `/app/package.json` is unchanged on the test-tooling dimension (no Playwright entry added).                           |
| FR-004 / SC-003      | `npm run lint:e2e` exits 0; `.github/workflows/test.yml` runs `npm run lint:e2e` before Playwright; `tests/e2e/eslint.config.mjs` declares `no-restricted-syntax` for `page.locator`/`page.getBy` calls in `specs/**`. |
| FR-010               | `docs_capsule_zero/project/devops/senar-mapping.md` no longer contains "No new GitHub Actions check" verbatim; it lists `test` as a required check.                                     |
| FR-011               | `.github/pull_request_template.md` SENAR Done Gate contains a new row mentioning TDD evidence.                                                                                          |
| FR-012               | `package.json` (root) contains `lint:e2e`, `typecheck:e2e`, `test:e2e`, and `test:e2e:install` scripts; `preflight` invokes e2e lint, typecheck, and Playwright.                         |
| FR-013 / SC-005      | `git diff --stat origin/main...HEAD -- app/` shows only `data-testid` additions (small line count, no new imports, no logic).                                                           |
| SC-001               | Reproducible after merge by opening any new PR.                                                                                                                                         |
| SC-002               | Local `npm run lint:e2e`, `npm run typecheck:e2e`, and `npm run test:e2e` exit 0; CI run on this PR is green.                                                                            |

Negative scenario evidence:

- A purposefully-broken cookie banner (commented-out render) was confirmed to fail the spec locally before reverting — captured in `tasks.md` Process Memory.
- A sample `page.locator('xyz')` line was added to a spec to confirm the `no-restricted-syntax` ESLint rule fires through `npm run lint:e2e`, then removed — captured in `tasks.md` Process Memory.

## Project Structure

```text
.specify/specs/025-e2e-tests/
├── spec.md
├── plan.md
└── tasks.md

tests/
├── README.md
├── e2e/
│   ├── package.json
│   ├── package-lock.json
│   ├── playwright.config.ts
│   ├── tsconfig.json
│   ├── eslint.config.mjs
│   ├── .gitignore
│   ├── fixtures/
│   │   ├── base.ts
│   │   └── locales.ts
│   ├── pages/
│   │   ├── BasePage.ts
│   │   ├── LandingPage.ts
│   │   └── AuthPopup.ts
│   └── specs/
│       └── landing/
│           ├── cookie-banner.spec.ts
│           └── auth-popup.spec.ts
├── unit/
│   ├── .gitkeep
│   └── README.md
└── mobile/
    ├── .gitkeep
    └── README.md

.github/workflows/test.yml         # NEW required check: `test`
```

**Structure Decision**: top-level `tests/` workspace with one folder per testing surface (e2e / unit / mobile). `/app` is the current target of e2e; the same POM classes will retarget to `/web` after spec-024 lands.

## Complexity Tracking

No new abstraction in `/app`. In `tests/`, POM is the only abstraction — required by FR-004 and aligned with AGENTS.md "Engineering Reuse Rule".

## Risks

- **Risk**: `npm run build` in `/app` requires env vars from `.env.local.example`. **Mitigation**: workflow copies `app/.env.local.example` to `app/.env.local` before build; stub values suffice because the cookie-banner and auth-popup tests do not exercise server actions or Supabase.
- **Risk**: Adding the `test` check as required on `main` is an admin UI action. **Mitigation**: documented in `tasks.md` Known Issues and called out in the PR description as a post-merge follow-up.
- **Risk**: Tests bound to `/app` will break when `/app` is deleted. **Mitigation**: POM isolates selectors; only `playwright.config.ts` `webServer` and `LandingPage.path` need to change to retarget to `/web`. Documented in `tests/README.md`.
- **Risk**: First-time Playwright browser install is slow. **Mitigation**: cache `~/.cache/ms-playwright` by hash of `tests/e2e/package-lock.json`.
