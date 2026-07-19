# Implementation Plan: Cz Favicon Assets

**Branch**: `chore/cz-favicon`; follow-ups `feat/favicon-theme-adaptive-svg`, `feat/favicon-cz-monogram`, `feat/favicon-cz-gold`, `feat/favicon-cz-plate`, `feat/favicon-cz-adaptive` | **Date**: 2026-07-18 | **Spec**: `.specify/specs/027-cz-favicon-assets/spec.md`

## Summary

Ship favicon assets through the existing Next.js App Router file conventions. Prior iterations shipped the editorial "C." mark (PR #85), the all-gold V5 "CZ" monogram (PR #87), and the V5 monogram on a dark rounded-square plate (F1, PR #88). The **achromatic preference-adaptive iteration (2026-07-18, this PR)** answers the founder's judgment that the plated F1 mark is unsatisfactory in production: it returns to the **previous variant's letterforms** — the V5 Bold "CZ", byte-identical path data at full size — but recolors the mark the way the **first favicon iteration** (`feat/favicon-theme-adaptive-svg`, PR #59) was implemented: achromatic and adaptive via `@media (prefers-color-scheme: dark)`, dark `#1C1C1C` ink for a reported light scheme and light `#EDEDED` ink for a reported dark scheme. The dark plate and the gold fills are retired; the letter vectors are untouched (SC-008 proves byte-identity and AE = 0 alpha geometry vs V5). The media query does not sample custom tab surfaces, so SC-009 verifies matching preference/surface pairs and records mismatches as an accepted trade-off. No application behavior or layout code changes.

## Technical Context

**Language/Version**: Static image assets under the legacy Next.js App Router app
**Primary Dependencies**: Next.js metadata file conventions; local SVG/XML inspection tools; sharp/librsvg (SVG raster); ImageMagick (ICO pack + inspection)
**Storage**: none
**Testing**: asset inspection (including ICO bit depth and alpha-level coverage), byte-identity and pixel-fidelity comparison vs V5, reproducible Chromium preference checks plus a 2×2 preference/surface contrast matrix, and repository feature-memory guard
**Target Platform**: web browsers consuming `favicon.ico` and `icon.svg`
**Project Type**: static asset change inside `/app`
**Constraints**: no runtime code changes; transparent background required; constitution §III achromatic palette only (this mark is the achromatic base, no gold); TDD waived because no executable product behavior changes
**Scale/Scope**: one static SVG + ICO replacement plus this feature-memory package

**Touched paths (achromatic preference-adaptive iteration)**:

- Modified: `app/src/app/icon.svg`, `app/src/app/favicon.ico`
- Modified: `.specify/specs/027-cz-favicon-assets/{spec,plan,tasks}.md`

## Scope Boundaries

- **In scope**: modern app icon recolor (achromatic preference-adaptive), letter byte-identity check vs V5, ICO regeneration, palette validation, live light/dark preference render, matching/mismatched tab-surface contrast matrix, feature-memory coverage.
- **Out of scope**: UI layout, Next.js metadata code, locale copy, automated browser tests, and design-system token files (no favicon token exists; `#1C1C1C`/`#EDEDED` are the first-favicon values within the achromatic base).

## Constitution Check

- **Spec-First Development**: this PR updates `.specify/specs/027-cz-favicon-assets/{spec,plan,tasks}.md` for the `app/` product-root asset change.
- **Supervised Verification**: verification rows below bind each acceptance criterion to commands that inspect the actual asset files or the PR diff.
- **Process Memory**: `tasks.md` records the founder recolor decision, the byte-identity preservation of the V5 letters, the asset-only TDD waiver, the retained 16px density trade-off, and the custom-theme/single-theme-ICO limitations.
- **Test-First Verification**: waived for this spec because no executable product behavior changed; the evidence is static asset inspection, byte-identity, and a reproducible live preference-switch render.
- **Engineering Reuse Rule**: reuses Next.js metadata file conventions, the **byte-identical V5 letter vectors** (PR #87), and the **exact theme-adaptation mechanism and values** of the first favicon iteration (PR #59: `.cz-mark` fill `#1C1C1C` → `#EDEDED`). No new abstraction, no re-derived geometry.
- **Achromatic Interface**: the letters are the achromatic base — `#1C1C1C` (design-system §1 wardrobe Black) for a reported light scheme, `#EDEDED` light grey-white for a reported dark scheme — both within the achromatic family (constitution §III). The mark deliberately no longer uses the gold logo accent; §III allows (does not require) gold for the logo, and the achromatic base is always permitted. No other colour is introduced.

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
| FR-008 / SC-009 | Run the reproducible Chromium + 2×2 contrast command below. It asserts computed SVG fills `rgb(28, 28, 28)` for forced light preference and `rgb(237, 237, 237)` for forced dark preference. Against the established representative tab surfaces `#DEE1E6` / `#202124`, matching pairs measure `13.00:1` / `13.75:1`; mismatches measure `1.06:1` / `1.12:1` and are explicitly outside the guarantee. |

SC-009 reproducible browser and contrast evidence (run from the repository root after `tests/e2e` dependencies are installed):

```bash
(
  cd tests/e2e
  node - <<'NODE'
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const expected = { light: "rgb(28, 28, 28)", dark: "rgb(237, 237, 237)" };
const luminance = (hex) => {
  const channels = hex.match(/../g).map((value) => Number.parseInt(value, 16) / 255);
  const linear = channels.map((value) =>
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
};
const contrast = (left, right) => {
  const [high, low] = [luminance(left), luminance(right)].sort((a, b) => b - a);
  return ((high + 0.05) / (low + 0.05)).toFixed(2);
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const iconUrl = pathToFileURL(path.resolve("../../app/src/app/icon.svg")).href;
  for (const scheme of ["light", "dark"]) {
    const page = await browser.newPage({ colorScheme: scheme });
    await page.goto(iconUrl);
    const fills = await page.locator("path").evaluateAll((nodes) =>
      nodes.map((node) => getComputedStyle(node).fill),
    );
    assert.deepEqual([...new Set(fills)], [expected[scheme]]);
    await page.close();
  }
  await browser.close();

  const matrix = {
    "light-preference/light-surface": contrast("1C1C1C", "DEE1E6"),
    "light-preference/dark-surface": contrast("1C1C1C", "202124"),
    "dark-preference/light-surface": contrast("EDEDED", "DEE1E6"),
    "dark-preference/dark-surface": contrast("EDEDED", "202124"),
  };
  console.log(matrix);
  assert.deepEqual(matrix, {
    "light-preference/light-surface": "13.00",
    "light-preference/dark-surface": "1.06",
    "dark-preference/light-surface": "1.12",
    "dark-preference/dark-surface": "13.75",
  });
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
NODE
)
```

Negative scenario evidence:

- The full-bleed/plate-background risk is covered by the corner-pixel check (`%[pixel:p{0,0}]` = `srgba(0,0,0,0)` on every ICO frame) plus the `rg` proof that no `<rect>` plate is in the SVG and the per-frame alpha-level counts proving antialiased edges.
- The matching dark-preference/dark-surface disappearance risk is covered by the `prefers-color-scheme: dark` rule and the SC-009 Chromium/contrast command.
- The custom-theme mismatch risk is not masked: SC-009 measures both mismatched pairs below `1.2:1`, and the spec plus Process Memory explicitly limit the guarantee and retain the trade-off.
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
- **Risk**: A custom browser theme may make the composed tab surface diverge from the OS/user-agent preference exposed through `prefers-color-scheme`; the transparent SVG cannot sample that surface, so contrast may fall below `1.2:1` in the mismatched pairs. **Acceptance**: this is the exact first-favicon mechanism the founder asked to restore after rejecting the surface-independent plate. SC-009 proves the matching pairs and exposes, rather than hides, the mismatch. Revisit if analytics or feedback show material custom-theme usage.
- **Risk**: Some browsers may not support SVG favicons and fall back to the ICO, which cannot theme-adapt. **Mitigation/acceptance**: bake the light-theme dark `#1C1C1C` ink (light chrome is the majority default); dark-preference clients that honor SVG favicons get the `#EDEDED` step from `icon.svg`. This is the same fallback posture the first favicon iteration (PR #59) shipped.
- **Risk (known trade-off)**: a two-letter "CZ" is denser at 16px than a single-letter mark. Inherent to the V5 letterforms the founder chose to keep; without the plate the letters are now larger than F1 (no 0.82 down-scale), which improves 16px legibility. Larger sizes (32/48/SVG) are crisp.
- **Resolved for matching pairs**: the F1 plate — introduced to fix the gold-on-light wash-out — is retired. The wash-out was a property of the *gold* fill on a light strip; achromatic dark ink on a matching light strip has full contrast, and the `prefers-color-scheme` rule restores legibility on a matching dark strip. Custom-theme mismatches remain the accepted limitation above.
