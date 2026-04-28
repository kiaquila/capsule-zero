# Feature: Wardrobe Management (Uncapsulated / For Sale / For Repair)

> Source: US-020, US-021, US-024 (spec.md). Prototypes: `html-prototypes/uncapsulated.html`, `html-prototypes/for-sale.html`, `html-prototypes/for-repair.html`

## Overview
- **Purpose:** Manage items across lifecycle states — uncapsulated, for sale, for repair
- **User:** Authenticated user managing wardrobe
- **Entry points:** `/uncapsulated`, `/for-sale`, `/for-repair` (from Dashboard)

## Uncapsulated (US-020)

**Emotional target:** "These items await their destiny — and that's normal"

### User Flow
1. User navigates to Uncapsulated from Dashboard
2. Grid shows items not assigned to any capsule
3. For each item, actions: Add to capsule / Move to For Sale / Move to For Repair
4. Filter by category

### Acceptance Criteria
- Shows items not in any capsule
- Actions: add to capsule, move to For Sale, move to For Repair
- Filter by category

## For Sale (US-021)

### User Flow
1. User marks item as "For Sale" (from Uncapsulated or My Items)
2. Item moves to For Sale section
3. Item excluded from capsules and wardrobe statistics
4. User can return item to My Items if they change their mind

### Acceptance Criteria
- Item moves to For Sale section on action
- Not counted in capsules or statistics
- Can return to My Items

## For Repair (US-024)

### User Flow
1. User marks item as "For Repair" (from any section)
2. Item moves to For Repair section
3. Item excluded from capsules and statistics
4. If item was in a capsule → removed from capsule, outfits recomputed
5. When fixed → return to My Items or Uncapsulated

### Acceptance Criteria
- Item moves to For Repair on action
- Not counted in capsules or statistics
- If was in capsule → removed, outfits recomputed
- Can return to My Items or Uncapsulated when fixed

## Interface States (shared pattern)

| State | Description | What user sees |
|-------|------------|----------------|
| Default | Items loaded | Grid of items with action buttons |
| Empty | No items in section | Empty state: "No items here" |
| Filtered | Category filter applied | Filtered subset |
| Moving | Item being moved | Loading indicator, item disappears from grid |

## Key Components
- **WardrobeGrid** — reusable grid with section-specific actions
- **ItemActions** — context-specific action buttons per section
- **MoveConfirmation** — confirmation when moving between sections
- **CategoryFilter** — filter dropdown/chips

## Edge Cases
- Move item from capsule to repair → capsule outfits recomputed immediately
- Move item back from sale/repair → goes to Uncapsulated, not back to capsule
- Bulk operations → not in v0.1 (one at a time)

## Related Features
- f-003-dashboard.md — All sections accessible from dashboard
- f-005-my-items.md — Source of items
- f-010-capsule-management.md — Remove from capsule → Uncapsulated
