# Feature Spec: Stage 1 Uncapsulated

**Feature Branch**: `codex/stage-1-uncapsulated`
**Created**: 2026-06-11
**Status**: Open PR review fix
**Input**: User description: "Execute the next plan step: Stage 1 Uncapsulated, prepare it locally for review, and wait for approval before creating a PR."

## Goal

Authenticated Stage 1 users can open a localized mock-first Uncapsulated screen, see wardrobe items that are not in any capsule, filter them by category, edit item details locally, and preview local add-to-capsule, sale, repair, and delete decisions.

## Scope

In scope:

- Add `/{locale}/uncapsulated` as a Stage 1 review route based on `html-prototypes/uncapsulated.html`.
- Require the existing mock auth session and redirect unauthenticated users to `/{locale}/auth`.
- Build a serializable Uncapsulated snapshot from existing mock provider profile, wardrobe items, current capsule, and category data.
- Render the approved wardrobe shell: desktop sidebar, topbar, language switcher, category filter, uncapsulated item grid, editable item detail panel, local action controls, mobile bottom nav, and more sheet.
- Support category filtering, detail edit view, local photo preview upload, local save, local delete, local add-to-capsule preview, local move-to-sale preview, and local move-to-repair preview.
- Keep add-to-capsule and status transitions client-local with no persisted writes.
- Expose EN/RU copy only, with no active ES-AR controls.
- Preserve achromatic glass styling, approved wallpaper, and mobile-first responsive behavior.
- Verify locally before PR creation and stop for user review.

Out of scope:

- Real Supabase persistence, RLS validation, saved capsule mutation, saved status mutation, or server actions.
- Full For Sale, For Repair, Favorites, or Profile screens.
- Persisted photo upload, storage, background removal, marketplace parsing, semantic search, or billing calls.
- Recomputing persisted outfits after local add-to-capsule or repair transitions.
- Mobile Flutter implementation.
- PR creation before user approval.

## User Scenarios & Testing

### User Story 1 - Uncapsulated Grid (Priority: P1)

As an authenticated user, I want to see items that are not assigned to any capsule so I can decide what should happen to them.

**Why this priority**: Uncapsulated is the decision queue between My Items, capsule management, sale, and repair.

**Independent Test**: Sign in through `/en/auth`, open `/en/uncapsulated`, and verify the title, uncapsulated count, category filter, and uncapsulated fixture card render from mock fixtures.

**Acceptance Scenarios**:

1. **Given** a mock session exists, **When** `/en/uncapsulated` loads, **Then** the screen displays profile/navigation context, uncapsulated item count, category filters, and item cards for items not in any capsule.
2. **Given** wardrobe items exist in active capsule, sale, or repair states, **When** Uncapsulated renders, **Then** those items do not appear in the grid.
3. **Given** no uncapsulated items exist for a mock session, **When** `/en/uncapsulated` loads, **Then** the screen renders a localized empty state without borrowing another user's fixture data.

### User Story 2 - Category Filtering (Priority: P2)

As a user, I want to filter uncapsulated items by category so I can make focused decisions quickly.

**Why this priority**: The approved Uncapsulated prototype keeps this screen lightweight and category-driven.

**Independent Test**: Use category filters on `/en/uncapsulated` and verify the visible grid updates without a page reload.

**Acceptance Scenarios**:

1. **Given** uncapsulated items are visible, **When** a category chip is selected, **Then** only matching uncapsulated items remain visible.
2. **Given** a category filter has no visible items after local actions, **When** the grid rerenders, **Then** a localized filtered empty state appears.

### User Story 3 - Local Decision Preview (Priority: P3)

As a Stage 1 reviewer, I want action controls to behave locally so the wardrobe decision flow can be reviewed before persistence exists.

**Why this priority**: Add-to-capsule, sale, and repair actions define the lifecycle behavior reused by later persisted screens.

**Independent Test**: Open an uncapsulated item detail, edit and save fields, validate name errors, upload a local photo preview, delete the item, add it to the active capsule preview, move it to For Sale, and move it to For Repair in separate page sessions; verify local state updates without provider writes.

**Acceptance Scenarios**:

1. **Given** an uncapsulated item card is visible, **When** it is selected, **Then** an editable detail panel opens with photo fallback/upload control, name, category, colors, brand, material, price, and source/no-capsule context.
2. **Given** an item detail is open, **When** the user edits fields and saves valid data, **Then** the card and detail state update locally without page reload.
3. **Given** an item detail is open, **When** the user removes the name and saves, **Then** a localized validation error appears and the item is not updated.
4. **Given** an item detail is open, **When** the user uploads a supported JPEG, PNG, or WebP file up to 10 MB, **Then** the detail panel shows a local preview and Save keeps that preview in the local page state.
5. **Given** an item detail is open, **When** Delete is clicked, **Then** the item leaves the uncapsulated grid locally and My Items / Uncapsulated navigation counts decrease.
6. **Given** an active capsule exists, **When** Add to Capsule is confirmed, **Then** the item leaves the uncapsulated grid locally, the uncapsulated count decreases, and the notice names the target capsule.
7. **Given** an uncapsulated item is moved to sale or repair, **When** the action is clicked, **Then** the item leaves the grid locally, the matching navigation count increases, and the action is explained with a localized notice.
8. **Given** the page is reloaded, **When** the mock fixtures are read again, **Then** local edits and decisions reset because Stage 1 does not persist them.

## Edge Cases

- A user opens `/en/uncapsulated` without a mock session.
- A user switches between EN and RU on Uncapsulated.
- A mock session has no uncapsulated wardrobe items.
- A user filters to zero results.
- A user performs an action while a category filter is active.
- A user opens an item with no public fixture image.
- A user saves an empty name.
- A user edits category/colors while a category filter is active.
- A user uploads an unsupported file type or an image larger than 10 MB.
- A user opens Add to Capsule when no active capsule exists.
- The screen is viewed at 375px, tablet, and desktop widths.

## Negative Scenarios

1. **Given** no mock session exists, **When** `/en/uncapsulated` is requested, **Then** the route redirects to `/en/auth`.
2. **Given** Stage 1 remains mock-first, **When** edit, save, delete, photo preview upload, add-to-capsule, sale, or repair actions are used, **Then** they update client-local preview state only and do not call real Supabase, storage, marketplace, semantic search, Photoroom, or Lava.top providers.
3. **Given** ES-AR is deferred to MVP v2, **When** Uncapsulated language controls render, **Then** only EN and RU are available.
4. **Given** an item belongs to the current capsule or is already for sale/repair, **When** Uncapsulated renders, **Then** that item is excluded from the grid.

## Requirements

### Functional Requirements

- **FR-001**: Uncapsulated MUST require a mock session and redirect unauthenticated users to `/{locale}/auth`.
- **FR-002**: Uncapsulated MUST replace the `/{locale}/uncapsulated` future redirect and be reachable from dashboard, My Items, and capsule navigation without a 404.
- **FR-003**: Uncapsulated MUST build data through the mock provider registry and user-scoped wardrobe items.
- **FR-004**: Uncapsulated MUST render only items with no capsule membership and uncapsulated status.
- **FR-005**: Uncapsulated MUST render profile context, navigation counts, title, count, category filters, and item grid.
- **FR-006**: Item cards MUST render visual fallback/photo area, item name, category, brand/source meta, color dots, and local action controls.
- **FR-007**: Category filters MUST update the grid client-side without page reload.
- **FR-008**: Item detail MUST allow local editing of name, category, 1-3 color points, brand, material, price, and local photo preview.
- **FR-009**: Item detail MUST provide Save and Delete controls with localized validation and notices.
- **FR-010**: Add-to-capsule, sale, repair, edit, delete, and photo preview interactions MUST remain local-only and update visible counts or card state where applicable.
- **FR-011**: Add-to-capsule MUST explain the target active capsule, or explain that no active capsule is available.
- **FR-012**: Uncapsulated copy MUST be localized through next-intl EN/RU messages and MUST not expose ES-AR.
- **FR-013**: Uncapsulated UI MUST preserve achromatic glass styling and responsive mobile-first behavior.
- **FR-014**: Add-to-capsule confirmation UI MUST use the approved transparent glass treatment and MUST NOT render as an opaque dark modal.

### Key Entities

- **UncapsulatedSnapshot**: Serializable server-built setup data containing profile, uncapsulated items, category filters, active capsule option, and navigation counts.
- **UncapsulatedEntry**: Local/mock wardrobe item preview with category, colors, source, status, no capsule membership, and display fields.
- **LocalDecisionPreview**: Client-side Uncapsulated state for category filtering, editable detail panel, local photo object URL preview, add-to-capsule preview, status transitions, delete, and notices.

## Success Criteria

### Measurable Outcomes

- **SC-001**: `/en/uncapsulated` redirects to `/en/auth` without a mock session.
- **SC-002**: Valid mock login can reach `/en/uncapsulated` from dashboard navigation.
- **SC-003**: Uncapsulated renders localized title, item count, category filters, and only uncapsulated item cards from mock fixtures.
- **SC-004**: Category filters update the grid without page reload.
- **SC-005**: Detail edit/save/delete/photo/add-to-capsule/sale/repair interactions update the preview without provider writes.
- **SC-006**: `/ru/uncapsulated` renders Russian labels and retains `<html lang="ru">`.
- **SC-007**: Desktop and mobile viewport checks show no obvious overlap or horizontal overflow.
- **SC-008**: `npm run preflight` passes.
- **SC-009**: `git diff --check` passes.
- **SC-010**: `npm run check:feature-memory -- --worktree` passes.
