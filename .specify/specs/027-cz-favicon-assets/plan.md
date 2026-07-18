# Implementation Plan: Cz Favicon Assets

**Branch**: `chore/cz-favicon`; follow-ups `feat/favicon-theme-adaptive-svg`, `feat/favicon-cz-monogram`, `feat/favicon-cz-gold`, `feat/favicon-cz-plate`, `feat/favicon-cz-adaptive` | **Date**: 2026-07-18 | **Spec**: `.specify/specs/027-cz-favicon-assets/spec.md`

## Summary

Ship favicon assets through the existing Next.js App Router file conventions. Prior iterations shipped the editorial "C." mark (PR #85), the all-gold V5 "CZ" monogram (PR #87), and the V5 monogram on a dark rounded-square plate (F1, PR #88). The **achromatic theme-adaptive iteration (2026-07-18, this PR)** answers the founder's judgment that the plated F1 mark is unsatisfactory in production: it returns to the **previous variant's letterforms** — the V5 Bold "CZ", byte-identical path data at full size — but recolors the mark the way the **first favicon iteration** (`feat/favicon-theme-adaptive-svg`, PR #59) was implemented: achromatic and theme-adaptive via `@media (prefers-color-scheme: dark)`, dark `#1C1C1C` ink on light browser chrome and light `#EDEDED` ink on dark browser chrome. The dark plate and the gold fills are retired; the letter vectors are untouched (SC-008 proves byte-identity and AE = 0 alpha geometry vs V5). No application behavior or layout code changes.

## Technical Context

**Language/Version**: Static image assets under the legacy Next.js App Router app
**Primary Dependencies**: Next.js metadata file conventions; local SVG/XML inspection tools; sharp/librsvg (SVG raster); ImageMagick (ICO pack + inspection)
**Storage**: none
**Testing**: asset inspection (including ICO bit depth and alpha-level coverage), byte-identity and pixel-fidelity comparison vs V5, live theme-switch render, and repository feature-memory guard
**Target Platform**: web browsers consuming `favicon.ico` and `icon.svg`
**Project Type**: static asset change inside `/app`
**Constraints**: no runtime code changes; transparent background required; constitution §III achromatic palette only (this mark is the achromatic base, no gold); TDD waived because no executable product behavior changes
**Scale/Scope**: one static SVG + ICO replacement plus this feature-memory package

**Touched paths (achromatic theme-adaptive iteration)**:

- Modified: `app/src/app/icon.svg`, `app/src/app/favicon.ico`
- Modified: `.specify/specs/027-cz-favicon-assets/{spec,plan,tasks}.md`

## Scope Boundaries

- **In scope**: modern app icon recolor (achromatic theme-adaptive), letter byte-identity check vs V5, ICO regeneration, palette validation, live light/dark render, tab-surface context montage, feature-memory coverage.
- **Out of scope**: UI layout, Next.js metadata code, locale copy, automated browser tests, and design-system token files (no favicon token exists; `#1C1C1C`/`#EDEDED` are the first-favicon values within the achromatic base).

## Constitution Check

- **Spec-First Development**: this PR updates `.specify/specs/027-cz-favicon-assets/{spec,plan,tasks}.md` for the `app/` product-root asset change.
- **Supervised Verification**: verification rows below bind each acceptance criterion to commands that inspect the actual asset files or the PR diff.
- **Process Memory**: `tasks.md` records the founder recolor decision, the byte-identity preservation of the V5 letters, the asset-only TDD waiver, and the retained 16px density trade-off.
- **Test-First Verification**: waived for this spec because no executable product behavior changed; the evidence is static asset inspection, byte-identity, and a live theme-switch render.
- **Engineering Reuse Rule**: reuses Next.js metadata file conventions, the **byte-identical V5 letter vectors** (PR #87), and the **exact theme-adaptation mechanism and values** of the first favicon iteration (PR #59: `.cz-mark` fill `#1C1C1C` → `#EDEDED`). No new abstraction, no re-derived geometry.
- **Achromatic Interface**: the letters are the achromatic base — `#1C1C1C` (design-system §1 wardrobe Black) on light chrome, `#EDEDED` light grey-white on dark chrome — both within the achromatic family (constitution §III). The mark deliberately no longer uses the gold logo accent; §III allows (does not require) gold for the logo, and the achromatic base is always permitted. No other colour is introduced.

## Verification _(mandatory - required by SENAR)_

| Acceptance criterion | Evidence |
| -------------------- | -------- |
| FR-001 / SC-001 / SC-008 | `xmllint --noout app/src/app/icon.svg` validates the SVG document; `diff <(grep '<path' app/src/app/icon.svg) <(git show 9b44e92:app/src/app/icon.svg \| grep '<path')` is **empty** — the two `<path>` elements are byte-identical to the V5 Helvetica Neue Bold C/Z outlines (`scale(0.3,-0.3)` with the V5 centering transforms), at full size with no plate wrapper; same-pipeline 512px alpha rasters give `magick compare -metric AE` = **0** vs V5. |
| FR-006 / SC-002 | `rg -n "#1C1C1C\|#EDEDED\|prefers-color-scheme" app/src/app/icon.svg` finds the base ink, the dark-scheme ink, and the media query; `rg -n "EFBF04\|FFDD00\|FFD600\|FDC104\|0A0A0A\|<rect" app/src/app/icon.svg` exits non-zero (no gold letters, no retired yellow, no dark plate). |
| FR-002 / SC-003 | `magick identify app/src/app/favicon.ico` reports ICO entries at `16x16`, `32x32`, and `48x48`; `file app/src/app/favicon.ico` reports 32 bits/pixel; `for f in 0 1 2; do magick "app/src/app/favicon.ico[$f]" -alpha extract -format "%k\n" info:; done` reports `58`, `95`, and `132` unique alpha levels (all >2), and `%[pixel:p{0,0}]` reports `srgba(0,0,0,0)` for every frame — antialiased letter edges over a transparent canvas, not a 1-bit mask or full-bleed square. |
| FR-002 / SC-007 | `test -f app/src/app/favicon.ico && test -f app/src/app/icon.svg && test ! -e app/src/app/icon.png` confirms the ICO fallback remains while the PNG source is removed. |
| FR-003 / SC-004 | `git diff --name-status origin/main...HEAD -- app/src/app` shows only `M app/src/app/favicon.ico` and `M app/src/app/icon.svg`. |
| FR-004 / SC-005 | `node scripts/check-feature-memory.mjs origin/main HEAD` passes via `.specify/specs/027-cz-favicon-assets/{spec,plan,tasks}.md`. |
| FR-005 / SC-006 | This spec's Scope and Constitution Check explicitly waive TDD because the PR replaces static assets only and changes no runtime product behavior. |
| FR-007 / SC-007 | `test ! -e app/src/app/icon.png` confirms the stale non-adaptive icon source is absent. |
| SC-009 | Live render in a Chromium engine at forced `prefers-color-scheme: light` and `dark` shows dark `#1C1C1C` letters on light and light `#EDEDED` letters on dark; a 16px-at-4× + 32px context montage over light (rest/hover/active) and dark (rest/hover/active) tab strips shows the mark legible on all surfaces. Served-asset parity confirmed: `curl` of `/icon.svg` and `/favicon.ico` from the local Docker web container is byte-identical to the repo files, landing `/en` returns 200. |

Negative scenario evidence:

- The full-bleed/plate-background risk is covered by the corner-pixel check (`%[pixel:p{0,0}]` = `srgba(0,0,0,0)` on every ICO frame) plus the `rg` proof that no `<rect>` plate is in the SVG and the per-frame alpha-level counts proving antialiased edges.
- The dark-strip disappearance risk (near-black ink on a dark strip) is covered by the `prefers-color-scheme: dark` rule (`rg` evidence) and the SC-009 live dark render + dark-strip montage chips.
- The "letterforms must equal the previous variant" requirement is covered by the empty `<path>` diff vs V5 and the AE = 0 alpha-geometry comparison (SC-008).
- The unsupported-SVG fallback risk is covered by `magick identify`, `file`, the per-frame alpha-level check, and the file-set check proving `favicon.ico` remains present as an antialiased 32-bit RGBA fallback.

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
- **Risk**: Some browsers may not support SVG favicons and fall back to the ICO, which cannot theme-adapt. **Mitigation**: bake the light-theme dark `#1C1C1C` ink (light chrome is the majority default); dark-chrome clients that honor SVG favicons get the `#EDEDED` step from `icon.svg`. This is the same fallback posture the first favicon iteration (PR #59) shipped.
- **Risk (known trade-off)**: a two-letter "CZ" is denser at 16px than a single-letter mark. Inherent to the V5 letterforms the founder chose to keep; without the plate the letters are now larger than F1 (no 0.82 down-scale), which improves 16px legibility. Larger sizes (32/48/SVG) are crisp.
- **Resolved**: the F1 plate — introduced to fix the gold-on-light wash-out — is retired. The wash-out was a property of the *gold* fill on a light strip; achromatic dark ink on a light strip has full contrast, and the `prefers-color-scheme` rule restores dark-strip legibility, so the plate is no longer needed.
