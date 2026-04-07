# Feature: Capsule Management (Add / Remove / Replace)

> Source: US-014, US-015, US-016 (spec.md). Prototype: `html-prototypes/capsule-result.html`

## Overview
- **Purpose:** Modify capsule composition — add, remove, or replace items
- **User:** User managing an existing capsule
- **Entry point:** Actions on items within Capsule Result screen

## User Flow — Remove Item (US-014)
1. User clicks Remove on an item in capsule
2. Confirmation dialog shown
3. On confirm → item moves to Uncapsulated
4. Outfits and gap analysis recomputed
5. OPR recalculated with delta shown

## User Flow — Replace Item (US-015)
1. User clicks Replace on an item
2. Selection UI: choose from My Items, shared DB, or upload new
3. Replacement item color validated against capsule palette
4. If incompatible → blocked with recommendation for separate capsule
5. On success → replaced item goes to Uncapsulated, outfits recomputed

## User Flow — Add Item (US-016)
1. User clicks "Add item" on capsule view
2. Selection UI: choose from My Items, shared DB, or upload new
3. New item color validated against capsule palette
4. If incompatible → blocked with recommendation
5. On success → outfits recomputed, OPR updated

## Interface States

| State | Description | What user sees |
|-------|------------|----------------|
| Default | Capsule items displayed | Item cards with action buttons |
| Remove confirm | Delete dialog | "Remove from capsule?" confirmation |
| Item picker | Add/Replace mode | Selection from My Items / Catalog / Upload |
| Validating | Color check | Loading indicator |
| Compatibility error | Color mismatch | Block message + recommendation |
| Recomputing | Outfits regenerating | Loading state on outfit tab |
| Updated | Changes saved | Updated grid + new OPR with delta |

## Acceptance Criteria

### Remove
1. Confirmation dialog before removal
2. Removed item moves to Uncapsulated
3. Outfits and gap analysis recomputed

### Replace
1. Selection from My Items, shared DB, or upload
2. Color compatibility validated against palette
3. Incompatible replacement blocked with recommendation
4. Replaced item goes to Uncapsulated, outfits recomputed

### Add
1. Selection from My Items, shared DB, or upload
2. Color must be compatible with capsule palette
3. Incompatible item blocked with recommendation
4. Outfits recomputed on addition

## Key Components
- **ItemActions** — remove/replace action buttons on each item
- **ItemPicker** — modal for selecting items (My Items / Catalog / Upload tabs)
- **CompatibilityCheck** — palette validation with visual feedback
- **ConfirmDialog** — glassmorphic confirmation modal

## Edge Cases
- Remove last item → capsule becomes empty "plan" state
- Replace with same color → no compatibility issue
- Add item that already exists in capsule → prevent duplicate
- Palette locked → cannot add colors outside palette

## Related Features
- f-009-capsule-result.md — Parent screen
- f-014-wardrobe-management.md — Uncapsulated destination for removed items
- f-015-opr.md — OPR recalculated on every change
