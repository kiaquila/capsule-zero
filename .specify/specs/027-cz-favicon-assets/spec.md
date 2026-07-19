# Feature Specification: Cz Favicon Assets

**Feature Branch**: `chore/cz-favicon`; follow-ups `feat/favicon-theme-adaptive-svg`, `feat/favicon-cz-monogram`, `feat/favicon-cz-gold`, `feat/favicon-cz-plate`, `feat/favicon-cz-adaptive`
**Created**: 2026-06-30
**Updated**: 2026-07-18
**Status**: Ready for review
**Input**: Use the desktop `cz.png` cursive Cz wordmark as the web app favicon with a transparent background, and make the modern app icon adapt to the reported light/dark color preference. "C." iteration (2026-07-17): the founder reviewed a six-variant typographic gallery and selected the editorial "C." mark. **"CZ" gold iteration (2026-07-17):** after running the shipped "C." mark in production, the founder judged gallery variant **V5 — the gold "CZ" monogram** the better mark and asked to adopt it, preserving the light/dark inversion. V5 is the initials of "Capsule Zero" rendered as an all-gold monogram echoing the gold landing logo (`.landing-logo`, design-system §9.11(d)) one-to-one. The exact V5 type spec was recovered from the original gallery source (session transcript), not re-derived: Helvetica Neue **Bold**, `font-size 300`, `letter-spacing -6`, `text-anchor middle`, `dominant-baseline central`, gold `#EFBF04`→`#FFDD00`. **Dark-plate iteration (2026-07-17):** running the transparent all-gold V5 in production, the founder reported the mark vanishing on light-theme Chrome tabs — gold on the light tab strip measures ≈ 1.3–1.7:1 and disappears entirely under the tab hover highlight. From a three-candidate fix gallery the founder selected **F1 — the V5 monogram on a dark rounded-square plate** (plate `#0A0A0A`, hairline `rgba(255,255,255,.20)`, letters gold, scaled 0.82). **Achromatic preference-adaptive iteration (2026-07-18, `feat/favicon-cz-adaptive`, this PR):** after running the plated F1 mark in production the founder judged it unsatisfactory and asked to return to the previous variant's **letterforms** (the V5 Bold "CZ" — same monogram, typography, and full size) but recolored the way the **first favicon iteration** (PR #59) was implemented: **achromatic and preference-adaptive** — dark ink for a reported light scheme, light ink for a reported dark scheme. The V5 letter vectors are kept byte-identical; the dark plate and the gold fills are retired. The mark's ink follows the browser/OS preference via a `@media (prefers-color-scheme: dark)` rule, reusing PR #59's exact two-color mechanism and values: base `#1C1C1C` (the wardrobe achromatic Black, design-system §1), dark-scheme `#EDEDED` (light grey-white). This media feature does not sample a custom tab-strip surface; a browser theme that diverges from the reported preference remains an accepted limitation of the founder-selected mechanism.

## Goal _(mandatory)_

Maintain "CZ" monogram favicon assets — the founder-approved V5 Bold letterforms recolored achromatic and preference-adaptive — that render cleanly through the Next.js App Router file conventions and select contrasting ink when the browser chrome matches the reported OS/user-agent color preference (the same mechanism the first favicon iteration shipped), instead of carrying a dark plate. Custom browser themes that diverge from that preference are explicitly outside the contrast guarantee.

## Scope _(mandatory)_

In scope:

- `app/src/app/favicon.ico` regenerated as a multi-size **32-bit RGBA** ICO for browser tabs, retaining per-pixel alpha at the antialiased letter edges (the canvas stays transparent; the light-theme dark ink `#1C1C1C` is baked because ICO cannot theme-adapt).
- `app/src/app/icon.svg` provided as the modern app icon through the Next.js `icon` metadata file convention.
- The SVG "CZ" monogram is the V5 Bold letterforms at full size (byte-identical V5 path data and centering transforms — no plate, no 0.82 scale), recolored achromatic and preference-adaptive: a `<style>` block sets `.cz-mark { fill: #1C1C1C }` with `@media (prefers-color-scheme: dark) { .cz-mark { fill: #EDEDED } }`. The dark plate and the gold fills of the previous iteration are removed.
- The mark is baked to **path data** (Helvetica Neue Bold C+Z outlines extracted from the font, not `<text>` elements) so it renders identically on non-Apple devices that lack Helvetica Neue.
- Stale `app/src/app/icon.png` stays removed so browsers do not keep selecting a non-adaptive PNG mark.
- Asset validation evidence for SVG validity, the achromatic preference-adaptive palette (dark/light ink, the media query), byte-identity of the letters vs V5, fallback ICO sizes, changed paths, and the matching- versus mismatched-surface contrast boundary.

Out of scope:

- Runtime, routing, layout, metadata-component, auth, i18n, API, mobile, and styling code changes.
- Icon color outside the constitution §III palette. This mark is the **achromatic base** (`#1C1C1C` near-black / `#EDEDED` light grey-white, both within the achromatic family, constitution §III) — it deliberately no longer carries the gold logo accent the V5/F1 iterations used. §III reserves gold *for* the logo accent but does not *require* it; an achromatic favicon is squarely within the always-allowed achromatic base, and the founder chose it over the gold mark (this iteration). No non-achromatic color is introduced.
- The landing/header text logo (design-system §9.11(d)) — it is rendered as gold text by the app, not from these assets. The favicon is a separate asset and, from this iteration, no longer mirrors the landing logo's gold.
- Automated UI tests; this is a static asset change with no product behavior. TDD is waived under the repository rule that the failing-test-first loop applies to application behavior, not static asset replacement.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Browser uses the CZ favicon (Priority: P1)

As a visitor, I want the browser tab and saved-page icon to use the Capsule Zero "CZ" mark with ink matched to my reported light/dark preference, so the app has a clear brand signal outside the page content when browser chrome follows that preference.

**Independent Test**: Inspect the generated assets and confirm Next.js file-convention assets exist in `app/src/app/`.

**Acceptance Scenarios**:

1. **Given** the app is built by Next.js, **When** metadata file conventions are resolved, **Then** `favicon.ico` and `icon.svg` are available from `app/src/app/`.
2. **Given** the icon assets are inspected, **When** the SVG is checked, **Then** the "CZ" paths carry the byte-identical V5 letter vectors at full size (no plate, no 0.82 scale), the base fill is achromatic `#1C1C1C`, and a `@media (prefers-color-scheme: dark)` rule switches the fill to `#EDEDED` — with no gold fill, no dark plate `rect`, and no retired yellow.
3. **Given** browsers without SVG favicon support request the legacy fallback, **When** `favicon.ico` is inspected, **Then** the ICO fallback remains present with the mark baked as 32-bit RGBA frames (light-theme dark ink) with intermediate alpha coverage at the letter edges.

## Negative Scenarios _(mandatory - required by SENAR; waive explicitly if none apply)_

1. **Given** the mark is transparent-background, **When** the generated assets are inspected, **Then** the canvas must stay transparent (no full-bleed square or plate background), and the letter edges must keep antialiased per-pixel alpha.
2. **Given** browser tabs request small favicon sizes, **When** the ICO is inspected, **Then** the file must include the expected 16x16, 32x32, and 48x48 entries instead of only a single large PNG.
3. **Given** the browser/OS reports `prefers-color-scheme: dark`, **When** the SVG favicon renders, **Then** it must switch to the light `#EDEDED` ink; when the actual tab strip also follows that reported preference, the near-black `#1C1C1C` mark cannot disappear on the dark strip.
4. **Given** the founder's requirement is a return to the previous variant's letterforms, **When** the SVG `<path>` elements are compared to the V5 mark shipped in PR #87, **Then** they must be byte-identical (same `d`, same transforms) — only the color mechanism changes, not the typography, geometry, or size.
5. **Given** a browser does not support SVG favicons, **When** it requests the fallback, **Then** `favicon.ico` must still be available.
6. **Given** the two-letter mark is rasterized at 16x16 for the legacy ICO fallback, **When** edge pixels are inspected, **Then** the frame must preserve intermediate alpha levels instead of collapsing to a 1-bit transparency mask that makes the letters jagged or merged.
7. **Given** a custom browser theme makes the tab strip diverge from the OS/user-agent color preference, **When** the SVG selects ink from `prefers-color-scheme`, **Then** surface-independent contrast is not guaranteed; this mismatch must remain explicitly documented and accepted rather than being claimed as covered by SC-009.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: `app/src/app/icon.svg` MUST define the "CZ" monogram as SVG path data (Helvetica Neue **Bold** C and Z outlines extracted from the font via fontTools, not `<text>` elements), **byte-identical to the V5 paths shipped in PR #87** — same `d` attributes and same `translate(...)/scale(0.3,-0.3)` centering transforms, at full size with no plate wrapper and no 0.82 scale. The canvas stays transparent.
- **FR-002**: `app/src/app/favicon.ico` MUST contain 16x16, 32x32, and 48x48 **32-bit RGBA** favicon entries with per-pixel alpha and more than two alpha levels per frame so antialiased edge coverage survives the ICO encoding.
- **FR-003**: The PR MUST NOT modify app runtime code, routing, layout, copy, styling, auth, or i18n behavior.
- **FR-004**: The PR MUST include SENAR feature memory because `app/` product-root assets changed.
- **FR-005**: The PR MUST include an explicit TDD waiver because the change has no executable product behavior to test first.
- **FR-006**: `app/src/app/icon.svg` MUST use only the achromatic preference-adaptive palette — base fill `#1C1C1C`, dark-scheme fill `#EDEDED` under `@media (prefers-color-scheme: dark)` — and MUST NOT contain the gold letters (`#EFBF04`/`#FFDD00`), the dark plate (`#0A0A0A` or any `<rect>`), or the retired yellow (`#FFD600`). The `prefers-color-scheme` rule MUST be present: this iteration restores the first favicon's preference adaptation.
- **FR-007**: `app/src/app/icon.png` MUST stay removed so the modern metadata icon source is unambiguous.
- **FR-008**: Feature memory MUST state that `prefers-color-scheme` selects from the reported OS/user-agent preference and does not detect the composed tab-strip color; matching preference/surface pairs are verified, while custom-theme mismatches and the single-theme ICO fallback remain accepted known limitations.

### Key Entities

- **Favicon ICO**: Browser favicon asset served through the Next.js App Router `favicon.ico` convention (light-preference dark ink baked).
- **App icon SVG**: Preference-adaptive icon asset served through the Next.js App Router `icon.svg` convention.

## Success Criteria _(mandatory)_

- **SC-001**: `xmllint --noout app/src/app/icon.svg` validates the SVG document.
- **SC-002**: `rg -n "#1C1C1C|#EDEDED|prefers-color-scheme" app/src/app/icon.svg` finds the base ink, the dark-scheme ink, and the media query; `rg -n "EFBF04|FFDD00|FFD600|FDC104|0A0A0A|<rect" app/src/app/icon.svg` finds nothing (no gold letters, no retired yellow, no dark plate).
- **SC-003**: `magick identify app/src/app/favicon.ico` reports 16x16, 32x32, and 48x48 ICO entries; `file app/src/app/favicon.ico` reports 32 bits/pixel; alpha extraction reports more than two unique levels for every frame (measured `58`, `95`, `132`) and every frame's corner pixel is `srgba(0,0,0,0)`.
- **SC-004**: `git diff --name-status origin/main...HEAD -- app/src/app` shows only `M app/src/app/favicon.ico` and `M app/src/app/icon.svg`.
- **SC-005**: `node scripts/check-feature-memory.mjs origin/main HEAD` passes for `.specify/specs/027-cz-favicon-assets/{spec,plan,tasks}.md`.
- **SC-006**: TDD is explicitly waived as static-asset-only work with no runtime behavior.
- **SC-007**: `test -f app/src/app/favicon.ico && test -f app/src/app/icon.svg && test ! -e app/src/app/icon.png` confirms the fallback and modern icon file set.
- **SC-008**: The SVG `<path>` elements are byte-identical to the V5 mark (PR #87): `diff` of the two files' `<path>` lines is empty, and same-pipeline (sharp/librsvg, density 144) 512px **alpha-channel** rasters give `magick compare -metric AE` = **0** against V5 — letterforms, geometry, and size are unchanged; only the fill color/mechanism differs.
- **SC-009**: A reproducible Chromium check MUST assert computed SVG fills `rgb(28, 28, 28)` for forced light preference and `rgb(237, 237, 237)` for forced dark preference. Against the established representative tab surfaces `#DEE1E6` and `#202124`, matching preference/surface pairs MUST measure at least `13:1`; the mismatched custom-theme pairs are measured and retained as an explicit known limitation, not counted as a pass.
