# Feature Spec: Stage 1 Favorites

**Feature Branch**: `codex/stage-1-favorites`
**Created**: 2026-06-12
**Status**: Local review prep
**Input**: User description: "Execute the next plan step, Stage 1 Favorites, with no shortcuts. If there is an object edit card, implement it according to the prototype and already implemented functionality. Prepare locally for review before deciding next steps."

## Goal

Authenticated Stage 1 users can open a localized mock-first Favorites screen, review favorite wardrobe and catalog-derived items in the approved two-section layout, filter and sort them with the same controls as My Items, remove favorites locally, add favorite items to the active capsule, delete items locally, and edit favorite item details using the same local detail-card behavior already accepted for wardrobe screens.

## Scope

In scope:

- Add `/{locale}/favorites` as a Stage 1 review route based on `html-prototypes/favorites.html`.
- Require the existing mock auth session and redirect unauthenticated users to `/{locale}/auth`.
- Build a serializable Favorites snapshot from existing mock provider profile, wardrobe items, current capsule membership, and category data.
- Render the approved Favorites shell: desktop sidebar, topbar, language switcher, My Items / From Catalogs tabs, category/color filters, sort dropdown, favorite item grid, shared My Items-style favorite controls, catalog badges, mobile bottom nav, and more sheet.
- Support local tab switching, category/color filtering, sorting, item detail editing, local photo preview upload, local Save, local Remove Favorite, local Add to Capsule, local Delete Item, local Move to Sale, and local Move to Repair.
- Keep all Favorites interactions client-local with no persisted provider writes.
- Expose EN/RU copy only, with no active ES-AR controls.
- Preserve achromatic glass styling, the approved wallpaper, the shared My Items-style favorite treatment, and mobile-first responsive behavior.
- Verify locally before PR creation and stop for user review.

Out of scope:

- Real Supabase persistence, RLS validation, saved favorite mutation, saved item mutation, or server actions.
- Full For Sale, For Repair, or Profile screens.
- Persisted photo upload, storage, background removal, marketplace parsing, semantic search writes, or billing calls.
- Persisted wardrobe deletion from Favorites; this slice may remove the object only from client-local preview state.
- Mobile Flutter implementation.
- PR creation before user approval.

## User Scenarios & Testing

### User Story 1 - Favorites Sections (Priority: P1)

As an authenticated user, I want Favorites split into my own items and catalog-derived items so I can separate personal wardrobe references from external inspiration.

**Why this priority**: The approved prototype centers the Favorites screen on two sections: My Items and From Catalogs.

**Independent Test**: Sign in through `/en/auth`, open `/en/favorites`, and verify the title, favorite count, tabs, category filters, own favorite card, and catalog favorite card render from mock fixtures.

**Acceptance Scenarios**:

1. **Given** a mock session exists, **When** `/en/favorites` loads, **Then** the screen displays profile/navigation context, favorite count, section tabs, filters, and favorite item cards.
2. **Given** a favorite item comes from the user's own wardrobe, **When** the My Items tab is active, **Then** the item appears there and not in From Catalogs.
3. **Given** a favorite item is catalog-derived, **When** the From Catalogs tab is active, **Then** the item appears there with a catalog badge.
4. **Given** favorites are displayed, **When** items render, **Then** they are sorted by most recently updated first.

### User Story 2 - Filtering, Sorting, and Remove Favorite (Priority: P2)

As a user, I want to filter, sort, and remove an item from Favorites without leaving the screen.

**Why this priority**: Favorites is a quick-return list and should stay fast and reversible in Stage 1.

**Independent Test**: Use category/color filters and the sort dropdown on `/en/favorites`, remove a favorite with the active heart, and verify the grid/counts update without page reload or provider writes.

**Acceptance Scenarios**:

1. **Given** favorite cards are visible, **When** a category chip is selected, **Then** only matching favorites in the active section remain visible.
2. **Given** favorite cards are visible, **When** a color filter is selected, **Then** only favorites with matching colors remain visible.
3. **Given** favorite cards are visible, **When** a sort option is selected, **Then** the active section reorders locally without page reload.
4. **Given** a favorite card is visible, **When** the favorite control is clicked, **Then** the item leaves the Favorites grid locally and the favorite count decreases.
5. **Given** a category or color filter has no visible favorites, **When** the grid rerenders, **Then** a localized filtered empty state appears.
6. **Given** the page is reloaded, **When** the mock fixtures are read again, **Then** local favorite removals reset because Stage 1 does not persist them.

### User Story 3 - Detail Edit Card (Priority: P3)

As a Stage 1 reviewer, I want the favorite item detail card to match the already implemented wardrobe edit behavior so Favorites does not become a visual-only dead end.

**Why this priority**: The user explicitly required no shortcut on the edit card, and the screen docs say card click opens detail behavior.

**Independent Test**: Open a favorite detail, edit and save fields, validate name errors, use local photo preview, remove the favorite, add an item to the active capsule, delete an item, and move an item to Sale/Repair in separate page sessions; verify all changes are client-local.

**Acceptance Scenarios**:

1. **Given** a favorite item card is visible, **When** it is selected, **Then** an editable detail panel opens with photo fallback/upload control, name, category, colors, brand, material, price, source, favorite section, and capsule context.
2. **Given** an item detail is open, **When** the user edits fields and saves valid data, **Then** the card and detail state update locally without page reload.
3. **Given** an item detail is open, **When** the user removes the name and saves, **Then** a localized validation error appears and the item is not updated.
4. **Given** an item detail is open, **When** the user uploads a supported JPEG, PNG, or WebP file up to 10 MB, **Then** the detail panel shows a local preview and Save keeps that preview in page state.
5. **Given** an item detail is open, **When** Remove Favorite is clicked, **Then** the item leaves Favorites locally and the detail panel closes.
6. **Given** an item detail is open, **When** Add to Capsule is clicked, **Then** the item is added to the active capsule preview, its local status/counts update, and the action is explained with a localized notice.
7. **Given** an item detail is open, **When** Delete Item is clicked, **Then** the item is removed from local wardrobe preview state, Favorites/navigation counts update, and the detail panel closes.
8. **Given** an item is moved to sale or repair, **When** the action is clicked, **Then** its local status and navigation counts update and the action is explained with a localized notice.

## Edge Cases

- A user opens `/en/favorites` without a mock session.
- A user switches between EN and RU on Favorites.
- A mock session has no favorites.
- A user filters to zero results in either tab.
- A user removes or deletes the last favorite in a tab.
- A user opens an item with no public fixture image.
- A user saves an empty name.
- A user edits category/colors while a category filter is active.
- A user uploads an unsupported file type or an image larger than 10 MB.
- The screen is viewed at 375px, tablet, and desktop widths.

## Negative Scenarios

1. **Given** no mock session exists, **When** `/en/favorites` is requested, **Then** the route redirects to `/en/auth`.
2. **Given** Stage 1 remains mock-first, **When** edit, save, remove favorite, add to capsule, delete item, photo preview upload, sale, or repair actions are used, **Then** they update client-local preview state only and do not call real Supabase, storage, marketplace, semantic search, Photoroom, or Lava.top providers.
3. **Given** ES-AR is deferred to MVP v2, **When** Favorites language controls render, **Then** only EN and RU are available.
4. **Given** a user removes a favorite locally, **When** the page is reloaded, **Then** deterministic mock fixtures restore the original favorite state.

## Requirements

### Functional Requirements

- **FR-001**: Favorites MUST require a mock session and redirect unauthenticated users to `/{locale}/auth`.
- **FR-002**: Favorites MUST replace the `/{locale}/favorites` future redirect and be reachable from dashboard and wardrobe navigation without a 404.
- **FR-003**: Favorites MUST build data through the mock provider registry and user-scoped wardrobe items.
- **FR-004**: Favorites MUST render only favorite items in the grid.
- **FR-005**: Favorites MUST split favorite items into My Items and From Catalogs sections.
- **FR-006**: Favorites MUST render active favorite controls using the same display format as My Items.
- **FR-007**: Favorite item cards MUST render visual fallback/photo area, item name, category, brand/source meta, color dots, source badge, and status badge.
- **FR-008**: Category filters, color filters, and sort controls MUST update the active tab grid client-side without page reload.
- **FR-009**: Item detail MUST allow local editing of name, category, 1-3 color points, brand, material, price, and local photo preview.
- **FR-010**: Item detail MUST provide Save, Remove Favorite, Add to Capsule, Delete Item, Move to Sale, and Move to Repair controls with localized validation and notices.
- **FR-011**: Favorites interactions MUST remain local-only and update visible counts or card state where applicable.
- **FR-012**: Favorites copy MUST be localized through next-intl EN/RU messages and MUST not expose ES-AR.
- **FR-013**: Favorites UI MUST preserve achromatic glass styling and responsive mobile-first behavior.

### Key Entities

- **FavoritesSnapshot**: Serializable server-built setup data containing profile, favorite items, category options, category filters, section totals, and navigation counts.
- **FavoriteEntry**: Local/mock wardrobe item preview with favorite marker, source section, category, colors, source, status, and display fields.
- **LocalFavoritesPreview**: Client-side state for tab switching, category/color filtering, sorting, editable detail panel, local photo object URL preview, local capsule/status transitions, favorite removal, local item deletion, and notices.

## Success Criteria

### Measurable Outcomes

- **SC-001**: `/en/favorites` redirects to `/en/auth` without a mock session.
- **SC-002**: Valid mock login can reach `/en/favorites` from dashboard navigation.
- **SC-003**: Favorites renders localized title, count, tabs, category filters, own favorite card, and catalog favorite card from mock fixtures.
- **SC-004**: Category filters, color filters, sort controls, and section tabs update the grid without page reload.
- **SC-005**: Active heart removal updates the preview and count without provider writes.
- **SC-006**: Detail edit/save/photo/remove/add-to-capsule/delete/sale/repair interactions update the preview without provider writes.
- **SC-007**: `/ru/favorites` renders Russian labels and retains `<html lang="ru">`.
- **SC-008**: Desktop and mobile viewport checks show no obvious overlap or horizontal overflow.
- **SC-009**: `npm run preflight` passes.
