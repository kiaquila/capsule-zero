# Feature Specification: Legal Footer Links

**Feature Branch**: `fix/legal-footer-links`
**Created**: 2026-06-30
**Status**: Ready for PR verification
**Input**: Restore UI access to the already-existing Terms of Use and Privacy Policy pages from landing and auth surfaces.

## Goal _(mandatory)_

Capsule Zero visitors can reach the static Terms of Use and Privacy Policy pages from the landing footer, standalone auth footer, and auth consent note through locale-aware application routes instead of dead in-page anchors.

## Scope _(mandatory)_

In scope:

- Replace `#terms` and `#privacy` anchors in the landing footer with localized links to `/terms-of-use` and `/privacy-policy`.
- Replace the same dead anchors in the standalone auth page footer and auth consent note.
- Add stable test hooks for the footer links and legal page return path.
- Add Playwright coverage for Terms navigation, Privacy navigation, Back-to-home behavior, and the `#terms` regression.

Out of scope:

- Legal copy changes, counsel review, legal entity details, or jurisdiction-specific content edits.
- RU legal copy localization; the existing legal content remains English-only pending a separate i18n-content task.
- New legal routes; `/[locale]/terms-of-use` and `/[locale]/privacy-policy` already exist.
- Changes to cookie consent behavior or legal document layout.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Open legal pages from the landing footer (Priority: P1)

A visitor can click Terms of Use or Privacy Policy in the landing footer and land on the corresponding static legal page in the active locale.

**Why this priority**: Legal pages that exist but are unreachable from the primary entry screen leave the launch flow with a compliance and trust gap.

**Independent Test**: Open `/en`, dismiss the cookie banner if present, click each footer legal link, and assert the browser reaches `/en/terms-of-use` or `/en/privacy-policy` with the legal document root visible.

**Acceptance Scenarios**:

1. **Given** the visitor is on `/en`, **When** they click the footer Terms link, **Then** the app routes to `/en/terms-of-use` and renders the legal document page.
2. **Given** the visitor is on `/en`, **When** they click the footer Privacy link, **Then** the app routes to `/en/privacy-policy` and renders the legal document page.
3. **Given** the visitor is on the Terms page reached from the footer, **When** they click Back to Capsule Zero, **Then** the app returns to `/en`.

### User Story 2 - Preserve legal access from auth surfaces (Priority: P1)

A visitor reviewing the standalone auth page or auth consent note can open the same static legal pages instead of hitting inert anchors.

**Why this priority**: Consent copy must point to real policy pages at the moment a visitor is considering account creation.

**Independent Test**: Source inspection confirms the auth page footer and `AuthPanel` consent note use the shared locale-aware navigation link component for both legal routes.

**Acceptance Scenarios**:

1. **Given** the standalone auth page footer is rendered, **When** the visitor activates Terms or Privacy, **Then** each link targets the static localized legal route.
2. **Given** the auth consent note is rendered, **When** the visitor activates Terms or Privacy, **Then** each link targets the same static localized legal route.

## Negative Scenarios _(mandatory - required by SENAR; waive explicitly if none apply)_

1. **Given** the landing footer Terms link is clicked, **When** navigation completes, **Then** the URL must not end with `#terms` and must route to the Terms page instead.
2. **Given** the footer and auth surfaces are rendered, **When** legal links are inspected, **Then** no `#terms` or `#privacy` legal-link anchors remain in those surfaces.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The landing footer Terms link MUST use the locale-aware app link to `/terms-of-use`.
- **FR-002**: The landing footer Privacy link MUST use the locale-aware app link to `/privacy-policy`.
- **FR-003**: The standalone auth page footer MUST use the same route targets for Terms and Privacy.
- **FR-004**: The auth consent note MUST use the same route targets for Terms and Privacy.
- **FR-005**: The legal page root and Back-to-home link MUST expose stable POM-friendly `data-testid` attributes.
- **FR-006**: The Playwright e2e suite MUST cover Terms navigation, Privacy navigation, Back-to-home behavior, and a negative scenario for the `#terms` regression.
- **FR-007**: The implementation MUST preserve active EN/RU locale routing through the existing `next-intl` navigation helper and MUST NOT expose ES-AR.
- **FR-008**: The PR MUST include complete SENAR feature memory because product-root files under `app/` changed.

### Key Entities

- **Legal footer link**: A footer navigation control that routes to one of the static legal document pages.
- **Auth consent legal link**: A consent-note link inside the auth panel that points to the same legal document route.
- **Legal page POM**: Playwright page object for static legal document pages.

## Success Criteria _(mandatory)_

- **SC-001**: `npm --prefix tests/e2e run lint` passes with all selectors mediated through Page Objects.
- **SC-002**: `npm --prefix tests/e2e run typecheck` passes for the new legal page object and spec.
- **SC-003**: `npm --prefix tests/e2e run test -- specs/landing/legal-links.spec.ts` passes.
- **SC-004**: `npm --prefix app run lint` and `npm --prefix app run typecheck` pass after replacing the anchors with `Link`.
- **SC-005**: `node scripts/check-feature-memory.mjs origin/main HEAD` passes with `.specify/specs/028-legal-footer-links/{spec,plan,tasks}.md`.
- **SC-006**: Required GitHub PR checks `baseline-checks`, `guard`, `AI Review`, and `test` are green on the final PR head SHA; `osv-scan` is also green as the non-required security signal.
