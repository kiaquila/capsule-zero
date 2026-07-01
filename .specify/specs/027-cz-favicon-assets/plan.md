# Implementation Plan: Cz Favicon Assets

**Branch**: `chore/cz-favicon`; follow-up `feat/favicon-theme-adaptive-svg` | **Date**: 2026-07-01 | **Spec**: `.specify/specs/027-cz-favicon-assets/spec.md`

## Summary

Ship transparent Cz wordmark favicon assets through the existing Next.js App Router file conventions, and replace the modern PNG app icon with a theme-adaptive SVG so the mark remains legible on light and dark browser chrome. No application behavior or layout code changes.

## Technical Context

**Language/Version**: Static image assets under the legacy Next.js App Router app
**Primary Dependencies**: Next.js metadata file conventions; local SVG/XML inspection tools
**Storage**: none
**Testing**: asset inspection and repository feature-memory guard
**Target Platform**: web browsers consuming `favicon.ico` and `icon.svg`
**Project Type**: static asset change inside `/app`
**Constraints**: no runtime code changes; transparent background required; achromatic fills only; TDD waived because no executable product behavior changes
**Scale/Scope**: one static SVG icon replacement plus this feature-memory package

**Touched paths**:

- Deleted: `app/src/app/icon.png`
- Added: `app/src/app/icon.svg`
- Modified: `.specify/specs/027-cz-favicon-assets/{spec,plan,tasks}.md`

## Scope Boundaries

- **In scope**: modern app icon replacement, light/dark SVG color validation, feature-memory coverage.
- **Out of scope**: UI layout, Next.js metadata code, locale copy, automated browser tests, and dark-mode-specific icon variants.

## Constitution Check

- **Spec-First Development**: this PR updates `.specify/specs/027-cz-favicon-assets/{spec,plan,tasks}.md` for the `app/` product-root asset change.
- **Supervised Verification**: verification rows below bind each acceptance criterion to commands that inspect the actual asset files or the PR diff.
- **Process Memory**: `tasks.md` records the gate failure, asset-only TDD waiver, and known visual trade-off.
- **Test-First Verification**: waived for this spec because no executable product behavior changed; the evidence is static asset inspection.
- **Engineering Reuse Rule**: uses Next.js existing metadata file conventions instead of adding a new app-level metadata component.
- **Achromatic Interface**: the SVG uses only near-black and light grey-white fills, with no chromatic UI color.

## Verification _(mandatory - required by SENAR)_

| Acceptance criterion | Evidence |
| -------------------- | -------- |
| FR-001 / SC-001 | `xmllint --noout app/src/app/icon.svg` validates the SVG document. |
| FR-006 / SC-002 | `rg -n "prefers-color-scheme: dark|#1C1C1C|#EDEDED" app/src/app/icon.svg` finds the default and dark-scheme achromatic fills. |
| FR-002 / SC-003 | `magick identify app/src/app/favicon.ico` reports ICO entries at `16x16`, `32x32`, and `48x48`. |
| FR-002 / SC-007 | `test -f app/src/app/favicon.ico && test -f app/src/app/icon.svg && test ! -e app/src/app/icon.png` confirms the ICO fallback remains while the PNG source is removed. |
| FR-003 / SC-004 | `git diff --name-status origin/main...HEAD -- app/src/app` shows only `D app/src/app/icon.png` and `A app/src/app/icon.svg`. |
| FR-004 / SC-005 | `node scripts/check-feature-memory.mjs origin/main HEAD` passes via `.specify/specs/027-cz-favicon-assets/{spec,plan,tasks}.md`. |
| FR-005 / SC-006 | This spec's Scope and Constitution Check explicitly waive TDD because the PR replaces static assets only and changes no runtime product behavior. |
| FR-007 / SC-007 | `test ! -e app/src/app/icon.png` confirms the stale non-adaptive icon source is absent. |

Negative scenario evidence:

- The opaque-background risk is covered by the SVG root having no background element and by `xmllint --noout app/src/app/icon.svg`.
- The dark-chrome visibility risk is covered by `rg` evidence for the `prefers-color-scheme: dark` override.
- The unsupported-SVG fallback risk is covered by `magick identify app/src/app/favicon.ico` and the file-set check proving `favicon.ico` remains present.

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

- **Risk**: A browser may prefer the non-adaptive PNG if both modern icon sources exist. **Mitigation**: remove `icon.png` and keep only `icon.svg` plus `favicon.ico`.
- **Risk**: Some browsers may not support SVG favicons. **Mitigation**: retain `favicon.ico` as the legacy fallback.
