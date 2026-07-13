# Tasks: Legal Footer Links

**Input**: `.specify/specs/028-legal-footer-links/spec.md`, `plan.md`

## Phase 1: Regression Test

- [x] T001 Add landing POM accessors for footer Terms and Privacy links.
- [x] T002 Add a legal page POM for static Terms and Privacy pages.
- [x] T003 Add Playwright coverage for footer Terms navigation, footer Privacy navigation, Back-to-home behavior, and the `#terms` regression.
- [x] T004 Keep the test commit before the implementation commit for the spec >= 025 TDD history requirement.

## Phase 2: Implementation

- [x] T005 Replace landing footer `#terms` and `#privacy` anchors with locale-aware `/terms-of-use` and `/privacy-policy` links.
- [x] T006 Replace standalone auth footer `#terms` and `#privacy` anchors with the same locale-aware legal links.
- [x] T007 Replace auth consent-note dead anchors with the same legal links.
- [x] T008 Add stable `data-testid` hooks to the legal page root and Back-to-home link for POM-backed tests.

## Phase 3: Feature Memory

- [x] T009 Inspect the failed `guard` check and confirm it requires complete feature memory for `app/` product-root changes.
- [x] T010 Rebase the PR branch onto fresh `origin/main`.
- [x] T011 Add `.specify/specs/028-legal-footer-links/spec.md`.
- [x] T012 Add `.specify/specs/028-legal-footer-links/plan.md`.
- [x] T013 Add `.specify/specs/028-legal-footer-links/tasks.md`.
- [x] T014 Record the legal-content RU localization follow-up as out of scope.

## Phase 4: Verification

- [x] T015 Run `npm --prefix tests/e2e run lint`.
- [x] T016 Run `npm --prefix tests/e2e run typecheck`.
- [x] T017 Run `npm --prefix tests/e2e run test -- specs/landing/legal-links.spec.ts`.
- [x] T018 Run `npm --prefix app run lint`.
- [x] T019 Run `npm --prefix app run typecheck`.
- [x] T020 Run `rg '#terms|#privacy' app/src/components/landing app/src/components/auth`.
- [x] T021 Run `node scripts/check-feature-memory.mjs origin/main HEAD`.
- [ ] T022 Push the rebased branch and feature-memory commit to `fix/legal-footer-links`.
- [ ] T023 Update PR #55 body so the SENAR Done Gate references `.specify/specs/028-legal-footer-links/`.
- [ ] T024 Recheck PR #55 until `baseline-checks`, `guard`, `AI Review`, and `test` are green; also confirm the non-required `osv-scan` signal.

## Process Memory _(mandatory - required by SENAR; written before declaring work complete)_

### Dead Ends

- The original PR body treated this as a small legacy `/app` bugfix with no spec folder. That captured the practical scope, but the repository `guard` workflow still requires complete feature memory whenever product roots under `app/` change.
- The dead `#terms` and `#privacy` anchors were not a missing-page issue. The static legal routes already existed; only the entry-point links were stale.

### Decisions

- **Feature folder is `028-legal-footer-links`**. Reason: `origin/main` already contains `027-cz-favicon-assets`, and this PR needs its own complete feature-memory folder in the PR diff.
- **Use `@/i18n/navigation` `Link`**. Reason: it preserves the existing `next-intl` locale-prefix behavior without adding routing special cases.
- **Test at the landing footer level**. Reason: landing is the primary broken public entry point and exercises the user-visible regression end to end.
- **Use test IDs only for stable navigation controls**. Reason: the e2e suite requires POM-mediated selectors, and legal-link text is locale-sensitive.

### Known Issues

- The legal document content remains English-only on `/ru` routes. This is inherited from the existing legal pages and is out of scope for this reachability bugfix.
- Mobile app legal-link entry points are out of scope because this PR only touches the legacy Next.js `/app` web shell.
