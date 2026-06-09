# Feature Spec: Stage 1 Capsule Result

**Feature Branch**: `codex/stage-1-capsule-result`
**Created**: 2026-06-09
**Status**: Ready for PR
**Input**: User description: "Implement the next plan step: Stage 1 Capsule Result, prepare it locally for review, and wait for approval before creating a PR."

## Goal

Authenticated Stage 1 users can open a localized mock-first Capsule Result after the Guided Journey handoff and review capsule items, static outfits, gap analysis, shopping recommendations, and OPR without real provider calls.

## Scope

In scope:

- Add `/{locale}/capsule-result` as the Stage 1 review route based on `html-prototypes/capsule-result.html`.
- Add `/{locale}/capsule/{id}` as the canonical capsule route shape for mock capsule IDs.
- Require the existing mock auth session and redirect unauthenticated users to `/{locale}/auth`.
- Build a serializable Capsule Result snapshot from mock provider profile, current capsule, wardrobe items, catalog items, categories, palette, and gap analysis.
- Render capsule header, OPR, palette, item grid, static outfit tab, gap analysis tab, and shopping list tab.
- Keep add, remove, replace, and favorite actions client-local with no persisted writes.
- Link the Guided Journey mock creation handoff and dashboard capsule actions to the result screen.
- Expose EN/RU copy only, with no active ES-AR controls.
- Preserve achromatic glass styling, approved wallpaper, and mobile-first responsive behavior.
- Verify locally before PR creation and stop for user review.

Out of scope:

- Real Supabase persistence, RLS validation, saved capsule mutation, or server actions.
- Real outfit generation engine, semantic search prefill execution, marketplace parsing, storage, background removal, or billing calls.
- Full My Items, Favorites, Profile, For Sale, For Repair, or Uncapsulated screens.
- Mobile Flutter implementation.
- PR creation before user approval.

## User Scenarios & Testing

### User Story 1 - Result Overview (Priority: P1)

As an authenticated user, I want to see my generated capsule result so I can understand what the system created.

**Why this priority**: Capsule Result completes the core Dashboard -> Guided Journey -> Result product loop.

**Independent Test**: Sign in through `/en/auth`, open `/en/capsule-result`, and verify the capsule header, palette, OPR, item/outfit/category counts, and items grid render from mock fixtures.

**Acceptance Scenarios**:

1. **Given** a mock session exists, **When** `/en/capsule-result` loads, **Then** the active capsule result displays capsule name, palette dots, item count, outfit count, category count, OPR, and delta.
2. **Given** capsule items exist, **When** the Items tab renders, **Then** a visual grid shows item cards with color dots, favorite controls, action controls, and an Add Item card.
3. **Given** no current capsule exists for a mock session, **When** `/en/capsule-result` loads, **Then** the screen renders a localized empty result state without borrowing another user's fixture data.

### User Story 2 - Result Tabs (Priority: P2)

As a user, I want to switch between items, outfits, missing pieces, and shopping recommendations so I can act on the result.

**Why this priority**: The result screen's value is not only the item grid; outfits, gaps, and shopping impact explain the product methodology.

**Independent Test**: Use the tab controls on `/en/capsule-result` and verify each tab updates without a page reload.

**Acceptance Scenarios**:

1. **Given** the result is visible, **When** the Outfits tab is selected, **Then** static view-only outfit cards render with capsule item layers.
2. **Given** the result is visible, **When** the What's Missing tab is selected, **Then** text-based gaps show category, color hint, priority type, and explanation.
3. **Given** the result is visible, **When** the Shopping List tab is selected, **Then** rows show category, recommended color, priority, outfit impact, and a catalog-search handoff link.

### User Story 3 - Local Capsule Management Preview (Priority: P3)

As a Stage 1 reviewer, I want add/remove/replace/favorite controls to behave locally so management interactions can be reviewed before persistence exists.

**Why this priority**: Capsule management is part of the approved prototype, but Stage 1 must remain mock-first and non-persistent.

**Independent Test**: Toggle favorite, remove an item, add an available compatible item, and replace an item; verify OPR/counts/gaps update locally and reset after reload.

**Acceptance Scenarios**:

1. **Given** an item card is visible, **When** the favorite button is clicked, **Then** its local favorite state toggles without a provider write.
2. **Given** an item action menu is opened, **When** Remove is confirmed, **Then** the item leaves the local capsule preview and OPR/gaps update.
3. **Given** Add or Replace is opened, **When** a compatible fixture item is chosen, **Then** the item is locally added or replaced and the preview recalculates.
4. **Given** an incompatible fixture item is unavailable, **When** the picker renders, **Then** it is disabled with an explanation.

## Edge Cases

- A user opens `/en/capsule-result` without a mock session.
- A user opens `/en/capsule/mock-active` or a different mock id.
- A user switches between EN and RU on the result route.
- The current capsule has zero items but planned categories.
- The current capsule has no gaps after local additions.
- A user removes the last item.
- A user tries to add an item already in the capsule.
- A replacement candidate conflicts with the immutable capsule palette.
- A user navigates client-side to another `?tab=` URL while already on Capsule Result.
- A wardrobe item has `for_sale` or `for_repair` status while Add/Replace picker is open.
- A user follows a Shopping List row into Guided Journey search with category query parameters.
- A provider-sourced gap reason is English while the result route is rendered in RU.
- A mock wardrobe/catalog item references a non-public fixture image.
- The result is viewed at 375px, tablet, and desktop widths.

## Negative Scenarios

1. **Given** no mock session exists, **When** `/en/capsule-result` is requested, **Then** the route redirects to `/en/auth`.
2. **Given** Stage 1 remains mock-first, **When** add/remove/replace/favorite actions are used, **Then** they update client-local preview state only and do not call real Supabase, storage, marketplace, semantic search, Photoroom, or Lava.top providers.
3. **Given** ES-AR is deferred to MVP v2, **When** result language controls render, **Then** only EN and RU are available.
4. **Given** a mock session has no current capsule, **When** Capsule Result loads, **Then** it does not show another fixture user's capsule.
5. **Given** fixture images are not present in `app/public`, **When** item cards render, **Then** they use a designed fallback instead of broken images.

## Requirements

### Functional Requirements

- **FR-001**: Capsule Result MUST require a mock session and redirect unauthenticated users to `/{locale}/auth`.
- **FR-002**: Capsule Result MUST be reachable from Guided Journey mock creation and dashboard capsule navigation without a 404.
- **FR-003**: Capsule Result MUST build data through the mock provider registry and user-scoped current capsule.
- **FR-004**: Capsule Result MUST render capsule header, palette, OPR, delta, item count, outfit count, and category count.
- **FR-005**: Items tab MUST render visual item cards with color dots, favorite controls, local action controls, and an Add Item card.
- **FR-006**: Outfits tab MUST render static view-only outfit combinations derived from current local capsule items.
- **FR-007**: Gap Analysis tab MUST render text-based category + color recommendations or a complete-capsule empty state.
- **FR-008**: Shopping List tab MUST render category, color, priority, and impact rows with a catalog-search handoff link.
- **FR-009**: Add/remove/replace/favorite interactions MUST remain local-only and recalculate visible counts, OPR, gaps, and shopping rows.
- **FR-010**: Replacement and addition candidates MUST be validated against the immutable capsule palette.
- **FR-011**: Result copy MUST be localized through next-intl EN/RU messages and MUST not expose ES-AR.
- **FR-012**: Result UI MUST preserve achromatic glass styling and responsive mobile-first behavior.
- **FR-013**: The canonical `/{locale}/capsule/{id}` route MUST render the same mock result for the current capsule ID and reject unknown IDs with a safe dashboard redirect or not-found state.
- **FR-014**: Add/Replace picker candidates MUST exclude `for_sale` and `for_repair` wardrobe items until those items are restored to an eligible wardrobe status.
- **FR-015**: Capsule Result tabs MUST stay synchronized with the current `?tab=` query during client-side navigation on the same route.
- **FR-016**: Shopping List handoff links MUST open the Guided Journey search context promised by their query parameters.
- **FR-017**: RU Capsule Result copy MUST not render English provider gap reason text for known Stage 1 fixture gaps.

### Key Entities

- **CapsuleResultSnapshot**: Serializable server-built setup data containing profile, current capsule, category plans, capsule items, available candidates, palette colors, and initial gaps.
- **CapsuleResultItem**: Local/mock item preview sourced from wardrobe or catalog fixtures with category, colors, source, and favorite state.
- **CapsuleResultGap**: Derived category + color recommendation with priority type, impact, and explanation.
- **LocalCapsulePreview**: Client-side result state for item membership, favorites, action menus, picker mode, and preview recalculation.

## Success Criteria

### Measurable Outcomes

- **SC-001**: `/en/capsule-result` redirects to `/en/auth` without a mock session.
- **SC-002**: Valid mock login can reach `/en/capsule-result` from dashboard and from Guided Journey mock creation.
- **SC-003**: Capsule header renders OPR in `X.X` format plus item, outfit, and category counts.
- **SC-004**: Items, Outfits, What's Missing, and Shopping List tabs render and switch without page reload.
- **SC-005**: Local remove/add/replace/favorite interactions update the preview without provider writes.
- **SC-006**: `/ru/capsule-result` renders Russian labels and retains `<html lang="ru">`.
- **SC-007**: Desktop and mobile viewport checks show no obvious overlap or horizontal overflow.
- **SC-008**: `npm run preflight` passes.
- **SC-009**: `git diff --check` passes.
- **SC-010**: `npm run check:feature-memory -- --worktree` passes.
