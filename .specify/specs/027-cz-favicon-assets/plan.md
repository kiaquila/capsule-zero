# Implementation Plan: Cz Favicon Assets

**Branch**: `chore/cz-favicon`; follow-ups `feat/favicon-theme-adaptive-svg`, `feat/favicon-cz-monogram`, `feat/favicon-cz-gold` | **Date**: 2026-07-17 | **Spec**: `.specify/specs/027-cz-favicon-assets/spec.md`

## Summary

Ship transparent favicon assets through the existing Next.js App Router file conventions, keeping the theme-adaptive SVG behavior so the mark remains legible on light and dark browser chrome. The **"CZ" gold iteration (2026-07-17)** replaces the editorial "C." mark with the founder-selected gallery variant **V5 — the gold "CZ" monogram** (initials of "Capsule Zero"), chosen after the "C." mark was run in production. The mark echoes the all-gold landing logo one-to-one. Its exact type spec was recovered from the original gallery source (Helvetica Neue Bold, `font-size 300`, `letter-spacing -6`, centered) and vectorized to path data via fontTools `SVGPathPen` so the favicon is font-independent. No application behavior or layout code changes.

## Technical Context

**Language/Version**: Static image assets under the legacy Next.js App Router app
**Primary Dependencies**: Next.js metadata file conventions; local SVG/XML inspection tools; fontTools (glyph extraction); ImageMagick (ICO render)
**Storage**: none
**Testing**: asset inspection (including ICO bit depth and alpha-level coverage), pixel-fidelity comparison, and repository feature-memory guard
**Target Platform**: web browsers consuming `favicon.ico` and `icon.svg`
**Project Type**: static asset change inside `/app`
**Constraints**: no runtime code changes; transparent background required; constitution §III palette only (the mark is entirely the ratified gold logo accent); TDD waived because no executable product behavior changes
**Scale/Scope**: one static SVG + ICO replacement plus this feature-memory package

**Touched paths ("CZ" gold iteration)**:

- Modified: `app/src/app/icon.svg`, `app/src/app/favicon.ico`
- Modified: `.specify/specs/027-cz-favicon-assets/{spec,plan,tasks}.md`

## Scope Boundaries

- **In scope**: modern app icon replacement, light/dark gold-step validation, pixel-fidelity check vs the gallery source, feature-memory coverage.
- **Out of scope**: UI layout, Next.js metadata code, locale copy, automated browser tests, and design-system token files (no favicon token exists; the gold tokens are already ratified in §9.11).

## Constitution Check

- **Spec-First Development**: this PR updates `.specify/specs/027-cz-favicon-assets/{spec,plan,tasks}.md` for the `app/` product-root asset change.
- **Supervised Verification**: verification rows below bind each acceptance criterion to commands that inspect the actual asset files or the PR diff.
- **Process Memory**: `tasks.md` records the source-recovery decision, asset-only TDD waiver, and the known 16px trade-off.
- **Test-First Verification**: waived for this spec because no executable product behavior changed; the evidence is static asset inspection plus a pixel-fidelity comparison.
- **Engineering Reuse Rule**: reuses Next.js existing metadata file conventions, the ratified gold tokens (§9.11), and the exact `dominant-baseline central` baseline math from the prior "C." mark — no new abstraction.
- **Achromatic Interface + gold logo accent**: the mark is entirely the ratified gold logo accent (`#EFBF04`/`#FFDD00`, design-system §9.11). Constitution §III v1.5 reserves gold for the primary CTA and the logo accent; the favicon is the logo surface and mirrors the already-ratified all-gold `.landing-logo` wordmark. No other colour is introduced.

## Verification _(mandatory - required by SENAR)_

| Acceptance criterion | Evidence |
| -------------------- | -------- |
| FR-001 / SC-001 | `xmllint --noout app/src/app/icon.svg` validates the SVG document; the two `<path>` elements carry Helvetica Neue Bold C/Z outlines at `scale(0.3,-0.3)` with the V5 centering transforms. |
| FR-006 / SC-002 | `rg -n "prefers-color-scheme: dark|#EFBF04|#FFDD00" app/src/app/icon.svg` finds the adaptive rule and both gold steps; `rg -n "FFD600|FDC104|#1C1C1C|#EDEDED" app/src/app/icon.svg` exits non-zero (no retired yellow, no off-token gold, no achromatic ink). |
| FR-002 / SC-003 | `magick identify app/src/app/favicon.ico` reports ICO entries at `16x16`, `32x32`, and `48x48`; `file app/src/app/favicon.ico` reports 32 bits/pixel; `for frame in 0 1 2; do magick "app/src/app/favicon.ico[$frame]" -alpha extract -format "%k\n" info:; done` reports `62`, `111`, and `137` unique alpha levels (all >2), proving the RGBA fallback retains antialiased edge coverage rather than a 1-bit transparency mask. |
| FR-002 / SC-007 | `test -f app/src/app/favicon.ico && test -f app/src/app/icon.svg && test ! -e app/src/app/icon.png` confirms the ICO fallback remains while the PNG source is removed. |
| FR-003 / SC-004 | `git diff --name-status origin/main...HEAD -- app/src/app` shows only `M app/src/app/favicon.ico` and `M app/src/app/icon.svg`. |
| FR-004 / SC-005 | `node scripts/check-feature-memory.mjs origin/main HEAD` passes via `.specify/specs/027-cz-favicon-assets/{spec,plan,tasks}.md`. |
| FR-005 / SC-006 | This spec's Scope and Constitution Check explicitly waive TDD because the PR replaces static assets only and changes no runtime product behavior. |
| FR-007 / SC-007 | `test ! -e app/src/app/icon.png` confirms the stale non-adaptive icon source is absent. |
| SC-008 | Quick Look (WebKit, real Helvetica Neue) render of the gallery V5 `<text>` vs the vectorized flat SVG: `magick compare -metric AE` ≈ 1.1% of pixels differ (`2999/262144`), confined to a 1px glyph outline — the mark is pixel-faithful to the selected variant. |

Negative scenario evidence:

- The opaque-background risk is covered by the SVG root having no background element and by `xmllint --noout app/src/app/icon.svg`.
- The dark-chrome visibility risk is covered by `rg` evidence for the `prefers-color-scheme: dark` gold-450 override.
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
- **Risk**: Some browsers may not support SVG favicons. **Mitigation**: retain `favicon.ico` as the legacy fallback (light-theme gold-500 baked, since ICO cannot theme-adapt) and encode all three frames as 32-bit RGBA with intermediate alpha coverage so small-size edges remain antialiased.
- **Risk (known trade-off)**: a two-letter "CZ" is denser at 16px than the single-letter "C." was, and gold-500 on a pure-white tab is lower contrast than the achromatic C. This is inherent to the founder-selected all-gold monogram; the SVG adapts to gold-450 on dark chrome, and the ICO fallback covers legacy clients. Accepted with the V5 selection.
