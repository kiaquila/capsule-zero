# Feature Specification: Cz Favicon Assets

**Feature Branch**: `chore/cz-favicon`; follow-ups `feat/favicon-theme-adaptive-svg`, `feat/favicon-cz-monogram`, `feat/favicon-cz-gold`, `feat/favicon-cz-plate`
**Created**: 2026-06-30
**Updated**: 2026-07-17
**Status**: Ready for review
**Input**: Use the desktop `cz.png` cursive Cz wordmark as the web app favicon with a transparent background, and make the modern app icon adapt to light and dark browser chrome. "C." iteration (2026-07-17): the founder reviewed a six-variant typographic gallery and selected the editorial "C." mark. **"CZ" gold iteration (2026-07-17):** after running the shipped "C." mark in production, the founder judged gallery variant **V5 — the gold "CZ" monogram** the better mark and asked to adopt it, preserving the light/dark inversion. V5 is the initials of "Capsule Zero" rendered as an all-gold monogram echoing the gold landing logo (`.landing-logo`, design-system §9.11(d)) one-to-one. The exact V5 type spec was recovered from the original gallery source (session transcript), not re-derived: Helvetica Neue **Bold**, `font-size 300`, `letter-spacing -6`, `text-anchor middle`, `dominant-baseline central`, gold `#EFBF04`→`#FFDD00`. **Dark-plate iteration (2026-07-17):** running the transparent all-gold V5 in production, the founder reported the mark vanishing on light-theme Chrome tabs — gold on the light tab strip measures ≈ 1.3–1.7:1 and disappears entirely under the tab hover highlight. From a three-candidate fix gallery rendered on simulated tab strips (light/dark × rest/hover/active) the founder selected **F1 — the V5 monogram on a dark rounded-square plate**: plate `#0A0A0A` (the CTA text token) with hairline `rgba(255,255,255,.20)` (the CTA border token; the approved gallery mock carried `.22` — snapped to the ratified token on the Codex P3 in PR #88, a sub-perceptual ≤.02 Lane-A delta), letter vectors byte-identical to V5, scaled 0.82 about the glyph centre. The plate carries the mark's designed background — gold on near-black, the landing hero — into the tab strip, making the mark independent of browser theme and hover state; the `prefers-color-scheme` gold step is retired as moot.

## Goal _(mandatory)_

Maintain "CZ" gold-monogram favicon assets — the V5 mark on a dark rounded-square plate — that render cleanly through the Next.js App Router file conventions, so the mark stays legible on every tab-strip surface (light and dark browser themes, including the tab hover highlight) by carrying its own background instead of depending on the OS/browser color scheme.

## Scope _(mandatory)_

In scope:

- `app/src/app/favicon.ico` regenerated as a multi-size **32-bit RGBA** ICO for browser tabs with the plate baked in, retaining per-pixel alpha at the antialiased plate corners (the canvas outside the rounded plate stays transparent).
- `app/src/app/icon.svg` provided as the modern app icon through the Next.js `icon` metadata file convention.
- The SVG "CZ" monogram sits on a dark rounded-square plate: plate `#0A0A0A`, hairline stroke `rgba(255,255,255,.20)` (so the plate stays visible on dark tab strips), letters flat gold-500 `#EFBF04` — the landing logo's gold on the landing hero's near-black. The plate makes the mark theme-independent, so the former `prefers-color-scheme` gold step is removed.
- The mark is baked to **path data** (Helvetica Neue Bold C+Z outlines extracted from the font, not `<text>` elements) so it renders identically on non-Apple devices that lack Helvetica Neue.
- Stale `app/src/app/icon.png` stays removed so browsers do not keep selecting a non-adaptive PNG mark.
- Asset validation evidence for SVG validity, the plate palette (gold letters, plate, hairline), fallback ICO sizes, and changed paths.

Out of scope:

- Runtime, routing, layout, metadata-component, auth, i18n, API, mobile, and styling code changes.
- Icon color outside the constitution §III palette (achromatic family + the gold logo accent ratified by Q4/spec 043). An **all-gold** mark is **not** a violation: the favicon is the logo surface, and §III v1.5 reserves gold exactly for "the primary CTA and the logo accent" — this mark mirrors the already-ratified all-gold `.landing-logo` wordmark. The dark plate and white hairline are within the achromatic family (constitution §III) — the composition is exactly "gold logo accent on achromatic surface", the landing hero in miniature.
- The landing/header text logo (design-system §9.11(d)) — it is rendered as text by the app, not from these assets. The favicon echoes it but is a separate asset.
- Automated UI tests; this is a static asset change with no product behavior. TDD is waived under the repository rule that the failing-test-first loop applies to application behavior, not static asset replacement.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Browser uses the CZ favicon (Priority: P1)

As a visitor, I want the browser tab and saved-page icon to use the Capsule Zero gold "CZ" mark so the app has the correct brand signal — matching the header logo — outside the page content.

**Independent Test**: Inspect the generated assets and confirm Next.js file-convention assets exist in `app/src/app/`.

**Acceptance Scenarios**:

1. **Given** the app is built by Next.js, **When** metadata file conventions are resolved, **Then** `favicon.ico` and `icon.svg` are available from `app/src/app/`.
2. **Given** the icon assets are inspected, **When** the SVG is checked, **Then** it carries the dark plate `#0A0A0A` with hairline `rgba(255,255,255,.20)` and the "CZ" paths carry flat gold-500 `#EFBF04` fills — no `prefers-color-scheme` rule, no retired yellow, no off-token fill.
3. **Given** browsers without SVG favicon support request the legacy fallback, **When** `favicon.ico` is inspected, **Then** the ICO fallback remains present with the plated gold mark baked as 32-bit RGBA frames with intermediate alpha coverage at the plate corners.

## Negative Scenarios _(mandatory - required by SENAR; waive explicitly if none apply)_

1. **Given** the mark now ships on a rounded plate, **When** the generated assets are inspected, **Then** the canvas outside the rounded plate must stay transparent (no full-bleed square background), and the plate corners must keep antialiased per-pixel alpha.
2. **Given** browser tabs request small favicon sizes, **When** the ICO is inspected, **Then** the file must include the expected 16x16, 32x32, and 48x48 entries instead of only a single large PNG.
3. **Given** a user runs a light browser theme and hovers the tab, **When** the favicon renders over the light strip and its hover highlight, **Then** the mark must not rely on canvas contrast — it must sit on its own dark plate so the PR #87 transparent-gold wash-out cannot recur.
3a. **Given** a user has dark browser chrome, **When** the favicon renders over the dark tab strip, **Then** the near-black plate must not dissolve into the strip — the hairline border must be present in the SVG and baked into every ICO frame.
4. **Given** a browser does not support SVG favicons, **When** it requests the fallback, **Then** `favicon.ico` must still be available.
5. **Given** the two-letter mark is rasterized at 16x16 for the legacy ICO fallback, **When** edge pixels are inspected, **Then** the frame must preserve intermediate alpha levels instead of collapsing to a 1-bit transparency mask that makes the letters jagged or merged.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: `app/src/app/icon.svg` MUST define the "CZ" monogram as SVG path data (Helvetica Neue **Bold** C and Z outlines extracted from the font via fontTools, not `<text>` elements), byte-identical to the V5 paths shipped in PR #87, wrapped in the founder-approved F1 plate composition: letters scaled 0.82 about the glyph centre `(256,262)` over a `rx=118` rounded-square plate. The canvas outside the plate stays transparent.
- **FR-002**: `app/src/app/favicon.ico` MUST contain 16x16, 32x32, and 48x48 **32-bit RGBA** favicon entries with per-pixel alpha and more than two alpha levels per frame so antialiased edge coverage survives the ICO encoding.
- **FR-003**: The PR MUST NOT modify app runtime code, routing, layout, copy, styling, auth, or i18n behavior.
- **FR-004**: The PR MUST include SENAR feature memory because `app/` product-root assets changed.
- **FR-005**: The PR MUST include an explicit TDD waiver because the change has no executable product behavior to test first.
- **FR-006**: `app/src/app/icon.svg` MUST use only the founder-approved F1 palette — plate `#0A0A0A`, hairline `rgba(255,255,255,.20)`, letters flat gold-500 `#EFBF04` — never an off-token gold, never yellow `#FFD600`, and never the retired achromatic C fills (`#1C1C1C`/`#EDEDED`). The former `prefers-color-scheme` gold step (`#FFDD00`) MUST be absent: the plate makes the mark theme-independent, and a stale media query would signal drift from the approved F1.
- **FR-007**: `app/src/app/icon.png` MUST stay removed so the modern metadata icon source is unambiguous.

### Key Entities

- **Favicon ICO**: Browser favicon asset served through the Next.js App Router `favicon.ico` convention.
- **App icon SVG**: Theme-adaptive icon asset served through the Next.js App Router `icon.svg` convention.

## Success Criteria _(mandatory)_

- **SC-001**: `xmllint --noout app/src/app/icon.svg` validates the SVG document.
- **SC-002**: `rg -n "#EFBF04|#0A0A0A|rgba\(255,255,255,\.20\)" app/src/app/icon.svg` finds the gold letters, the plate, and the hairline; `rg -n "FFD600|FDC104|#1C1C1C|#EDEDED|prefers-color-scheme|FFDD00|<style" app/src/app/icon.svg` finds nothing (no retired yellow, no off-token gold, no achromatic C ink, no stale media query or style block).
- **SC-003**: `magick identify app/src/app/favicon.ico` reports 16x16, 32x32, and 48x48 ICO entries; `file app/src/app/favicon.ico` reports 32 bits/pixel; alpha extraction reports more than two unique levels for every frame.
- **SC-004**: `git diff --name-status origin/main...HEAD -- app/src/app` shows only `M app/src/app/favicon.ico` and `M app/src/app/icon.svg` (dark-plate iteration).
- **SC-005**: `node scripts/check-feature-memory.mjs origin/main HEAD` passes for `.specify/specs/027-cz-favicon-assets/{spec,plan,tasks}.md`.
- **SC-006**: TDD is explicitly waived as static-asset-only work with no runtime behavior.
- **SC-007**: `test -f app/src/app/favicon.ico && test -f app/src/app/icon.svg && test ! -e app/src/app/icon.png` confirms the fallback and modern icon file set.
- **SC-008**: The shipped SVG reproduces the founder-approved F1 gallery composition — same-pipeline 512px rasters give `magick compare -metric AE` = **0** against the F1 source with the token-true `.20` hairline, and AE = **0 at 3% fuzz** against the original `.22` gallery mock, proving the only delta vs the approved visual is the sub-perceptual hairline snap.
- **SC-009**: The plated mark is legible in every tab-strip context — a 16/32/48px context montage over the five simulated surfaces (light strip `#DEE1E6`, light hover `#CDD1D7`, active white, dark strip `#202124`, dark hover `#2A2D31`) shows the mark clearly on all of them, including the light-hover case that erased the transparent V5.
