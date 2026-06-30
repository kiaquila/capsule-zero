# Implementation Plan: Legal Footer Links

**Branch**: `fix/legal-footer-links` | **Date**: 2026-06-30 | **Spec**: `.specify/specs/028-legal-footer-links/spec.md`

## Summary

Wire existing legal document pages back into the user-visible landing and auth surfaces by replacing dead `#terms` / `#privacy` anchors with the repository's locale-aware `next-intl` navigation links. Preserve the small bugfix scope and add focused Playwright coverage for the regression.

## Technical Context

**Language/Version**: TypeScript, React, Next.js App Router legacy `/app`
**Primary Dependencies**: `next-intl` navigation helper, Playwright e2e tests
**Storage**: none
**Testing**: Playwright e2e lint/typecheck/spec, app lint/typecheck, feature-memory guard
**Target Platform**: localized web app at `/en` and `/ru`
**Project Type**: legacy Next.js `/app` UI bugfix
**Constraints**: glass UI and legal-page styling unchanged; EN/RU active locale scope only; ES-AR remains deferred
**Scale/Scope**: landing/auth link replacement plus POM-backed e2e regression coverage

**Touched paths**:

- Modified: `app/src/components/landing/LandingPage.tsx`
- Modified: `app/src/components/auth/AuthPage.tsx`
- Modified: `app/src/components/auth/AuthPanel.tsx`
- Modified: `app/src/components/legal/LegalPage.tsx`
- Modified: `tests/e2e/pages/LandingPage.ts`
- Added: `tests/e2e/pages/LegalPage.ts`
- Added: `tests/e2e/specs/landing/legal-links.spec.ts`
- Added: `.specify/specs/028-legal-footer-links/{spec,plan,tasks}.md`

## Scope Boundaries

- **In scope**: navigation target repair, stable test IDs, POM updates, e2e regression tests, feature memory.
- **Out of scope**: legal content edits, visual redesign, RU legal-content translation, cookie settings behavior, new routes, backend/API/mobile changes.

## Constitution Check

- **Spec-First Development**: this feature-memory package documents the bugfix scope required by the product-root guard.
- **Supervised Verification**: verification rows below bind each acceptance criterion to commands or source checks.
- **Process Memory**: `tasks.md` records the original guard failure, branch freshness work, and known content-localization follow-up.
- **Test-First Verification**: satisfied by the existing PR commit order: `bdf32b0 test(legal): cover policy links open from landing footer and return home` precedes `ae5ceaa fix(legal): wire footer/consent links to static policy pages`.
- **Engineering Reuse Rule**: uses the existing `@/i18n/navigation` `Link`, existing legal routes, and POM pattern instead of new routing or selector helpers.

## Verification _(mandatory - required by SENAR)_

| Acceptance criterion | Evidence |
| -------------------- | -------- |
| FR-001 / FR-002 | `tests/e2e/specs/landing/legal-links.spec.ts` clicks `footerTermsLink` and `footerPrivacyLink` from `/en` and asserts `/en/terms-of-use` and `/en/privacy-policy`. |
| FR-003 / FR-004 | Source inspection: `app/src/components/auth/AuthPage.tsx` and `app/src/components/auth/AuthPanel.tsx` import `Link` from `@/i18n/navigation` and target `/terms-of-use` / `/privacy-policy`. |
| FR-005 | Source inspection: `app/src/components/legal/LegalPage.tsx` exposes `data-testid="legal-page"` and `data-testid="legal-back-home"`; `tests/e2e/pages/LegalPage.ts` consumes them. |
| FR-006 / SC-003 | `npm --prefix tests/e2e run test -- specs/landing/legal-links.spec.ts` covers Terms navigation, Privacy navigation, Back-to-home behavior, and the `#terms` negative scenario. |
| FR-007 | Source inspection: all new route links use `@/i18n/navigation` and no ES-AR route, enum, or switcher entry is introduced. |
| FR-008 / SC-005 | `node scripts/check-feature-memory.mjs origin/main HEAD` passes via `.specify/specs/028-legal-footer-links/{spec,plan,tasks}.md`. |
| SC-001 | `npm --prefix tests/e2e run lint`. |
| SC-002 | `npm --prefix tests/e2e run typecheck`. |
| SC-004 | `npm --prefix app run lint` and `npm --prefix app run typecheck`. |
| SC-006 | `gh pr checks 55 --repo kiaquila/capsule-zero` after pushing the final head SHA. |

Negative scenario evidence:

- `tests/e2e/specs/landing/legal-links.spec.ts` asserts the Terms footer link does not leave the URL at `#terms`.
- `rg '#terms|#privacy' app/src/components/landing app/src/components/auth` verifies the repaired surfaces no longer contain dead legal anchors.

## Project Structure

```text
.specify/specs/028-legal-footer-links/
├── spec.md
├── plan.md
└── tasks.md

app/src/components/
├── auth/
│   ├── AuthPage.tsx
│   └── AuthPanel.tsx
├── landing/
│   └── LandingPage.tsx
└── legal/
    └── LegalPage.tsx

tests/e2e/
├── pages/
│   ├── LandingPage.ts
│   └── LegalPage.ts
└── specs/landing/
    └── legal-links.spec.ts
```

## Complexity Tracking

No new runtime abstraction is introduced. The change reuses the existing `Link` helper and existing legal pages, then extends the existing Playwright Page Object pattern.

## Risks

- **Risk**: RU legal routes open but render the existing English legal content. **Mitigation**: documented as out of scope and tracked as a separate content-localization follow-up, because this PR repairs reachability only.
- **Risk**: Adding test IDs could be overused as product API. **Mitigation**: limited to stable navigation points already required by the repo's POM selector rules.
