# Feature Specification: Cz Favicon Assets

**Feature Branch**: `chore/cz-favicon`
**Created**: 2026-06-30
**Status**: Ready for review
**Input**: Use the desktop `cz.png` cursive Cz wordmark as the web app favicon with a transparent background.

## Goal _(mandatory)_

Replace the default web favicon assets with transparent Cz wordmark assets that render cleanly through the Next.js App Router file conventions.

## Scope _(mandatory)_

In scope:

- `app/src/app/favicon.ico` regenerated as a transparent multi-size ICO for browser tabs.
- `app/src/app/icon.png` added as a transparent 512x512 PNG for modern app-icon metadata.
- Asset validation evidence for alpha channel, dimensions, and changed paths.

Out of scope:

- Runtime, routing, layout, metadata-component, auth, i18n, API, mobile, and styling code changes.
- A dark-mode-specific alternate icon.
- Automated UI tests; this is a static asset change with no product behavior. TDD is waived under the repository rule that the failing-test-first loop applies to application behavior, not static asset replacement.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Browser uses the Cz favicon (Priority: P1)

As a visitor, I want the browser tab and saved-page icon to use the Capsule Zero Cz wordmark so the app has the correct brand signal outside the page content.

**Independent Test**: Inspect the generated assets and confirm Next.js file-convention assets exist in `app/src/app/`.

**Acceptance Scenarios**:

1. **Given** the app is built by Next.js, **When** metadata file conventions are resolved, **Then** `favicon.ico` and `icon.png` are available from `app/src/app/`.
2. **Given** the icon assets are inspected, **When** alpha and dimensions are checked, **Then** the PNG has transparency and 512x512 dimensions, and the ICO contains 16x16, 32x32, and 48x48 entries.

## Negative Scenarios _(mandatory - required by SENAR; waive explicitly if none apply)_

1. **Given** the source artwork originally had a near-white background, **When** the generated assets are inspected, **Then** the replacement must not preserve that background as opaque pixels.
2. **Given** browser tabs request small favicon sizes, **When** the ICO is inspected, **Then** the file must include the expected 16x16 and 32x32 entries instead of only the 512x512 PNG.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: `app/src/app/icon.png` MUST be a 512x512 PNG with an alpha channel.
- **FR-002**: `app/src/app/favicon.ico` MUST contain 16x16, 32x32, and 48x48 favicon entries.
- **FR-003**: The PR MUST NOT modify app runtime code, routing, layout, copy, styling, auth, or i18n behavior.
- **FR-004**: The PR MUST include SENAR feature memory because `app/` product-root assets changed.
- **FR-005**: The PR MUST include an explicit TDD waiver because the change has no executable product behavior to test first.

### Key Entities

- **Favicon ICO**: Browser favicon asset served through the Next.js App Router `favicon.ico` convention.
- **App icon PNG**: 512x512 icon asset served through the Next.js App Router `icon.png` convention.

## Success Criteria _(mandatory)_

- **SC-001**: `sips` reports `hasAlpha: yes`, `pixelWidth: 512`, and `pixelHeight: 512` for `app/src/app/icon.png`.
- **SC-002**: `magick identify app/src/app/favicon.ico` reports 16x16, 32x32, and 48x48 ICO entries.
- **SC-003**: `git diff --name-status origin/main...HEAD -- app/src/app` shows only the favicon/icon asset changes.
- **SC-004**: `node scripts/check-feature-memory.mjs origin/main HEAD` passes for `.specify/specs/027-cz-favicon-assets/{spec,plan,tasks}.md`.
- **SC-005**: TDD is explicitly waived as static-asset-only work with no runtime behavior.
