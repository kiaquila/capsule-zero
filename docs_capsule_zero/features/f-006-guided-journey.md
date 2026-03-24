# Feature: Guided Journey (3-Step Capsule Creation)

> Source: US-008, US-009, US-010 (spec.md). Prototype: `html-prototypes/guided-journey.html`

## Overview
- **Purpose:** 3-step capsule creation flow — the core product experience
- **User:** Authenticated user creating a capsule
- **Entry point:** `/journey` (from Dashboard CTA or Capsules section)
- **Emotional target:** CREATIVITY — "I'm building my ideal wardrobe — every choice is intentional"

## Step 1/3 — Wardrobe Type

### User Flow
1. Three large visual cards: Women's / Men's / Mixed
2. User selects one
3. Choice locks, proceeds to Step 2
4. Can go back from Step 2 to change

### Acceptance Criteria
- Three large visual cards (Women's / Men's / Mixed)
- Selection locks, proceed to Step 2
- Ability to go back from Step 2
- Progress indicator shows 1/3

## Step 2/3 — Category Checklist

### User Flow
1. Textual category checklist (no visuals) with quantity steppers
2. Categories filtered by gender (from Step 1)
3. User selects categories and sets quantities (default 1, min 0 per category, no cap)
4. Optional: "Add your own category" → system validates basicity
5. Minimum 8 categories required before proceeding

### Acceptance Criteria
- Textual checklist with quantity steppers
- Categories filtered by wardrobe type from Step 1
- Min 8 categories validated before proceeding
- "Add your own category" with basicity validation
- Progress shows 2/3, capsule size label displayed (Basic / Large / Very Large)
- Custom category rejection shows explanation + similar suggestion

## Step 3/3 — Colors & Items

### User Flow
1. **Items first:** user adds garments via Upload Photos / Paste Links / Search Catalog
2. **Palette selection:** achromatic colors appear first, followed by all other colors in a single continuous grid
3. User can select any number of colors
4. Colors incompatible with the current palette become unavailable
5. User adds items to capsule
6. "Create capsule" → capsule generated, redirect to Capsule Result

### Acceptance Criteria
- Achromatic colors appear first in the palette UI but remain optional
- User can select any number of compatible colors
- Incompatible colors are blocked based on temperature-or-saturation compatibility
- Three upload methods available
- "Create capsule" → generates capsule, redirects to Result

## Interface States

| State | Description | What user sees |
|-------|------------|----------------|
| Step 1 default | Type selection | Three visual cards |
| Step 2 default | Category selection | Checklist with steppers |
| Step 2 min warning | < 8 categories | Warning: "Select at least 8 categories" |
| Step 2 custom error | Invalid custom category | Error: "This doesn't look like a basic item..." |
| Step 3 palette | Color selection | Single grid with achromats first |
| Step 3 compatibility state | Incompatible color | Blocked/unavailable color options |
| Step 3 items | Adding items | Upload/Links/Search tabs |
| Creating | Capsule generating | Loading animation |
| Complete | Capsule created | Redirect to Capsule Result |

## Key Components
- **JourneyProgress** — step indicator (1/3, 2/3, 3/3)
- **WardrobeTypeCards** — three selectable cards with icons
- **CategoryChecklist** — scrollable list with toggles + quantity steppers
- **CustomCategoryInput** — text input with basicity validation
- **PaletteSelector** — single grid with achromats first
- **ItemUploadTabs** — three-tab component (Photos / Links / Search)

## Validation Rules
- Achromatics are optional and shown first in the palette
- No hard cap on selected colors
- Min 8 categories
- Items per category: min 0, default 1, no hard cap (stepper)
- Total items in capsule: min 7 to create; warning at 40; hard limit 50 → suggest creating new capsule
- Custom category: basicity algorithm validation
- Color compatibility rule: a color is allowed if it matches the current palette by temperature or saturation

## Edge Cases
- Fully achromatic capsule → valid, no accent colors needed
- Custom category rejected → error + suggestion of similar basic category
- Empty capsule (categories set, no items) → valid "plan" state
- User wants to change palette after creation → not possible in v0.1, create new capsule

## Related Features
- f-007-marketplace-import.md — "Paste Links" tab
- f-008-semantic-search.md — "Search Catalog" tab
- f-011-photo-upload.md — "Upload Photos" tab
- f-009-capsule-result.md — Redirect destination after creation
