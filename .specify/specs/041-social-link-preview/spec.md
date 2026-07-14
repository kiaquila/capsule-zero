# Feature Specification: Social Link Preview

**Feature Branch**: `codex/telegram-link-preview`  
**Created**: 2026-07-14  
**Status**: In progress  
**Input**: Prepare a polished social preview from a screenshot of the Capsule Zero homepage before updating the Telegram post.

## Goal _(mandatory)_

Sharing Capsule Zero produces a premium, image-backed social card whose artwork is an accurate screenshot of the production landing page.

## Scope _(mandatory)_

In scope:

- A 1200x630 screenshot of the production English landing page without temporary overlays.
- Shared site metadata for the redirect and localized root layouts.
- Open Graph and Twitter large-image tags with absolute production URLs.
- Automated coverage for the rendered metadata and static image route.
- Frontend documentation for the canonical social-preview contract.

Out of scope:

- Editing or republishing the existing Telegram channel post.
- Changing landing-page layout, copy, interactions, or authentication behavior.
- Adding analytics parameters or forcing Telegram cache invalidation before deployment.
- Generating new brand artwork instead of using the requested homepage screenshot.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Rich shared link (Priority: P1)

As a person who encounters a Capsule Zero link in Telegram or another social client, I want a polished visual preview so I can recognize the product before opening it.

**Why this priority**: The current text-only link card loses the premium first impression that the landing page already provides.

**Independent Test**: Open the localized landing page, inspect its social metadata, and request the advertised image from the local app.

**Acceptance Scenarios**:

1. **Given** the localized landing page renders, **When** a crawler reads its Open Graph metadata, **Then** it receives an absolute Capsule Zero image URL with 1200x630 dimensions and descriptive alt text.
2. **Given** a client reads Twitter Card metadata, **When** it selects the card type and image, **Then** it receives `summary_large_image` and the same absolute preview image URL.
3. **Given** either root layout renders, **When** site metadata is evaluated, **Then** both layouts use one shared metadata definition instead of drifting copies.

### Edge Cases

- The preview image must remain readable when a client crops a few pixels around the outer edge.
- The asset must stay below the Open Graph image size limit while retaining the 1200x630 source dimensions.
- The local development origin must not leak into production-facing metadata.

## Negative Scenarios _(mandatory - required by SENAR; waive explicitly if none apply)_

1. **Given** the app runs on localhost, **When** metadata is rendered, **Then** it must not publish a relative image URL or a localhost origin.
2. **Given** the preview image is requested from the app, **When** the static route is resolved, **Then** it must not return a missing or non-image response.
3. **Given** the screenshot is captured for social sharing, **When** it is inspected, **Then** it must not include the cookie banner, auth popup, browser chrome, or non-product overlays.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The app MUST publish an Open Graph image using an absolute `https://capsulezero.app` URL.
- **FR-002**: The Open Graph image metadata MUST declare width `1200`, height `630`, and descriptive alt text.
- **FR-003**: The app MUST publish Twitter Card metadata using `summary_large_image` and the same screenshot.
- **FR-004**: The preview asset MUST be a current screenshot of `https://capsulezero.app/en` captured without the cookie banner or auth popup.
- **FR-005**: The redirect and localized layouts MUST reuse one metadata definition.
- **FR-006**: The preview asset MUST be served by the Next.js app as `image/png` without a new runtime dependency.
- **FR-007**: The landing-page UI and copy MUST remain unchanged.
- **FR-008**: The application behavior MUST follow the required failing-test-first commit sequence.

### Key Entities

- **Site metadata**: The shared Next.js metadata definition for title, description, Open Graph, and Twitter Card fields.
- **Social preview image**: The 1200x630 production-homepage screenshot advertised to crawlers.

## Success Criteria _(mandatory)_

- **SC-001**: The social-preview Playwright scenario passes in both configured browser projects.
- **SC-002**: Built HTML contains absolute Open Graph and Twitter image URLs rooted at `https://capsulezero.app`.
- **SC-003**: `sips` reports exactly 1200x630 pixels for the committed PNG.
- **SC-004**: The static image request returns HTTP 200 with `image/png`.
- **SC-005**: `npm run preflight` and all required GitHub checks pass on the PR head.
- **SC-006**: Visual inspection confirms the screenshot preserves the approved achromatic editorial landing page without temporary overlays.
