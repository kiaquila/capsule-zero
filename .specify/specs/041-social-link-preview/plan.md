# Implementation Plan: Social Link Preview

**Branch**: `codex/telegram-link-preview` | **Date**: 2026-07-14 | **Spec**: `.specify/specs/041-social-link-preview/spec.md`

## Summary

Capture the production English landing page at the standard 1200x630 Open Graph aspect ratio, serve it as a static app asset, and consolidate the duplicated layout metadata into one shared Next.js metadata contract with Open Graph and Twitter large-image fields.

## Technical Context

**Language/Version**: TypeScript 5, Next.js 16.2.6 App Router  
**Primary Dependencies**: Next.js Metadata API, Playwright 1.51  
**Storage**: static PNG under `app/public/`  
**Testing**: Playwright e2e metadata scenario, Next.js build, asset inspection  
**Target Platform**: Telegram and standards-compatible Open Graph/Twitter crawlers  
**Project Type**: web application  
**Performance Goals**: one cacheable static image below the Next.js/Open Graph size ceiling  
**Constraints**: 1200x630 screenshot, absolute production URL, no landing UI change, no new dependency  
**Scale/Scope**: one shared metadata module, two layout imports, one static image, one e2e scenario

## Scope Boundaries

- **In scope**: screenshot capture, shared metadata, Open Graph/Twitter tags, e2e coverage, frontend docs, SENAR memory.
- **Out of scope**: Telegram post mutation, cache refresh, landing redesign, analytics/query parameters.

## Constitution Check

- **Premium screenshot test**: the asset is a direct capture of the approved achromatic landing page at the social-card aspect ratio.
- **Engineering Reuse Rule**: the existing layout metadata definitions were checked; they duplicate the same responsibility, so this change consolidates them into one shared contract rather than adding a third copy.
- **Spec-first / SENAR**: this feature memory names goal, scope, acceptance evidence, negative scenarios, and process memory.
- **Test-first verification**: the Playwright metadata scenario is committed failing before the metadata and image implementation.
- **No Supabase recoupling**: no provider, runtime, API, or environment contract changes.
- **Docs as source of truth**: frontend docs gain the canonical social-preview asset and metadata rules.

## Verification _(mandatory - required by SENAR)_

| Acceptance criterion     | Evidence                                                                                                                                                                   |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-001 / FR-002 / SC-002 | `npm --prefix tests/e2e run test -- specs/landing/social-preview.spec.ts` passed in Chromium and WebKit; it asserts the absolute Open Graph URL, dimensions, and alt text. |
| FR-003 / SC-002          | The same Playwright scenario asserts `summary_large_image` and the matching absolute Twitter image URL.                                                                    |
| FR-004 / SC-006          | Visual inspection of `app/public/social/capsule-zero-homepage.png`, refreshed from the spec-044 production build at 1200x630 with consent pre-seeded and reduced motion.   |
| FR-005                   | `rg -n "siteMetadata" 'app/src/app/(redirect)/layout.tsx' 'app/src/app/[locale]/layout.tsx'` shows both layouts importing the shared contract.                             |
| FR-006 / SC-004          | The Playwright scenario requests the local image path and asserts HTTP 200 plus `image/png`.                                                                               |
| FR-007                   | `git diff origin/main...HEAD -- app/src/components/landing app/src/app/globals.css messages` is empty.                                                                     |
| FR-008                   | PR history shows a failing-test commit before the implementation commit.                                                                                                   |
| SC-001                   | The focused scenario passed: 2 tests across Chromium and WebKit iPhone.                                                                                                    |
| SC-003                   | `sips -g pixelWidth -g pixelHeight -g format -g hasAlpha app/public/social/capsule-zero-homepage.png` reports PNG, 1200x630, no alpha; `ls -lh` reports 429 KB; SHA-256 is `7dec0fb0ee8e660806518e9d25ee1769ad2f7954af7e888cd4c83c79da566418`. |
| SC-005                   | Local `npm run preflight` passed (36 Playwright tests passed, 8 full-stack tests skipped as configured); required GitHub checks remain PR evidence.                        |

Negative scenario evidence:

- The Playwright scenario rejects missing, relative, or localhost image metadata and rejects a non-image static response.
- The committed PNG is visually inspected to confirm temporary overlays and browser chrome are absent.

## Project Structure

```text
.specify/specs/041-social-link-preview/
├── spec.md
├── plan.md
└── tasks.md

app/
├── public/social/capsule-zero-homepage.png
└── src/
    ├── app/(redirect)/layout.tsx
    ├── app/[locale]/layout.tsx
    └── lib/site-metadata.ts

tests/e2e/
├── pages/LandingPage.ts
└── specs/landing/social-preview.spec.ts
```

## Complexity Tracking

No constitution violation. The new shared module removes the existing duplicated metadata responsibility and stays well below the TypeScript module-size guidance.

## Risks

- **Telegram may retain an older cached card after deployment.** Mitigation: update the existing post only after production metadata is live, using a full HTTPS URL and a cache-busting query only if the client keeps the stale card.
- **The screenshot can become stale after a landing redesign.** Mitigation: frontend docs identify the asset as a deliberate homepage capture that must be refreshed when the hero materially changes.
- **Absolute production metadata is rendered during local tests.** Mitigation: the e2e scenario maps the advertised pathname back to the local server before verifying the static response.

## Verification Notes

- The first full preflight hit a timeout in the pre-existing WebKit profile-password scenario. The isolated rerun passed in 2.3 seconds, and the complete preflight rerun passed without changes to that test or application area.
