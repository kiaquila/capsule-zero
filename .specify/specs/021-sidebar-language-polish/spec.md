# Feature Specification: Sidebar Icons and Language Menu Polish

**Feature Branch**: `codex/sidebar-language-fixes`
**Created**: 2026-06-15
**Status**: Ready for PR Verification
**Input**: User description: "Align sidebar icons across authenticated menu states and restyle the language dropdown to match auth and cookie popups."

## Goal _(mandatory)_

Authenticated navigation keeps the same icon artwork and sizing across Dashboard, My Items, Outfits, Capsules, Favourites, For Sale, Shopping List, and Settings when users switch between Stage 1 wardrobe screens, and the language dropdown uses the same elevated glass style as the auth popup and cookie banner.

## Scope _(mandatory)_

In scope:

- Reuse Dashboard navigation icon definitions for duplicate wardrobe sidebars, mobile bottom navigation, and More-sheet menu entries.
- Align My Items, Outfits, Capsules, For Sale, Dashboard, Shopping List, and Settings icon identity and dimensions across Dashboard, capsule-result, favorites, my-items, uncapsulated, for-sale, and for-repair surfaces.
- Keep active-state behavior stable for capsule-result tabs: Outfits is active only for the outfits tab, while Capsules represents capsule items and gaps.
- Restyle `.language-menu` as an elevated light glass surface consistent with the auth panel and cookie banner.
- Preserve the existing EN/RU-only language switcher behavior and MVP v1 locale scope.

Out of scope:

- New navigation destinations, route changes, data-provider behavior, or copy changes.
- Real auth/provider integration changes.
- ES-AR activation or language persistence changes outside the existing next-intl flow.
- Redesign of the approved dashboard/sidebar layout beyond icon and dropdown consistency.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - See Stable Sidebar Iconography (Priority: P1)

An authenticated user moves between wardrobe screens and sees the same navigation icon set, size, and alignment in every sidebar or menu state.

**Why this priority**: Navigation drift makes the app feel unfinished and breaks the premium visual consistency required for Stage 1 review.

**Independent Test**: Open Dashboard, My Items, Capsule Result, Favourites, For Sale, For Repair, and Uncapsulated, then compare sidebar/menu SVG markup and icon bounding boxes for shared navigation labels.

**Acceptance Scenarios**:

1. **Given** the user is on Dashboard, **When** they compare My Items, Outfits, Capsules, For Sale, Dashboard, Shopping List, and Settings icons against the same labels on other authenticated screens, **Then** the icon artwork is identical.
2. **Given** the user is on Favourites, **When** they inspect For Sale, Dashboard, Shopping List, and Settings entries, **Then** the icons keep the same 18px rendered dimensions and alignment as Dashboard.
3. **Given** the user is on capsule-result, **When** they switch between outfits, items, and gaps tabs, **Then** Outfits and Capsules keep stable icon identity without double-active or mismatched icons.

---

### User Story 2 - Open a Consistent Language Menu (Priority: P1)

An authenticated or unauthenticated user opens the language selector and sees a light elevated glass popup matching the auth and cookie surfaces instead of a dark menu.

**Why this priority**: The language dropdown is global chrome; a mismatched dark surface creates visible inconsistency across the interface.

**Independent Test**: Open the top-right language menu and inspect computed styles for background, blur, shadow, border, and visible EN/RU options.

**Acceptance Scenarios**:

1. **Given** the language selector is closed, **When** the user opens it, **Then** the dropdown uses a light translucent glass background, elevated shadow, blur, and border aligned with auth/cookie popup styling.
2. **Given** the menu is open, **When** options render, **Then** only EN and RU remain available and no ES-AR option appears.

## Negative Scenarios _(mandatory — required by SENAR; waive explicitly if none apply)_

1. **Given** a wardrobe screen uses a local sidebar implementation, **When** the menu renders, **Then** it must not introduce a local icon variant for a shared Dashboard navigation label.
2. **Given** capsule-result is on the gaps tab, **When** active navigation state is calculated, **Then** Capsules remains the active entry and Outfits does not become active.
3. **Given** the language menu opens over an authenticated dashboard background, **When** users inspect it visually, **Then** it must not fall back to the previous dark popup style or expose inactive ES-AR locale controls.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Shared authenticated navigation labels MUST use Dashboard icon artwork wherever those labels are duplicated.
- **FR-002**: Shared sidebar, bottom navigation, and More-sheet icon boxes MUST keep consistent rendered dimensions across affected screens.
- **FR-003**: My Items MUST use the same Dashboard My Items icon on Dashboard, Outfits, Capsules, and other wardrobe surfaces.
- **FR-004**: Outfits and Capsules MUST use the same Dashboard icons across capsule-result and wardrobe sidebars.
- **FR-005**: For Sale MUST use the same Dashboard For Sale icon on Favourites and related wardrobe menus.
- **FR-006**: Dashboard, Shopping List, and Settings icons MUST keep consistent sizing across Favourites and other duplicate menus.
- **FR-007**: Capsule-result active-state logic MUST keep Outfits active only for the outfits tab and Capsules active for capsule items and gaps tabs.
- **FR-008**: The language dropdown MUST use the same elevated light glass surface pattern as auth and cookie popups.
- **FR-009**: The language dropdown MUST keep EN/RU as the only active MVP v1 locale options.
- **FR-010**: Product behavior, route structure, mock providers, and i18n persistence MUST remain unchanged except for the visual polish above.

### Key Entities

- **Dashboard Icon Set**: Shared SVG icon definitions exported by the dashboard navigation component and reused by local authenticated menu implementations.
- **Authenticated Sidebar Entry**: A repeated navigation item that may appear in desktop sidebar, mobile bottom navigation, or More sheet.
- **Language Menu**: Global next-intl locale dropdown rendered by `LanguageSwitcher` and styled through `.language-menu`.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Browser verification shows matching SVG markup and 18px rendered icon boxes for shared navigation labels across affected routes.
- **SC-002**: Language menu computed styles show a light glass background, blur, elevated shadow, and border consistent with auth/cookie surfaces.
- **SC-003**: Local checks pass: lint, typecheck, build, feature-memory guard, and whitespace diff check.
- **SC-004**: GitHub PR checks for baseline, guard, OSV, and AI Review complete successfully before merge readiness.
