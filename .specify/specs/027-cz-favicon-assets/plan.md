# Implementation Plan: Cz Favicon Assets

**Branch**: `chore/cz-favicon` | **Date**: 2026-06-30 | **Spec**: `.specify/specs/027-cz-favicon-assets/spec.md`

## Summary

Ship transparent Cz wordmark favicon assets through the existing Next.js App Router file conventions, without changing application behavior or layout code.

## Technical Context

**Language/Version**: Static image assets under the legacy Next.js App Router app
**Primary Dependencies**: Next.js metadata file conventions; local image inspection tools (`sips`, ImageMagick)
**Storage**: none
**Testing**: asset inspection and repository feature-memory guard
**Target Platform**: web browsers consuming `favicon.ico` and `icon.png`
**Project Type**: static asset change inside `/app`
**Constraints**: no runtime code changes; transparent background required; TDD waived because no executable product behavior changes
**Scale/Scope**: two binary asset files plus this feature-memory package

**Touched paths**:

- Modified: `app/src/app/favicon.ico`
- Added: `app/src/app/icon.png`
- Added: `.specify/specs/027-cz-favicon-assets/{spec,plan,tasks}.md`

## Scope Boundaries

- **In scope**: favicon/icon asset replacement, alpha/dimension validation, feature-memory coverage.
- **Out of scope**: UI layout, Next.js metadata code, locale copy, automated browser tests, and dark-mode-specific icon variants.

## Constitution Check

- **Spec-First Development**: this PR now carries `.specify/specs/027-cz-favicon-assets/{spec,plan,tasks}.md` for the `app/` product-root asset change.
- **Supervised Verification**: verification rows below bind each acceptance criterion to commands that inspect the actual asset files or the PR diff.
- **Process Memory**: `tasks.md` records the gate failure, asset-only TDD waiver, and known visual trade-off.
- **Test-First Verification**: waived for this spec because no executable product behavior changed; the evidence is static asset inspection.
- **Engineering Reuse Rule**: uses Next.js existing metadata file conventions instead of adding a new app-level metadata component.

## Verification _(mandatory - required by SENAR)_

| Acceptance criterion | Evidence |
| -------------------- | -------- |
| FR-001 / SC-001 | `sips -g hasAlpha -g pixelWidth -g pixelHeight app/src/app/icon.png` reports `hasAlpha: yes`, `pixelWidth: 512`, and `pixelHeight: 512`. |
| FR-002 / SC-002 | `magick identify app/src/app/favicon.ico` reports ICO entries at `16x16`, `32x32`, and `48x48`. |
| FR-003 / SC-003 | `git diff --name-status origin/main...HEAD -- app/src/app` shows only `M app/src/app/favicon.ico` and `A app/src/app/icon.png`. |
| FR-004 / SC-004 | `node scripts/check-feature-memory.mjs origin/main HEAD` passes via `.specify/specs/027-cz-favicon-assets/{spec,plan,tasks}.md`. |
| FR-005 / SC-005 | This spec's Scope and Constitution Check explicitly waive TDD because the PR replaces static binary assets only and changes no runtime product behavior. |

Negative scenario evidence:

- The opaque-background risk is covered by `sips -g hasAlpha` on `icon.png`.
- The missing-small-favicon risk is covered by `magick identify` on `favicon.ico`.

## Project Structure

```text
.specify/specs/027-cz-favicon-assets/
├── spec.md
├── plan.md
└── tasks.md

app/src/app/
├── favicon.ico
└── icon.png
```

## Complexity Tracking

No new abstraction and no code path changes. The only product-root changes are the two static image assets.

## Risks

- **Risk**: A transparent black wordmark can be subtle on dark browser tab backgrounds. **Mitigation**: accepted as an explicit trade-off of the requested transparent Cz mark; a future SVG or alternate icon can address dark-mode tabs without blocking this asset replacement.
- **Risk**: Binary files are not reviewable through line diffs. **Mitigation**: validation relies on file-format inspection commands and the limited path diff.
