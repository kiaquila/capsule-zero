# Feature Specification: Stage 1 For Repair

**Feature Branch**: `codex/stage-1-for-repair`
**Created**: 2026-06-14
**Status**: Ready for Local Review
**Input**: User description: "Execute the next plan item: Stage 1 For Repair, prepare it for local review, reuse existing UI elements, and make every prototype interaction work."

## Goal _(mandatory)_

Authenticated users can manage items marked for repair in a local Stage 1 screen that excludes those items from capsule and wardrobe statistics until they are fixed.

## Scope _(mandatory)_

In scope:

- `/{locale}/for-repair` authenticated route.
- For Repair grid, favorite toggle, shared detail edit panel, repair notes, local photo preview, save, delete, and Mark as Fixed.
- EN/RU messages only; ES-AR remains inactive for MVP v1.
- Shared wardrobe item card, detail panel, navigation, and statistic helper behavior.

Out of scope:

- Provider-backed persistence for repair notes or status writes.
- Profile screen implementation.
- Real repair service integrations, reminders, or bulk repair operations.
- ES-AR routing, controls, or generated client changes.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Review Repair Items (Priority: P1)

An authenticated user opens For Repair and sees only items currently marked for repair.

**Why this priority**: This is the core screen promise for US-024.

**Independent Test**: Log in with the mock session and open `/en/for-repair`; the page shows repair items, count, information note, filters, and navigation.

**Acceptance Scenarios**:

1. **Given** an authenticated session, **When** the user visits `/en/for-repair`, **Then** the For Repair screen renders with only `for_repair` items.
2. **Given** repair items exist, **When** the page renders, **Then** For Repair count matches the displayed repair items and the navigation badge.

---

### User Story 2 - Maintain Repair Item Details (Priority: P1)

The user can edit a repair item locally, including notes and photo preview, without new one-off item UI.

**Why this priority**: The approved prototype includes a detail editor, save action, favorite toggle, and delete action.

**Independent Test**: Open a repair item, edit required fields or notes, save, and observe the updated card/detail state and toast.

**Acceptance Scenarios**:

1. **Given** a repair item detail panel, **When** the user edits valid details and saves, **Then** the item updates locally and shows a saved notice.
2. **Given** a repair item, **When** the user toggles favorite, **Then** the item favorite state and Favorites count update locally.
3. **Given** a repair item detail panel, **When** the user chooses Delete, **Then** the item is removed from For Repair and counts update.

---

### User Story 3 - Mark Item Fixed (Priority: P1)

The user can mark a repair item as fixed and return it to the wardrobe outside capsules.

**Why this priority**: US-024 requires repair items to return to My Items or Uncapsulated when fixed.

**Independent Test**: Use the detail Mark as Fixed action and verify the item leaves For Repair while My Items and Uncapsulated counts increase.

**Acceptance Scenarios**:

1. **Given** a repair item, **When** the user marks it fixed, **Then** it leaves For Repair.
2. **Given** a fixed repair item, **When** it leaves For Repair, **Then** it returns to the non-capsule wardrobe count without rejoining any capsule.

### Edge Cases

- A repair item without a public image uses the shared wardrobe fallback visual.
- Empty or filtered For Repair state shows the existing shared empty-state pattern.
- Local photo preview rejects unsupported or oversized files with the yellow error pattern.
- If a previously-capsule item is moved to repair from another screen, it is removed from capsules by that transition and excluded from statistics while in repair.

## Negative Scenarios _(mandatory — required by SENAR; waive explicitly if none apply)_

1. **Given** no authenticated mock session, **When** `/en/for-repair` is requested, **Then** the route redirects to `/en/auth` instead of exposing the screen.
2. **Given** an unsupported local photo type, **When** a user attempts to preview it, **Then** the item is not updated and an inline validation error is shown.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST expose `/{locale}/for-repair` for authenticated users.
- **FR-002**: System MUST redirect unauthenticated users to localized auth.
- **FR-003**: System MUST show only items whose status is `for_repair`.
- **FR-004**: System MUST exclude `for_repair` items from My Items/wardrobe statistics while keeping a separate For Repair count.
- **FR-005**: Users MUST be able to toggle favorite state locally.
- **FR-006**: Users MUST be able to edit repair item fields through the shared wardrobe detail panel.
- **FR-007**: Users MUST be able to enter and save local repair notes.
- **FR-008**: Users MUST be able to add a local JPEG/PNG/WebP photo preview up to 10 MB.
- **FR-009**: Users MUST be able to delete a repair item locally.
- **FR-010**: Users MUST be able to mark a repair item fixed, removing it from For Repair and returning it to Uncapsulated.
- **FR-011**: System MUST provide EN and RU messages with no active ES-AR controls.
- **FR-012**: System MUST reuse the established wardrobe card/detail surfaces instead of introducing a new item card or editor pattern.

### Key Entities

- **Repair Item**: A wardrobe item with status `for_repair`, shown in the For Repair screen and excluded from capsule/statistic counts.
- **Repair Note**: A local Stage 1 text note attached to the current UI session for a repair item.
- **Wardrobe Navigation Counts**: Local counts for My Items, Favorites, For Sale, For Repair, and Uncapsulated.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: For Repair page renders successfully in EN and RU for authenticated mock users.
- **SC-002**: For Repair shows zero ES-AR active route or switcher controls.
- **SC-003**: Repair items are absent from My Items/dashboard wardrobe-statistic totals while still counted in For Repair.
- **SC-004**: Save, favorite, delete, local photo validation, and Mark as Fixed are manually verifiable in a browser at desktop and mobile widths.
