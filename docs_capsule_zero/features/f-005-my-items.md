# Feature: My Items (Grid & Edit)

## MVP algorithm contract — required before release (2026-10-21)

Keep owned complex/decorated/dated items and favourites. Low simplicity alone must not prevent saving or capsule membership under existing palette rules. Required cut tags and review state remain independent of the image; missing tags offer confirmation/review or a reviewed preset alternative, without claiming compatibility.

Owned-item cut review is actionable: separate owner-guided reference comparison, ambiguous-item request to the designated catalog reviewer, persisted evidence/outcome, then shared recalculation. Follow methodology §6.1; no blind “mark current” override or permanent preset-only dead end.

Authority: [PRODUCT-PLAN D4/Q5](../../PRODUCT-PLAN.md); attributes: [methodology §6.1](../project/methodology/capsule-methodology.md);
whole-look, counting, versioning and quality rules: [outfit generation §2.5](../project/methodology/outfit-generation.md).

> Source: US-006, US-007 (spec.md). Prototype: `html-prototypes/my-items.html`

## Overview

- **Purpose:** Visual wardrobe grid — see all items, filter, edit details
- **User:** Authenticated user with items
- **Entry point:** `/my-items` (from Dashboard)
- **Emotional target:** SATISFACTION — "Each item is in its place — and I can manage it"

## User Flow — Grid View

1. User navigates to My Items from Dashboard
2. Grid of item cards displayed: name in header + photo + color dots
3. Each card shows capsule membership indicator
4. User can filter by category and color
5. Click on card → navigates to detail view

## User Flow — Edit

1. User clicks Edit button on item detail card
2. Editable fields: name, photo, category, color dots, brand, material/composition, price
3. User modifies fields
4. Save → changes persist without page reload
5. Required fields (name, category, color dots) highlighted if missing

## Interface States

| State         | Description      | What user sees                       |
| ------------- | ---------------- | ------------------------------------ |
| Grid default  | Items loaded     | Cards with photos, names, color dots |
| Grid filtered | Filters applied  | Filtered subset of items             |
| Grid empty    | No items yet     | Empty state with CTA to add items    |
| Detail view   | Card clicked     | Full item detail card                |
| Edit mode     | Edit clicked     | Editable fields with save/cancel     |
| Saving        | Save in progress | Disabled save button                 |

## Acceptance Criteria

1. Grid cards show: name in header + photo + color dots
2. Capsule membership indicator visible on each card
3. Click on card → detail view
4. Filter by category and color
5. Edit mode: name, photo, category, color dots, brand, material/composition, price
6. Save without page reload
7. Name + category + color dots required (highlighted if missing)

## Key Components

- **ItemGrid** — responsive grid of ItemCards
- **ItemCard** — photo + name + color dots + capsule badge
- **ItemDetail** — full detail view with all fields
- **ItemEditForm** — inline editing with validation
- **FilterBar** — category and color filters

## Edge Cases

- No photo → placeholder image
- Very long item name → truncate with tooltip
- 3 color dots maximum → prevent adding more
- Item in capsule → show capsule name badge
- Item in multiple states → show primary state

## Related Features

- f-006-guided-journey.md — Items added during journey
- f-011-photo-upload.md — Photo upload mechanics
- f-009-capsule-result.md — Capsule membership

## Saved guest presets (spec 056)

Explicit account-save appends the selected own-image presets as durable `uncapsulated` wardrobe entries. Repeated or overlapping transfers deduplicate by account and preset without resetting prior status/favorite. My Items and status/favorite lists consume the existing wardrobe port projection; these entries and their status/favorite changes persist in PostgreSQL. This does not claim migration of the other fixture-backed wardrobe domains.

Saved guest preset records expose durable favorite and status actions. Metadata/photo/color edits, deletion and formal capsule membership are unavailable for these records until the corresponding account domains persist them; the shared detail panel renders them read-only.
