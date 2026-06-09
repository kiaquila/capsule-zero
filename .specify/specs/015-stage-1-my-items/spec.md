# Feature Spec: Stage 1 My Items

**Feature Branch**: `codex/stage-1-my-items`
**Created**: 2026-06-09
**Status**: Local review
**Input**: User description: "Execute the next plan step: Stage 1 My Items / Wardrobe Grid, prepare it locally for review, and wait for approval before creating a PR."

## Goal

Authenticated Stage 1 users can open a localized mock-first My Items screen, review their wardrobe grid, filter and sort items, open item details, and preview local edit/favorite/status actions without real provider calls.

## Scope

In scope:

- Add `/{locale}/my-items` as the Stage 1 review route based on `html-prototypes/my-items.html`.
- Require the existing mock auth session and redirect unauthenticated users to `/{locale}/auth`.
- Build a serializable My Items snapshot from mock provider profile, wardrobe items, current capsule, and categories.
- Render the approved wardrobe shell: desktop sidebar, topbar, language switcher, add item action, filter controls, item card grid, detail panel, mobile bottom nav, and more sheet.
- Support category and color filtering, sort by name/category/recent/price, item detail view, editable required fields, max three color dots, favorite toggles, and local move-to-sale/repair preview.
- Keep add, edit, favorite, and status transitions client-local with no persisted writes.
- Expose EN/RU copy only, with no active ES-AR controls.
- Preserve achromatic glass styling, approved wallpaper, and mobile-first responsive behavior.
- Verify locally before PR creation and stop for user review.

Out of scope:

- Real Supabase persistence, RLS validation, saved item mutation, or server actions.
- Real photo upload, storage, background removal, marketplace parsing, semantic search, or billing calls.
- Full Favorites, Profile, For Sale, For Repair, or Uncapsulated screens.
- Mobile Flutter implementation.
- PR creation before user approval.

## User Scenarios & Testing

### User Story 1 - Wardrobe Grid (Priority: P1)

As an authenticated user, I want to see all my wardrobe items in a visual grid so I can understand what I already own.

**Why this priority**: My Items is the wardrobe foundation for later favorites, uncapsulated, sale, repair, and photo-upload slices.

**Independent Test**: Sign in through `/en/auth`, open `/en/my-items`, and verify the title, item count, filter controls, and item cards render from mock fixtures.

**Acceptance Scenarios**:

1. **Given** a mock session exists, **When** `/en/my-items` loads, **Then** the screen displays profile/navigation context, wardrobe item count, filter/sort controls, and visual item cards.
2. **Given** wardrobe items exist, **When** the grid renders, **Then** each item card shows name, category, color dots, brand/source meta, favorite control, and capsule membership indicator when applicable.
3. **Given** no wardrobe items exist for a mock session, **When** `/en/my-items` loads, **Then** the screen renders a localized empty state without borrowing another user's fixture data.

### User Story 2 - Filtering and Sorting (Priority: P2)

As a user, I want to filter and sort my wardrobe so repeated wardrobe management stays fast.

**Why this priority**: The approved My Items prototype is a management surface, not just a static gallery.

**Independent Test**: Use category and color filters plus sort controls on `/en/my-items` and verify the visible grid updates without a page reload.

**Acceptance Scenarios**:

1. **Given** the grid is visible, **When** a category chip is selected, **Then** only matching items remain visible.
2. **Given** the grid is visible, **When** a color filter is selected, **Then** only items containing that color remain visible.
3. **Given** a sort option is selected, **When** the grid rerenders, **Then** item order follows the selected name/category/recent/price sort.

### User Story 3 - Local Item Management Preview (Priority: P3)

As a Stage 1 reviewer, I want item detail and edit controls to behave locally so the wardrobe management UX can be reviewed before persistence exists.

**Why this priority**: Item detail/edit behavior is part of US-007 and becomes the interaction base for later real item persistence.

**Independent Test**: Open an item detail, toggle favorite, edit name/category/colors, add a new local item, and move an item to sale/repair; verify all updates are local and reset after reload.

**Acceptance Scenarios**:

1. **Given** an item card is visible, **When** it is selected, **Then** a detail panel opens with photo fallback, name, category, colors, brand, material, price, capsule membership, and local actions.
2. **Given** the detail panel is in edit mode, **When** required fields are missing, **Then** save is blocked with localized validation.
3. **Given** a valid edit or add action is submitted, **When** the form saves, **Then** the grid updates locally without a provider write.
4. **Given** an existing item is moved to sale or repair, **When** the action is clicked, **Then** its local status updates, capsule membership is cleared from the preview, counts update, and the action is explained with a localized notice.

## Edge Cases

- A user opens `/en/my-items` without a mock session.
- A user switches between EN and RU on My Items.
- A mock session has no wardrobe items.
- A user filters to zero results.
- A user combines category and color filters.
- A user enters a very long item name.
- A user removes color dots until one color remains.
- A user tries to save without name, category, or colors.
- A user adds more than three colors.
- A user moves a capsule item to sale or repair.
- A mock item references a non-public fixture image.
- The screen is viewed at 375px, tablet, and desktop widths.

## Negative Scenarios

1. **Given** no mock session exists, **When** `/en/my-items` is requested, **Then** the route redirects to `/en/auth`.
2. **Given** Stage 1 remains mock-first, **When** add/edit/favorite/status actions are used, **Then** they update client-local preview state only and do not call real Supabase, storage, marketplace, semantic search, Photoroom, or Lava.top providers.
3. **Given** ES-AR is deferred to MVP v2, **When** My Items language controls render, **Then** only EN and RU are available.
4. **Given** a mock session has no wardrobe items, **When** My Items loads, **Then** it does not show another fixture user's wardrobe.
5. **Given** fixture images are not present in `app/public`, **When** item cards render, **Then** they use a designed fallback instead of broken images.

## Requirements

### Functional Requirements

- **FR-001**: My Items MUST require a mock session and redirect unauthenticated users to `/{locale}/auth`.
- **FR-002**: My Items MUST replace the `/{locale}/my-items` future redirect and be reachable from dashboard and capsule result navigation without a 404.
- **FR-003**: My Items MUST build data through the mock provider registry and user-scoped wardrobe items.
- **FR-004**: My Items MUST render profile context, navigation counts, title, item count, filters, sort controls, and item grid.
- **FR-005**: Item cards MUST render visual fallback/photo area, item name, category, brand/source meta, color dots, favorite control, and capsule badge when applicable.
- **FR-006**: Category and color filters MUST update the grid client-side without page reload.
- **FR-007**: Sorting MUST support name, category, recent, and price.
- **FR-008**: Item detail MUST show editable name, category, colors, brand, material, price, and capsule membership.
- **FR-009**: Add/edit/favorite/status interactions MUST remain local-only and update visible counts.
- **FR-010**: Edit validation MUST require name, category, and at least one color, with no more than three colors.
- **FR-011**: Moving an item to sale or repair MUST clear local capsule membership from that preview.
- **FR-012**: My Items copy MUST be localized through next-intl EN/RU messages and MUST not expose ES-AR.
- **FR-013**: My Items UI MUST preserve achromatic glass styling and responsive mobile-first behavior.

### Key Entities

- **MyItemsSnapshot**: Serializable server-built setup data containing profile, current capsule context, wardrobe items, category filters, color filters, and navigation counts.
- **MyItemsEntry**: Local/mock wardrobe item preview with category, colors, source, favorite, status, capsule membership, and editable display fields.
- **LocalWardrobePreview**: Client-side My Items state for filters, sorting, item edits, favorite toggles, status transitions, detail panel, and notices.

## Success Criteria

### Measurable Outcomes

- **SC-001**: `/en/my-items` redirects to `/en/auth` without a mock session.
- **SC-002**: Valid mock login can reach `/en/my-items` from dashboard navigation.
- **SC-003**: My Items renders localized title, item count, filters, sort control, and item cards from mock fixtures.
- **SC-004**: Category/color filters and sort controls update the grid without page reload.
- **SC-005**: Detail/edit/add/favorite/sale/repair interactions update the preview without provider writes.
- **SC-006**: `/ru/my-items` renders Russian labels and retains `<html lang="ru">`.
- **SC-007**: Desktop and mobile viewport checks show no obvious overlap or horizontal overflow.
- **SC-008**: `npm run preflight` passes.
- **SC-009**: `git diff --check` passes.
- **SC-010**: `npm run check:feature-memory -- --worktree` passes.
