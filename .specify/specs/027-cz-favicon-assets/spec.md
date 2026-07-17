# Feature Specification: Cz Favicon Assets

**Feature Branch**: `chore/cz-favicon`; follow-ups `feat/favicon-theme-adaptive-svg`, `feat/favicon-cz-monogram`, `feat/favicon-cz-gold`
**Created**: 2026-06-30
**Updated**: 2026-07-17
**Status**: Ready for review
**Input**: Use the desktop `cz.png` cursive Cz wordmark as the web app favicon with a transparent background, and make the modern app icon adapt to light and dark browser chrome. "C." iteration (2026-07-17): the founder reviewed a six-variant typographic gallery and selected the editorial "C." mark. **"CZ" gold iteration (2026-07-17):** after running the shipped "C." mark in production, the founder judged gallery variant **V5 — the gold "CZ" monogram** the better mark and asked to adopt it, preserving the light/dark inversion. V5 is the initials of "Capsule Zero" rendered as an all-gold monogram echoing the gold landing logo (`.landing-logo`, design-system §9.11(d)) one-to-one. The exact V5 type spec was recovered from the original gallery source (session transcript), not re-derived: Helvetica Neue **Bold**, `font-size 300`, `letter-spacing -6`, `text-anchor middle`, `dominant-baseline central`, gold `#EFBF04`→`#FFDD00`.

## Goal _(mandatory)_

Maintain transparent "CZ" gold-monogram favicon assets that render cleanly through the Next.js App Router file conventions, while ensuring the modern app icon steps within the ratified gold family so the mark stays legible on both light and dark OS/browser color schemes.

## Scope _(mandatory)_

In scope:

- `app/src/app/favicon.ico` regenerated as a transparent multi-size ICO for browser tabs.
- `app/src/app/icon.svg` provided as the modern app icon through the Next.js `icon` metadata file convention.
- The SVG "CZ" monogram is all-gold and steps within the ratified gold family with `prefers-color-scheme`: gold-500 `#EFBF04` on light chrome → gold-450 `#FFDD00` on dark chrome — the same two-step inversion the landing logo uses, so the mark stays legible on either chrome.
- The mark is baked to **path data** (Helvetica Neue Bold C+Z outlines extracted from the font, not `<text>` elements) so it renders identically on non-Apple devices that lack Helvetica Neue.
- Stale `app/src/app/icon.png` stays removed so browsers do not keep selecting a non-adaptive PNG mark.
- Asset validation evidence for SVG validity, adaptive gold colors, fallback ICO sizes, and changed paths.

Out of scope:

- Runtime, routing, layout, metadata-component, auth, i18n, API, mobile, and styling code changes.
- Icon color outside the constitution §III palette (achromatic family + the gold logo accent ratified by Q4/spec 043). An **all-gold** mark is **not** a violation: the favicon is the logo surface, and §III v1.5 reserves gold exactly for "the primary CTA and the logo accent" — this mark mirrors the already-ratified all-gold `.landing-logo` wordmark. No achromatic ink remains in the V5 mark by design.
- The landing/header text logo (design-system §9.11(d)) — it is rendered as text by the app, not from these assets. The favicon echoes it but is a separate asset.
- Automated UI tests; this is a static asset change with no product behavior. TDD is waived under the repository rule that the failing-test-first loop applies to application behavior, not static asset replacement.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Browser uses the CZ favicon (Priority: P1)

As a visitor, I want the browser tab and saved-page icon to use the Capsule Zero gold "CZ" mark so the app has the correct brand signal — matching the header logo — outside the page content.

**Independent Test**: Inspect the generated assets and confirm Next.js file-convention assets exist in `app/src/app/`.

**Acceptance Scenarios**:

1. **Given** the app is built by Next.js, **When** metadata file conventions are resolved, **Then** `favicon.ico` and `icon.svg` are available from `app/src/app/`.
2. **Given** the icon assets are inspected, **When** the SVG style block is checked, **Then** the "CZ" paths carry the default gold-500 `#EFBF04` fill with a `prefers-color-scheme: dark` override to gold-450 `#FFDD00`, and no achromatic or off-token fill is present.
3. **Given** browsers without SVG favicon support request the legacy fallback, **When** `favicon.ico` is inspected, **Then** the ICO fallback remains present with the gold mark baked at light-theme gold-500.

## Negative Scenarios _(mandatory - required by SENAR; waive explicitly if none apply)_

1. **Given** the source artwork originally had a near-white background, **When** the generated assets are inspected, **Then** the replacement must not preserve that background as opaque pixels (transparent canvas only).
2. **Given** browser tabs request small favicon sizes, **When** the ICO is inspected, **Then** the file must include the expected 16x16, 32x32, and 48x48 entries instead of only a single large PNG.
3. **Given** a user has dark browser chrome, **When** the browser selects the modern app icon, **Then** the gold mark must not stay at light-theme gold-500 — it must step to gold-450 under `prefers-color-scheme: dark`.
4. **Given** a browser does not support SVG favicons, **When** it requests the fallback, **Then** `favicon.ico` must still be available.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: `app/src/app/icon.svg` MUST define the "CZ" monogram as SVG path data (Helvetica Neue **Bold** C and Z outlines extracted from the font via fontTools, not `<text>` elements) with a transparent canvas. Layout MUST reproduce the founder-selected gallery V5 type spec — `font-size 300`, `letter-spacing -6`, advance-based horizontal centering (`text-anchor middle`), and the `dominant-baseline central` baseline math already used by the prior mark.
- **FR-002**: `app/src/app/favicon.ico` MUST contain 16x16, 32x32, and 48x48 favicon entries.
- **FR-003**: The PR MUST NOT modify app runtime code, routing, layout, copy, styling, auth, or i18n behavior.
- **FR-004**: The PR MUST include SENAR feature memory because `app/` product-root assets changed.
- **FR-005**: The PR MUST include an explicit TDD waiver because the change has no executable product behavior to test first.
- **FR-006**: Both "CZ" paths in `app/src/app/icon.svg` MUST use only the ratified gold tokens — `#EFBF04` (gold-500) by default and `#FFDD00` (gold-450) under `@media (prefers-color-scheme: dark)` — never an off-token gold and never yellow `#FFD600`. The V5 mark is all-gold: it MUST NOT reintroduce the retired achromatic C fills (`#1C1C1C`/`#EDEDED`).
- **FR-007**: `app/src/app/icon.png` MUST stay removed so the modern metadata icon source is unambiguous.

### Key Entities

- **Favicon ICO**: Browser favicon asset served through the Next.js App Router `favicon.ico` convention.
- **App icon SVG**: Theme-adaptive icon asset served through the Next.js App Router `icon.svg` convention.

## Success Criteria _(mandatory)_

- **SC-001**: `xmllint --noout app/src/app/icon.svg` validates the SVG document.
- **SC-002**: `rg -n "prefers-color-scheme: dark|#EFBF04|#FFDD00" app/src/app/icon.svg` finds the adaptive rule and both ratified gold steps; `rg -n "FFD600|FDC104|#1C1C1C|#EDEDED" app/src/app/icon.svg` finds nothing (no retired yellow, no off-token gold, no achromatic ink).
- **SC-003**: `magick identify app/src/app/favicon.ico` reports 16x16, 32x32, and 48x48 ICO entries.
- **SC-004**: `git diff --name-status origin/main...HEAD -- app/src/app` shows only `M app/src/app/favicon.ico` and `M app/src/app/icon.svg` (CZ gold iteration).
- **SC-005**: `node scripts/check-feature-memory.mjs origin/main HEAD` passes for `.specify/specs/027-cz-favicon-assets/{spec,plan,tasks}.md`.
- **SC-006**: TDD is explicitly waived as static-asset-only work with no runtime behavior.
- **SC-007**: `test -f app/src/app/favicon.ico && test -f app/src/app/icon.svg && test ! -e app/src/app/icon.png` confirms the fallback and modern icon file set.
- **SC-008**: The vectorized mark reproduces the gallery V5 `<text>` render to within edge anti-aliasing — a Quick Look (WebKit, real Helvetica Neue) render of the gallery `<text>` vs the vectorized flat SVG differs by ≈ 1% of pixels (`magick compare -metric AE`), confined to a 1px glyph outline.
