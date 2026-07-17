# Feature Specification: Cz Favicon Assets

**Feature Branch**: `chore/cz-favicon`; follow-ups `feat/favicon-theme-adaptive-svg`, `feat/favicon-cz-monogram`
**Created**: 2026-06-30
**Updated**: 2026-07-17
**Status**: Ready for review
**Input**: Use the desktop `cz.png` cursive Cz wordmark as the web app favicon with a transparent background, and make the modern app icon adapt to light and dark browser chrome. "C." iteration (2026-07-17): the founder reviewed a six-variant typographic gallery and selected the editorial "C." mark — an achromatic Helvetica Neue Medium C plus a gold period carrying the ratified logo accent (constitution §III v1.5, Q4 closed 2026-07-16). An earlier "CZ" monogram candidate was built, docker-previewed, and rejected by the founder before any PR.

## Goal _(mandatory)_

Maintain transparent "C." favicon assets that render cleanly through the Next.js App Router file conventions, while ensuring the modern app icon remains legible on both light and dark OS/browser color schemes.

## Scope _(mandatory)_

In scope:

- `app/src/app/favicon.ico` regenerated as a transparent multi-size ICO for browser tabs.
- `app/src/app/icon.svg` provided as the modern app icon through the Next.js `icon` metadata file convention.
- The SVG C defaults to near-black on light UI and switches to light grey-white on dark UI using `prefers-color-scheme`; the gold period steps within the ratified gold family (`#EFBF04` light → `#FFDD00` dark) so the mark stays legible on either chrome.
- Stale `app/src/app/icon.png` removed so browsers do not keep selecting a non-adaptive dark PNG mark.
- Asset validation evidence for SVG validity, adaptive colors, fallback ICO sizes, and changed paths.

Out of scope:

- Runtime, routing, layout, metadata-component, auth, i18n, API, mobile, and styling code changes.
- Icon color outside the constitution §III palette (achromatic family + the gold logo accent ratified by Q4/spec 043). The gold period is **not** a violation: the favicon is the logo surface, and §III v1.5 reserves gold exactly for "the primary CTA and the logo accent".
- The landing/header text logo (design-system §9.11(d)) — it is rendered as text by the app, not from these assets.
- Automated UI tests; this is a static asset change with no product behavior. TDD is waived under the repository rule that the failing-test-first loop applies to application behavior, not static asset replacement.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Browser uses the C. favicon (Priority: P1)

As a visitor, I want the browser tab and saved-page icon to use the Capsule Zero "C." mark so the app has the correct brand signal outside the page content.

**Independent Test**: Inspect the generated assets and confirm Next.js file-convention assets exist in `app/src/app/`.

**Acceptance Scenarios**:

1. **Given** the app is built by Next.js, **When** metadata file conventions are resolved, **Then** `favicon.ico` and `icon.svg` are available from `app/src/app/`.
2. **Given** the icon assets are inspected, **When** the SVG style block is checked, **Then** it contains the default near-black C with a dark-scheme light grey-white override, and the gold dot with its dark-scheme gold-450 override.
3. **Given** browsers without SVG favicon support request the legacy fallback, **When** `favicon.ico` is inspected, **Then** the ICO fallback remains present.

## Negative Scenarios _(mandatory - required by SENAR; waive explicitly if none apply)_

1. **Given** the source artwork originally had a near-white background, **When** the generated assets are inspected, **Then** the replacement must not preserve that background as opaque pixels.
2. **Given** browser tabs request small favicon sizes, **When** the ICO is inspected, **Then** the file must include the expected 16x16 and 32x32 entries instead of only the 512x512 PNG.
3. **Given** a user has dark browser chrome, **When** the browser selects the modern app icon, **Then** the C mark must not stay near-black against the dark chrome.
4. **Given** a browser does not support SVG favicons, **When** it requests the fallback, **Then** `favicon.ico` must still be available.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: `app/src/app/icon.svg` MUST define the "C." mark as SVG path data (Helvetica Neue Medium C outline extracted from the font, not text elements) with a transparent canvas.
- **FR-002**: `app/src/app/favicon.ico` MUST contain 16x16, 32x32, and 48x48 favicon entries.
- **FR-003**: The PR MUST NOT modify app runtime code, routing, layout, copy, styling, auth, or i18n behavior.
- **FR-004**: The PR MUST include SENAR feature memory because `app/` product-root assets changed.
- **FR-005**: The PR MUST include an explicit TDD waiver because the change has no executable product behavior to test first.
- **FR-006**: The achromatic C in `app/src/app/icon.svg` MUST default to `#1C1C1C` and switch to `#EDEDED` under `@media (prefers-color-scheme: dark)`; the gold dot MUST use only the ratified gold tokens — `#EFBF04` (gold-500) by default and `#FFDD00` (gold-450) under the dark scheme — never an off-token gold and never yellow `#FFD600`.
- **FR-007**: `app/src/app/icon.png` MUST stay removed so the modern metadata icon source is unambiguous.

### Key Entities

- **Favicon ICO**: Browser favicon asset served through the Next.js App Router `favicon.ico` convention.
- **App icon SVG**: Theme-adaptive icon asset served through the Next.js App Router `icon.svg` convention.

## Success Criteria _(mandatory)_

- **SC-001**: `xmllint --noout app/src/app/icon.svg` validates the SVG document.
- **SC-002**: `rg -n "prefers-color-scheme: dark|#1C1C1C|#EDEDED|#EFBF04|#FFDD00" app/src/app/icon.svg` finds the adaptive achromatic rules and both ratified gold steps; `rg -n "FFD600|FDC104" app/src/app/icon.svg` finds nothing.
- **SC-003**: `magick identify app/src/app/favicon.ico` reports 16x16, 32x32, and 48x48 ICO entries.
- **SC-004**: `git diff --name-status origin/main...HEAD -- app/src/app` shows only `M app/src/app/favicon.ico` and `M app/src/app/icon.svg` (monogram iteration).
- **SC-005**: `node scripts/check-feature-memory.mjs origin/main HEAD` passes for `.specify/specs/027-cz-favicon-assets/{spec,plan,tasks}.md`.
- **SC-006**: TDD is explicitly waived as static-asset-only work with no runtime behavior.
- **SC-007**: `test -f app/src/app/favicon.ico && test -f app/src/app/icon.svg && test ! -e app/src/app/icon.png` confirms the fallback and modern icon file set.
