# Feature: Capsule Result

> Source: US-013 (spec.md). Prototype: `html-prototypes/capsule-result.html`

## Overview
- **Purpose:** Display completed capsule with outfits, gap analysis, and shopping list
- **User:** User who completed the Guided Journey or viewing existing capsule
- **Entry point:** `/capsule/[id]` (redirect from Journey or Dashboard)
- **Emotional target:** SATISFACTION — "Here it is — my system. And it's beautiful."

## Content Tabs

### Tab 1: Items Grid
- Visual grid of all capsule items with color dots
- Item cards clickable (navigate to detail)

### Tab 2: Outfits
- Static outfit combinations (view-only in v0.1, no drag-and-drop)
- Generated algorithmically following 7-layer structure and color harmony rules
- Ranked by diversity

### Tab 3: Gap Analysis ("What's Missing")
- Text-based list: category + color of missing items
- Four gap rules: structural, color, combinability, layer balance
- Empty state: "Your capsule is complete!"

### Tab 4: Shopping List
- Text list: category + color + priority (High/Medium/Low) + impact (+N outfits)
- Click on row → opens Search from Catalog pre-filtered

## Interface States

| State | Description | What user sees |
|-------|------------|----------------|
| Default | Capsule loaded | Item grid + tabs (Outfits, Gap Analysis, Shopping List) |
| Items tab | Grid view | Cards with photos and color dots |
| Outfits tab | Generated outfits | Static outfit cards (view-only) |
| Gap tab | Missing items | Text list of gaps or "Your capsule is complete!" |
| Shopping tab | Purchase recommendations | Prioritized table with impact metrics |
| Loading | Data generating | Skeleton screens |
| Empty plan | Categories set, no items | All categories shown as gaps |

## Acceptance Criteria
1. Visual grid of items with color dots
2. Outfits tab: static outfit combinations (view-only)
3. Gap analysis tab: text-based list (category + color)
4. Shopping list tab: category + color + priority + impact (+N outfits)
5. All data based on categories, palette, and item auto-tagging
6. OPR prominently displayed (see f-015-opr.md)

## Key Components
- **CapsuleHeader** — capsule name + OPR metric + delta
- **ItemGrid** — responsive grid of capsule items
- **OutfitGrid** — generated outfit combination cards
- **GapAnalysisList** — text list of missing items with icons
- **ShoppingList** — table with category, color, priority, impact columns
- **TabBar** — Items / Outfits / What's Missing / Shopping List

## Edge Cases
- Empty capsule (plan mode) → all categories as gaps, shopping list = everything
- Fully complete capsule → "Your capsule is complete!" in gap tab
- Single item capsule → very low OPR, many gaps shown

## Related Features
- f-006-guided-journey.md — Source flow that creates capsule
- f-010-capsule-management.md — Add/remove/replace items
- f-015-opr.md — OPR calculation and display
