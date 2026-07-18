# Implementation Plan: Cz Favicon Assets

**Branch**: `chore/cz-favicon`; follow-ups `feat/favicon-theme-adaptive-svg`, `feat/favicon-cz-monogram`, `feat/favicon-cz-gold`, `feat/favicon-cz-plate` | **Date**: 2026-07-17 | **Spec**: `.specify/specs/027-cz-favicon-assets/spec.md`

## Summary

Ship favicon assets through the existing Next.js App Router file conventions. The **"CZ" gold iteration (2026-07-17)** replaced the editorial "C." mark with the founder-selected gallery variant **V5 — the gold "CZ" monogram** (initials of "Capsule Zero"), vectorized to path data via fontTools `SVGPathPen` so the favicon is font-independent. The **dark-plate iteration (2026-07-17, this PR)** answers the founder's production report that the transparent all-gold V5 vanishes on light-theme Chrome tabs (gold on the light strip ≈ 1.3–1.7:1, fully erased under the tab hover highlight): the founder selected fix-gallery variant **F1** — the byte-identical V5 letter vectors, scaled 0.82, on a `#0A0A0A` rounded-square plate with a `rgba(255,255,255,.20)` hairline. The plate ships the mark's designed background (gold on near-black, the landing hero) into the tab strip, making legibility independent of browser theme and hover; the `prefers-color-scheme` gold step is retired as moot. No application behavior or layout code changes.

## Technical Context

**Language/Version**: Static image assets under the legacy Next.js App Router app
**Primary Dependencies**: Next.js metadata file conventions; local SVG/XML inspection tools; fontTools (glyph extraction, prior iteration); sharp/librsvg (SVG raster); ImageMagick (ICO pack + inspection)
**Storage**: none
**Testing**: asset inspection (including ICO bit depth and alpha-level coverage), pixel-fidelity comparison, and repository feature-memory guard
**Target Platform**: web browsers consuming `favicon.ico` and `icon.svg`
**Project Type**: static asset change inside `/app`
**Constraints**: no runtime code changes; transparent background required; constitution §III palette only (the mark is entirely the ratified gold logo accent); TDD waived because no executable product behavior changes
**Scale/Scope**: one static SVG + ICO replacement plus this feature-memory package

**Touched paths (dark-plate iteration)**:

- Modified: `app/src/app/icon.svg`, `app/src/app/favicon.ico`
- Modified: `.specify/specs/027-cz-favicon-assets/{spec,plan,tasks}.md`

## Scope Boundaries

- **In scope**: modern app icon replacement, plate-composition validation (palette, hairline, transparent corners), pixel-fidelity check vs the approved F1 gallery source, tab-surface context montage, feature-memory coverage.
- **Out of scope**: UI layout, Next.js metadata code, locale copy, automated browser tests, and design-system token files (no favicon token exists; the gold tokens are already ratified in §9.11).

## Constitution Check

- **Spec-First Development**: this PR updates `.specify/specs/027-cz-favicon-assets/{spec,plan,tasks}.md` for the `app/` product-root asset change.
- **Supervised Verification**: verification rows below bind each acceptance criterion to commands that inspect the actual asset files or the PR diff.
- **Process Memory**: `tasks.md` records the source-recovery decision, asset-only TDD waiver, and the known 16px trade-off.
- **Test-First Verification**: waived for this spec because no executable product behavior changed; the evidence is static asset inspection plus a pixel-fidelity comparison.
- **Engineering Reuse Rule**: reuses Next.js existing metadata file conventions, the ratified gold tokens (§9.11), and the exact `dominant-baseline central` baseline math from the prior "C." mark — no new abstraction.
- **Achromatic Interface + gold logo accent**: the letters are the ratified gold logo accent (`#EFBF04`, design-system §9.11); the plate `#0A0A0A` and hairline `rgba(255,255,255,.20)` are achromatic (constitution §III) and reuse the CTA's own surface values (`--btn-cta-text` / `--btn-cta-border`). The composition is "gold logo accent on achromatic surface" — the landing hero in miniature. No other colour is introduced.

## Verification _(mandatory - required by SENAR)_

| Acceptance criterion | Evidence |
| -------------------- | -------- |
| FR-001 / SC-001 | `xmllint --noout app/src/app/icon.svg` validates the SVG document; the two `<path>` elements carry the byte-identical V5 Helvetica Neue Bold C/Z outlines at `scale(0.3,-0.3)` with the V5 centering transforms, wrapped in the F1 plate group `translate(256,262) scale(0.82) translate(-256,-262)`. |
| FR-006 / SC-002 | `rg -n "#EFBF04|#0A0A0A|rgba\(255,255,255,\.20\)" app/src/app/icon.svg` finds the gold letters, plate, and hairline; `rg -n "FFD600|FDC104|#1C1C1C|#EDEDED|prefers-color-scheme|FFDD00|<style" app/src/app/icon.svg` exits non-zero (no retired yellow, no off-token gold, no achromatic C ink, no stale media query or style block). |
| FR-002 / SC-003 | `magick identify app/src/app/favicon.ico` reports ICO entries at `16x16`, `32x32`, and `48x48`; `file app/src/app/favicon.ico` reports 32 bits/pixel; `for frame in 0 1 2; do magick "app/src/app/favicon.ico[$frame]" -alpha extract -format "%k\n" info:; done` reports `15`, `27`, and `49` unique alpha levels (all >2), and `%[pixel:p{0,0}]` reports `srgba(0,0,0,0)` for every frame — antialiased plate corners over a transparent canvas, not a 1-bit mask or full-bleed square. |
| FR-002 / SC-007 | `test -f app/src/app/favicon.ico && test -f app/src/app/icon.svg && test ! -e app/src/app/icon.png` confirms the ICO fallback remains while the PNG source is removed. |
| FR-003 / SC-004 | `git diff --name-status origin/main...HEAD -- app/src/app` shows only `M app/src/app/favicon.ico` and `M app/src/app/icon.svg`. |
| FR-004 / SC-005 | `node scripts/check-feature-memory.mjs origin/main HEAD` passes via `.specify/specs/027-cz-favicon-assets/{spec,plan,tasks}.md`. |
| FR-005 / SC-006 | This spec's Scope and Constitution Check explicitly waive TDD because the PR replaces static assets only and changes no runtime product behavior. |
| FR-007 / SC-007 | `test ! -e app/src/app/icon.png` confirms the stale non-adaptive icon source is absent. |
| SC-008 | Same-pipeline (sharp/librsvg, density 144) 512px rasters: `magick compare -metric AE` = **0** vs the F1 gallery source with the token-true `.20` hairline, and AE = **0 at `-fuzz 3%`** vs the original `.22` gallery mock — geometry, letters, and plate are pixel-identical to the approved composition; the only delta is the sub-perceptual hairline snap (Codex P3, PR #88). |
| SC-009 | 16/32/48px context montage over the five simulated tab surfaces (`#DEE1E6` light strip, `#CDD1D7` light hover, white active tab, `#202124` dark strip, `#2A2D31` dark hover): the plated mark is clearly legible on all fifteen chips, including the light-hover case that erased the transparent V5 (founder screenshot, 2026-07-17). |

Negative scenario evidence:

- The full-bleed-background risk is covered by the corner-pixel check (`%[pixel:p{0,0}]` = `srgba(0,0,0,0)` on every ICO frame) plus the per-frame alpha-level counts proving antialiased plate corners.
- The light-theme hover wash-out (the PR #87 regression this iteration fixes) is covered by the plate itself plus the SC-009 context montage over the light strip and hover surfaces.
- The dark-strip dissolve risk is covered by `rg` evidence of the `rgba(255,255,255,.20)` hairline in the SVG and the SC-009 dark-strip/dark-hover chips.
- The unsupported-SVG fallback risk is covered by `magick identify`, `file`, the per-frame alpha-level check, and the file-set check proving `favicon.ico` remains present as an antialiased 32-bit RGBA fallback with the plate baked in.

## Project Structure

```text
.specify/specs/027-cz-favicon-assets/
├── spec.md
├── plan.md
└── tasks.md

app/src/app/
├── favicon.ico
└── icon.svg
```

## Complexity Tracking

No new abstraction and no code path changes. The only product-root changes are the static app icon files.

## Risks

- **Risk**: A browser may prefer a non-adaptive PNG if both modern icon sources exist. **Mitigation**: keep only `icon.svg` plus `favicon.ico`; `icon.png` stays removed.
- **Risk**: Some browsers may not support SVG favicons. **Mitigation**: retain `favicon.ico` as the legacy fallback with the plate baked into every frame — the plate needs no theme adaptation, so the ICO now behaves identically to the SVG on any chrome.
- **Risk (known trade-off)**: a two-letter "CZ" is denser at 16px than a single-letter mark, and the plate margin shrinks the letters a further 18% (scale 0.82). Inherent to the founder-selected F1 composition; the SC-009 montage confirms the 16px mark stays readable, and larger sizes are crisp. Accepted with the F1 selection.
- **Resolved**: the prior "gold-on-white low contrast" trade-off accepted with V5 is superseded — the plate removes the mark's dependency on tab-surface contrast entirely (that gap is what erased the mark on light-theme hover and motivated this iteration).
