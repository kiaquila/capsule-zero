# Feature Specification: Legal Documents Pages

**Feature Branch**: `codex/legal-documents-layout`
**Created**: 2026-06-24
**Status**: Ready for PR Verification
**Input**: User description: "Prepare Terms of Use and Privacy Policy in English, embed them into the site like wantapply, then remove the intro/highlight card blocks and combine the title, metadata, and numbered contents into one styled block."

## Goal _(mandatory)_

Capsule Zero visitors can open embedded, styled Terms of Use and Privacy Policy pages inside the localized web app, with legal copy covering the MVP e-commerce, account, content, AI-assisted recommendation, marketplace-link, coin, privacy, retention, and international-use risks.

## Scope _(mandatory)_

In scope:

- Add localized App Router pages for Terms of Use and Privacy Policy.
- Add structured English legal content for the pre-launch Capsule Zero product baseline.
- Render both documents with a reusable legal document component.
- Use Capsule Zero glassmorphism and achromatic styling so the legal pages feel native to the site.
- Apply the requested layout revision: no separate intro/summary block, no highlight cards, one title/meta/contents block, and inline Last updated / Status text under the title.

Out of scope:

- Legal entity registration, final counsel approval, or jurisdiction-specific launch filing.
- Payment-provider, Supabase, OAuth, marketplace, or app-store integration changes.
- New RU translations for legal copy.
- Footer/navigation placement outside the legal page chrome.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Read Terms of Use (Priority: P1)

A visitor can open the localized Terms of Use route and read Capsule Zero's service rules without leaving the app.

**Why this priority**: The product needs a clear baseline for accounts, content rights, AI/methodology output, third-party links, coins, refunds, acceptable use, and launch-readiness risk before public testing.

**Independent Test**: Open `/en/terms-of-use` and confirm the page renders a native Capsule Zero legal document with a title, inline metadata, numbered contents, legal sections, and related-document links.

**Acceptance Scenarios**:

1. **Given** a visitor opens `/en/terms-of-use`, **When** the page renders, **Then** it shows the Terms of Use content inside the app layout instead of a static external document.
2. **Given** the page header is visible, **When** the visitor scans the top block, **Then** the title, Last updated, Status, and numbered contents appear together in one glass block.
3. **Given** the visitor reads the document, **When** they reach commercial and third-party terms, **Then** the copy covers coins, refunds, payment providers, marketplace links, app stores, AI-assisted output, and user content ownership.

---

### User Story 2 - Read Privacy Policy (Priority: P1)

A visitor can open the localized Privacy Policy route and understand how Capsule Zero handles personal data.

**Why this priority**: Privacy copy must explain controller status, data categories, purposes, legal bases, subprocessors, AI/photo processing, retention, international transfers, user rights, children, cookies, and security before launch review.

**Independent Test**: Open `/en/privacy-policy` and confirm the page renders a native Capsule Zero legal document with the same component and revised layout as Terms of Use.

**Acceptance Scenarios**:

1. **Given** a visitor opens `/en/privacy-policy`, **When** the page renders, **Then** it shows the Privacy Policy content inside the app layout instead of a static external document.
2. **Given** the page header is visible, **When** the visitor scans the top block, **Then** the title, Last updated, Status, and numbered contents appear together in one glass block.
3. **Given** the visitor reads the privacy sections, **When** they review data handling details, **Then** the copy covers account data, wardrobe photos, AI/photo processing, payments, analytics, retention, transfers, rights, and security.

## Negative Scenarios _(mandatory — required by SENAR; waive explicitly if none apply)_

1. **Given** either legal page renders on desktop or mobile, **When** the page loads, **Then** the removed intro/summary and highlight card blocks must not appear.
2. **Given** either legal page renders in a narrow viewport, **When** the title, metadata, contents, article text, and tables are displayed, **Then** they must not create page-level horizontal overflow.
3. **Given** this PR adds legal routes, **When** the app builds localized static routes, **Then** `/en` and `/ru` route generation must remain successful and ES-AR must remain unexposed.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The app MUST expose `/[locale]/terms-of-use` and `/[locale]/privacy-policy` routes.
- **FR-002**: Both routes MUST use a shared legal document renderer rather than duplicated page markup.
- **FR-003**: Legal copy MUST be structured as reusable data with sections, paragraphs, lists, and tables.
- **FR-004**: The Terms of Use MUST cover accounts, eligibility, user content, AI/methodology output, third-party services, shared catalog data, coins, refunds, acceptable use, suspension, disclaimers, liability, platform terms, changes, and governing-law placeholders.
- **FR-005**: The Privacy Policy MUST cover controller/contact placeholders, data categories, purposes, legal bases, sensitive data, photos/AI processing, payments, sharing, subprocessors, transfers, retention, user rights, deletion, children, cookies, security, and changes.
- **FR-006**: The rendered layout MUST combine title, inline Last updated / Status metadata, and numbered contents in one glass block.
- **FR-007**: The rendered layout MUST omit the previous intro/summary and highlight card blocks.
- **FR-008**: Styling MUST remain achromatic and glass-based, consistent with Capsule Zero visual language.

### Key Entities

- **Legal Document**: Structured data object containing metadata, related-document link, and ordered legal sections.
- **Legal Section**: Numbered document section composed of paragraph, list, or table blocks.
- **Legal Page Renderer**: Shared React component that renders a legal document into the site UI.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: `npm run lint`, `npm run typecheck`, and `npm run build` pass.
- **SC-002**: Build output includes SSG routes for `/en/privacy-policy`, `/ru/privacy-policy`, `/en/terms-of-use`, and `/ru/terms-of-use`.
- **SC-003**: Browser verification shows zero `.legal-hero` and `.legal-highlights` nodes on Terms and Privacy pages.
- **SC-004**: Browser verification shows no page-level horizontal overflow on Terms and Privacy pages.
- **SC-005**: GitHub guard passes with this feature-memory package included in the PR.
