# Implementation Plan: Legal Documents Pages

**Branch**: `codex/legal-documents-layout` | **Date**: 2026-06-24 | **Spec**: `.specify/specs/022-legal-documents-pages/spec.md`
**Input**: Feature specification from `.specify/specs/022-legal-documents-pages/spec.md`

## Summary

Add embedded Terms of Use and Privacy Policy pages to the localized Next.js app, backed by structured legal content and a shared legal renderer. Apply the requested redesign by removing separate intro/highlight blocks and combining the title, metadata, and contents list into one native glass block.

## Technical Context

**Language/Version**: TypeScript, React, Next.js App Router
**Primary Dependencies**: Next.js App Router, next-intl, existing Capsule Zero global CSS tokens
**Storage**: None changed
**Testing**: ESLint, TypeScript, Next build, browser DOM/layout spot checks, GitHub guard
**Target Platform**: Localized responsive web app
**Project Type**: Next.js web application
**Performance Goals**: Static legal pages with no runtime provider calls
**Constraints**: Glassmorphism UI, achromatic interface, EN/RU route scope only for MVP v1, structured reusable content over copied markup
**Scale/Scope**: Two localized routes, one shared renderer, one structured legal content module, and legal CSS

## Constitution Check

- Glassmorphism UI: PASS; legal pages use the existing `dashboard-glass` surface language and translucent controls.
- Achromatic interface: PASS; no new color accents were introduced.
- Direct, Not Dictate: PASS; legal copy frames AI/methodology recommendations as suggestions and preserves user responsibility.
- Premium quality bar: PASS; layout is native to the site and avoids separate static-document presentation.
- Three upload methods: N/A; no upload flow changed.
- Engineering reuse: PASS; both legal documents use the same renderer and structured content model.

## Verification _(mandatory — required by SENAR)_

| Acceptance criterion | Evidence |
| --- | --- |
| US1-AC1 Terms renders inside app layout | Browser verification on `http://127.0.0.1:3001/en/terms-of-use` confirmed the legal page renders with Capsule Zero chrome and shared legal renderer. |
| US1-AC2 Terms title/meta/contents share one block | DOM verification confirmed one `.legal-index` block and zero `.legal-hero` nodes on `/en/terms-of-use`. |
| US1-AC3 Terms covers commercial/legal edge cases | Source evidence: `app/src/lib/legal-content.ts` includes Terms sections for content, AI output, marketplace links, coins, refunds, acceptable use, suspension, disclaimers, liability, platform terms, changes, and governing-law placeholders. |
| US2-AC1 Privacy renders inside app layout | Browser verification on `http://127.0.0.1:3001/en/privacy-policy` confirmed the legal page renders with Capsule Zero chrome and shared legal renderer. |
| US2-AC2 Privacy title/meta/contents share one block | DOM verification confirmed one `.legal-index` block and zero `.legal-hero` nodes on `/en/privacy-policy`. |
| US2-AC3 Privacy covers data-handling edge cases | Source evidence: `app/src/lib/legal-content.ts` includes Privacy sections for controller/contact, data categories, purposes, legal bases, photos/AI processing, payments, sharing, transfers, retention, user rights, deletion, children, cookies, security, and changes. |
| Negative scenario 1 removed blocks stay absent | Browser DOM checks confirmed `heroCount: 0` and `highlightsCount: 0` for Terms and Privacy pages. |
| Negative scenario 2 no page-level horizontal overflow | Browser layout checks confirmed `document.documentElement.scrollWidth === clientWidth` for Terms and Privacy pages in the tested viewport. |
| Negative scenario 3 localized static route generation remains valid | `npm run build` passed and generated `/en/privacy-policy`, `/ru/privacy-policy`, `/en/terms-of-use`, and `/ru/terms-of-use` as SSG routes. |
| FR-001 through FR-008 implementation coverage | Source evidence: `app/src/app/[locale]/*`, `app/src/components/legal/LegalPage.tsx`, `app/src/lib/legal-content.ts`, and `app/src/app/globals.css`. |
| SC-001 local checks | `npm ci` passed; `npm run lint` passed; `npm run typecheck` passed; `npm run build` passed. |
| SC-005 GitHub guard | Initial PR guard failed because feature memory was missing; this `022-legal-documents-pages` package was added and pushed to satisfy the guard. |

## Project Structure

### Documentation (this feature)

```text
.specify/specs/022-legal-documents-pages/
├── spec.md
├── plan.md
└── tasks.md
```

### Source Code (repository root)

```text
app/src/app/[locale]/privacy-policy/page.tsx
app/src/app/[locale]/terms-of-use/page.tsx
app/src/app/globals.css
app/src/components/legal/LegalPage.tsx
app/src/lib/legal-content.ts
```

**Structure Decision**: Keep legal copy as structured TypeScript data and render it through one shared component, so future translations or policy revisions can update content without duplicating page markup.

## Complexity Tracking

No constitution violations identified before implementation.
