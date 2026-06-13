# Feature Spec: Stage 1 For Sale

**Feature Branch**: `codex/stage-1-for-sale`
**Created**: 2026-06-12
**Status**: Local review prep
**Input**: User description: "Execute the next plan step, Stage 1 For Sale, prepare it locally for review, and implement everything from the prototype with the same functional/UI approach as the existing screens."

## Goal

Authenticated Stage 1 users can open a localized mock-first For Sale screen, review wardrobe items marked for sale, understand that they are excluded from capsule/statistics decisions, favorite/unfavorite them from the grid heart, edit item details locally, add an item to the active capsule, or return it to My Items/Uncapsulated using the same premium glass UI and shared interaction patterns already accepted for My Items, Uncapsulated, and Favorites.

## Scope

In scope:

- Add `/{locale}/for-sale` as a Stage 1 review route based on `html-prototypes/for-sale.html`.
- Require the existing mock auth session and redirect unauthenticated users to `/{locale}/auth`.
- Build a serializable For Sale snapshot from existing mock provider profile, wardrobe items, current capsule membership, and category data.
- Ensure deterministic mock fixtures include at least one `for_sale` wardrobe item for the filled prototype state.
- Render the approved For Sale shell: desktop sidebar, profile context, language switcher, title/count, info text, category/color filters, sort dropdown, shared item grid card, grid favorite control, unified detail side panel, toast, mobile bottom nav, and More sheet.
- Support local category/color filtering, sorting, grid favorite toggle, item detail editing, local photo preview upload, Save, Add to Capsule, To My Items, and local Delete.
- Keep all For Sale interactions client-local with no persisted provider writes.
- Expose EN/RU copy only, with no active ES-AR controls.
- Preserve achromatic glass styling, approved wallpaper, responsive mobile-first behavior, and the shared wardrobe card/detail treatment.
- Verify locally before PR creation and stop for user review.

Out of scope:

- Real Supabase persistence, RLS validation, saved status mutation, saved item mutation, or server actions.
- Full For Repair or Profile screens.
- Persisted sale marketplace listing, checkout/payment, storage upload, background removal, semantic search writes, or billing calls.
- Persisted sale marketplace status changes or sold-item archive.
- Mobile Flutter implementation.
- PR creation before user approval.

## User Scenarios & Testing

### User Story 1 - For Sale Inventory (Priority: P1)

As an authenticated user, I want to see items marked for sale so I understand which wardrobe objects are excluded from capsule productivity decisions.

**Why this priority**: US-021 requires a dedicated For Sale section, and the approved prototype centers the screen on items listed for sale.

**Independent Test**: Sign in through `/en/auth`, open `/en/for-sale`, and verify the title, count, info text, filters, navigation context, and at least one for-sale card render from mock fixtures.

**Acceptance Scenarios**:

1. **Given** a mock session exists, **When** `/en/for-sale` loads, **Then** the screen displays profile/navigation context, item count, info text, filters, and item cards for `for_sale` items.
2. **Given** a wardrobe item has status `for_sale`, **When** the For Sale grid renders, **Then** that item appears with the same shared card treatment as My Items, Uncapsulated, and Favorites: photo/fallback, name, category, color dots, brand/source, status badge, and a heart favorite control.
3. **Given** a wardrobe item has any other status, **When** the For Sale grid renders, **Then** it does not appear in the default grid.
4. **Given** the For Sale route is active, **When** desktop and mobile navigation render, **Then** For Sale is shown as the active list destination.

### User Story 2 - Sale Decisions (Priority: P2)

As a user, I want to add a sale item to my active capsule or return it to My Items without leaving the screen.

**Why this priority**: US-021 says users can change their mind and return a for-sale item to My Items.

**Independent Test**: On `/en/for-sale`, open the item detail panel, click Add to Capsule and To My Items in separate page sessions, then verify cards and navigation counts update locally without page reload or provider writes.

**Acceptance Scenarios**:

1. **Given** a for-sale item detail panel is open, **When** To My Items is clicked, **Then** the item leaves For Sale locally, its status becomes `uncapsulated` for preview purposes, and navigation counts update.
2. **Given** a for-sale item detail panel is open and an active capsule exists, **When** Add to Capsule is clicked, **Then** the item leaves For Sale locally, is treated as added to the active capsule in preview state, and visible counts update.
3. **Given** the last item leaves For Sale locally, **When** the grid rerenders, **Then** a localized empty state explains there are no sale listings.
4. **Given** a page reload happens, **When** deterministic mock fixtures reload, **Then** local sale decisions reset because Stage 1 does not persist them.

### User Story 3 - Detail Edit Panel (Priority: P3)

As a Stage 1 reviewer, I want the For Sale detail panel to match the already implemented wardrobe edit behavior so the screen is not a visual-only dead end.

**Why this priority**: The prototype includes a side detail panel with editable fields and actions.

**Independent Test**: Open a for-sale item detail, edit and save fields, validate name errors, use local photo preview, toggle catalog visibility, add to capsule, return to My Items, and delete item in separate page sessions; verify all changes are client-local. Verify favorite/unfavorite from the grid heart only.

**Acceptance Scenarios**:

1. **Given** a for-sale card is visible, **When** it is selected, **Then** an editable detail panel opens with photo fallback/upload control, name, category, colors, brand, material, price, source/status context, sale visibility, capsule context, and actions.
2. **Given** an item detail is open, **When** the user edits fields and saves valid data, **Then** the card and detail state update locally without page reload.
3. **Given** an item detail is open, **When** the user removes the name and saves, **Then** a localized validation error appears and the item is not updated.
4. **Given** an item detail is open, **When** the user uploads a supported JPEG, PNG, or WebP file up to 10 MB, **Then** the detail panel shows a local preview and Save keeps that preview in page state.
5. **Given** an item detail is open, **When** the user toggles catalog visibility, **Then** the local preview updates and no provider write occurs.
6. **Given** an item detail is open, **When** Add to Capsule, To My Items, or Delete is clicked, **Then** the item leaves the For Sale grid locally, visible counts update, and the action is explained with a localized notice.

## Edge Cases

- A user opens `/en/for-sale` without a mock session.
- A user switches between EN and RU on For Sale.
- A mock session has no for-sale items.
- A user filters to zero results.
- A user adds or returns the last for-sale item.
- A user opens an item with no public fixture image.
- A user saves an empty name.
- A user edits category/colors while a category or color filter is active.
- A user uploads an unsupported file type or an image larger than 10 MB.
- The screen is viewed at 375px, tablet, and desktop widths.

## Negative Scenarios

1. **Given** no mock session exists, **When** `/en/for-sale` is requested, **Then** the route redirects to `/en/auth`.
2. **Given** Stage 1 remains mock-first, **When** edit, save, grid favorite toggle, add to capsule, return to My Items, delete item, photo preview upload, or catalog visibility actions are used, **Then** they update client-local preview state only and do not call real Supabase, storage, marketplace, semantic search, Photoroom, or Lava.top providers.
3. **Given** ES-AR is deferred to MVP v2, **When** For Sale language controls render, **Then** only EN and RU are available.
4. **Given** a user adds or returns an item locally, **When** the page is reloaded, **Then** deterministic mock fixtures restore the original for-sale state.

## Requirements

### Functional Requirements

- **FR-001**: For Sale MUST require a mock session and redirect unauthenticated users to `/{locale}/auth`.
- **FR-002**: For Sale MUST replace the `/{locale}/for-sale` future redirect and be reachable from dashboard and wardrobe navigation without a 404.
- **FR-003**: For Sale MUST build data through the mock provider registry and user-scoped wardrobe items.
- **FR-004**: For Sale MUST render only items whose status is `for_sale`.
- **FR-005**: For Sale MUST explain that listed items are not counted in capsules or statistics, and dashboard/My Items/Favorites/Uncapsulated/For Sale wardrobe statistics, recent wardrobe items, My Items grids/counts, and My Items navigation badges MUST exclude `for_sale` items while preserving the separate For Sale list count.
- **FR-006**: Item cards MUST reuse the shared wardrobe grid card and render visual fallback/photo area, item name, category, color dots, brand/source meta, sale/status badges, and the heart favorite control; section-specific capsule/return actions MUST live in the unified detail panel, not in the grid card.
- **FR-007**: Category filters, color filters, and sort controls MUST update the grid client-side without page reload.
- **FR-008**: Item detail MUST allow local editing of name, category, 1-3 color points, brand, material, price, local photo preview, and catalog visibility; initial catalog visibility MUST come from actual public/listing visibility, not merely catalog-source origin.
- **FR-009**: Item detail MUST provide Save, Add to Capsule, To My Items, and Delete actions with localized validation and notices; it MUST NOT duplicate the favorite toggle, which belongs to the grid heart.
- **FR-010**: Returning an item to My Items MUST move it to `uncapsulated` in local preview state, increment the non-sale My Items navigation badge, and update visible counts.
- **FR-011**: Adding an item to a capsule or deleting it MUST remove it from the local For Sale preview and update visible counts; Add to Capsule increments the non-sale My Items badge, while Delete leaves it unchanged.
- **FR-012**: For Sale interactions MUST remain local-only and update visible counts or card state where applicable.
- **FR-013**: For Sale copy MUST be localized through next-intl EN/RU messages and MUST not expose ES-AR.
- **FR-014**: For Sale UI MUST preserve achromatic glass styling and responsive mobile-first behavior.

### Key Entities

- **ForSaleSnapshot**: Serializable server-built setup data containing profile, for-sale items, category options, category/color filters, and navigation counts.
- **ForSaleEntry**: Local/mock wardrobe item preview with `for_sale` status, category, colors, source, favorite marker, catalog visibility, and display fields.
- **LocalForSalePreview**: Client-side state for category/color filtering, sorting, editable detail panel, local photo object URL preview, grid favorite/status/capsule/return/deletion transitions, and notices.

## Success Criteria

### Measurable Outcomes

- **SC-001**: `/en/for-sale` redirects to `/en/auth` without a mock session.
- **SC-002**: Valid mock login can reach `/en/for-sale` from dashboard/list navigation.
- **SC-003**: For Sale renders localized title, count, info text, filters, and at least one for-sale item card from mock fixtures.
- **SC-004**: Category filters, color filters, and sort controls update the grid without page reload.
- **SC-005**: Grid favorite toggle, Add to Capsule, To My Items, Delete, catalog visibility, and detail edit/save/photo interactions update the preview without provider writes.
- **SC-006**: `/ru/for-sale` renders Russian labels and retains `<html lang="ru">`.
- **SC-007**: Desktop and mobile viewport checks show no obvious overlap or horizontal overflow.
- **SC-008**: `npm run preflight` passes.
