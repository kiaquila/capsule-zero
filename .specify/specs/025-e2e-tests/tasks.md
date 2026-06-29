# Tasks: E2E Tests + TDD Doctrine + `test` Gate

**Input**: `.specify/specs/025-e2e-tests/spec.md`, `plan.md`

## Phase 1: Setup

- [ ] T001 Confirm branch `feat/025-e2e-tests` is rooted at `origin/main` and the active feature folder is `.specify/specs/025-e2e-tests/`.
- [ ] T002 Read `/app/src/components/landing/{CookieBanner,LandingPage}.tsx`, `auth/AuthPanel.tsx`, `lib/cookie-consent.ts`, and the EN/RU `messages/*.json` for selector and locale ground truth.

## Phase 2: Tests-folder scaffolding

- [ ] T003 [P] Create `tests/README.md` with TDD loop, POM rules, run commands, layers map.
- [ ] T004 [P] Create `tests/e2e/package.json`, `tsconfig.json`, `.gitignore`.
- [ ] T005 [P] Create `tests/e2e/playwright.config.ts` with `webServer` against `/app`, projects chromium + webkit (iPhone emulation).
- [ ] T006 [P] Create `tests/e2e/eslint.config.mjs` with `eslint-plugin-playwright` and `no-restricted-syntax` for `page.locator`/`page.getBy*` calls in `specs/**`.
- [ ] T007 [P] Create `tests/e2e/fixtures/{base,locales}.ts`.
- [ ] T008 [P] Create `tests/e2e/pages/{BasePage,LandingPage,AuthPopup}.ts`.
- [ ] T009 [P] Create `tests/unit/{README.md,.gitkeep}` and `tests/mobile/{README.md,.gitkeep}`.

## Phase 3: First specs (TDD — written BEFORE the `/app` changes that make them pass)

- [ ] T010 [US2] Create `tests/e2e/specs/landing/cookie-banner.spec.ts` referencing `data-testid` selectors that do NOT yet exist on `/app`. Commit at this point with the tests RED.
- [ ] T011 [US3] Create `tests/e2e/specs/landing/auth-popup.spec.ts` referencing `data-testid` selectors that do NOT yet exist on `/app`. Commit at this point with the tests RED.

## Phase 4: Implementation (turn tests GREEN)

- [ ] T012 [US2] Add `data-testid="cookie-banner"`, `data-testid="cookie-accept-all"`, `data-testid="cookie-reject-all"` to `app/src/components/landing/CookieBanner.tsx`. No other change.
- [ ] T013 [US3] Add `data-testid="auth-trigger"` and `data-testid="auth-popover"` to `app/src/components/landing/LandingPage.tsx`. No other change.
- [ ] T014 Run `npm run test:e2e` locally; confirm both specs are GREEN.

## Phase 5: CI gate

- [ ] T015 [US1] Create `.github/workflows/test.yml` with job name `test`; install deps, run e2e lint/typecheck, build /app, run Playwright via `webServer`.
- [ ] T016 Push branch and confirm `test` check appears and goes green on the PR.

## Phase 6: Doctrine and policy

- [ ] T017 [US4] Update `AGENTS.md` with the short tests pointer block.
- [ ] T018 [US5] Update `CLAUDE.md` with the matching tests pointer block.
- [ ] T019 [US5] Update `.specify/memory/constitution.md` principle VII with a `Test-First Verification` sub-principle. Bump Last Amended date.
- [ ] T020 Update `docs_capsule_zero/project/devops/senar-mapping.md`: replace "No new GitHub Actions check" stance with the `test` gate description.
- [ ] T021 Update `.github/pull_request_template.md` SENAR Done Gate with a TDD evidence row.
- [ ] T022 Update root `package.json` with `lint:e2e`, `typecheck:e2e`, `test:e2e`, `test:e2e:install`, and extend `preflight`.

## Phase 7: Verification

- [ ] T023 Run `npm run lint && npm run typecheck && npm run lint:e2e && npm run typecheck:e2e && npm run build` — confirm clean.
- [ ] T024 Run `npm run test:e2e` locally — confirm GREEN.
- [ ] T025 Confirm `grep -RnE "page\.(locator|getBy)" tests/e2e/specs/` returns empty.
- [ ] T026 Open PR; fill SENAR Done Gate including the new TDD row; request `@codex review`.

## Process Memory _(mandatory — required by SENAR; written before declaring work complete)_

### Dead Ends

- Considered targeting the static HTML prototypes (`html-prototypes/index.html`) as the e2e baseURL. Rejected on user direction (2026-06-29): tests should run against the actual Next.js app under `/app` so TDD muscles form on real React components, even though `/app` is slated for removal after spec-024 ships. POM isolates selectors so retargeting to `/web` will be mechanical.
- Considered relying purely on existing CSS class names (`.cookie-banner`, `.landing-auth-button`) for selectors. Rejected because (a) class names are also style hooks and may churn, and (b) the user asked for OOP/POM best practice — `data-testid` is the canonical Playwright recommendation. Trade-off documented as a Decision below.
- Considered enforcing TDD purely as a doctrine in `AGENTS.md` without a CI check. Rejected because the user explicitly asked for a mandatory `test` gate; a doctrine without enforcement decays.
- Considered making the TDD doctrine block in `AGENTS.md` and `CLAUDE.md` long and self-contained. Rejected on user direction: the two files only host short pointers to `tests/README.md`; full TDD doctrine and POM rules live in `tests/README.md` to avoid duplication.
- Considered installing Playwright into `/app/package.json` so it lives next to the app it tests. Rejected because `/app` is scheduled for removal after spec-024 — coupling test tooling to a directory that disappears would leave the gate orphaned. Standalone `tests/e2e/` survives the pivot.
- Considered leaving e2e ESLint as a documented local command only. Rejected after Codex review on PR #52: the POM rule must run inside the required `test` gate before Playwright, otherwise raw `page.locator()` calls in specs could merge.

### Decisions

- **Job name = `test`** (not `senar-e2e`, not `e2e-gate`). Reason: user direction (2026-06-29) — the GitHub check is the short, conventional name any contributor recognizes. The "this is the SENAR automated verification" semantics live in `senar-mapping.md` instead of the check name.
- **TDD shown in git history**: tests committed first against not-yet-existing `data-testid`s (Phase 3), `/app` updated second (Phase 4). Reason: dogfood the TDD loop the PR is establishing.
- **Two `data-testid` additions to `/app`, no logic change**. Reason: keeps the `/app` diff trivially reviewable and survives the eventual `/app` → `/web` retarget — when the test attrs are added to the new React components, the same POM works without spec edits.
- **POM enforced by ESLint, not just docs**. Reason: rules people can violate without immediate feedback decay; `no-restricted-syntax` makes the violation a visible lint failure in CI.
- **`test` gate runs e2e lint and typecheck before Playwright**. Reason: the gate owns merge readiness for tests; syntax, POM, and type errors should fail before browser work starts.
- **chromium + webkit projects only**. Reason: covers desktop + iPhone-like rendering. Firefox is skipped for first iteration to keep job runtime under 5 min; can be added later by appending a project entry.
- **No branch-protection update in this PR**. Reason: admin UI action; documented as Known Issue with explicit owner expectation in the PR description.
- **Playwright `webServer` over manual background-start**. Reason: Playwright manages port detection, readiness, and process lifecycle; one fewer step to write and one fewer race condition to debug in CI.

### Known Issues

- The `test` check is created by this PR but is NOT yet listed in `main`'s required status checks. Until the merge owner adds it under GitHub Settings → Branches → main → Required checks, the gate exists but does not block merges. Acknowledged in the PR description.
- The Playwright suite runs against `/app`, which is scheduled for removal after `.specify/specs/024-production-stack-runtime/`. When `/web` replaces `/app`, the POM classes carry over but `playwright.config.ts` `webServer.command` and `LandingPage.path` will need to retarget. Documented in `tests/README.md` and in spec-024's follow-up list.
- `/app` build in CI relies on stub values for Supabase / Photoroom / Lava env vars (copied from `.env.local.example`). The current cookie-banner and auth-popup tests do not exercise server actions, so the stubs are sufficient. If a future spec adds tests that hit server actions, the workflow will need real test-only credentials or a mock layer — out of scope here.
- Only chromium + webkit projects run in CI. Firefox is not covered; if a Firefox-only regression ships, this gate misses it. Accepted trade-off until job-runtime budget changes.
- Detox setup for `tests/mobile/` and `go test` setup for `tests/unit/` are stubs only; first real tests in those folders will arrive with the spec that introduces real RN or Go product code.
