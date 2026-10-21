# Feature: Capsule Result

## MVP algorithm contract — required before release (2026-10-21)

Only whole-look passes enter the verified outfit grid/count, OPR and Layering Coverage. Evaluate shoes and every accessory/layer extension too. Return neutral failed/unreviewed reasons and useful alternatives; colour-compatible but cut-incompatible combinations must not inflate totals. Generation and recommendation use one ruleset.

Authority: [PRODUCT-PLAN D4/Q5](../../PRODUCT-PLAN.md); attributes: [methodology §6.1](../project/methodology/capsule-methodology.md);
whole-look, counting, versioning and quality rules: [outfit generation §2.5](../project/methodology/outfit-generation.md).

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
- Generated algorithmically following 7-layer, colour and whole-outfit cut/proportion rules
- Display verified looks in the canonical simplicity order from outfit-generation §2.5: fewer items below basicity 100, then higher basicity sum, then sorted canonical item IDs. Diversity selection/caps in §3 do not override this display order or change counted looks.

### Tab 3: Gap Analysis ("What's Missing")

- Text-based list: category + colour + reviewed suitable cut + human-readable evaluator rule reason for missing items
- Four gap rules: structural, color, combinability, layer balance
- Empty state: "Your capsule is complete!"

### Tab 4: Shopping List

- Text list: category + color + reviewed suitable cut + human-readable rule reason + priority (High/Medium/Low) + role-specific verified impact
- Click on row → owned-preset suggestions filtered by category, color and reviewed suitable-cut signature; shared merchant search stays Q8-gated

## Interface States

| State        | Description              | What user sees                                          |
| ------------ | ------------------------ | ------------------------------------------------------- |
| Default      | Capsule loaded           | Item grid + tabs (Outfits, Gap Analysis, Shopping List) |
| Items tab    | Grid view                | Cards with photos and color dots                        |
| Outfits tab  | Generated outfits        | Static outfit cards (view-only)                         |
| Gap tab      | Missing items            | Text list of gaps or "Your capsule is complete!"        |
| Shopping tab | Purchase recommendations | Prioritized table with impact metrics                   |
| Loading      | Data generating          | Skeleton screens                                        |
| Empty plan   | Categories set, no items | All categories shown as gaps                            |

## Acceptance Criteria

1. Visual grid of items with color dots
2. Outfits tab: verified static outfit combinations (view-only), displayed in canonical §2.5 simplicity order across web/API/mobile
3. Gap analysis tab: text-based list (category + color + reviewed suitable cut and rule reason)
4. Shopping list tab: category + color + reviewed suitable cut + rule reason + priority + role-specific verified impact (core base looks or Layering Coverage)
5. All data uses categories, palette, separate simplicity/currentness and whole-look cut rules from the shared evaluator
6. OPR prominently displayed (see f-015-opr.md)
7. Layering Coverage displayed as a separate secondary score with `mid x/B` and `outer y/B` diagnostics; never folded into OPR

## Key Components

- **CapsuleHeader** — capsule name + OPR metric + delta + separate Layering Coverage diagnostics
- **ItemGrid** — responsive grid of capsule items
- **OutfitGrid** — generated outfit combination cards
- **GapAnalysisList** — text rows with category, colour, reviewed suitable cut and the same human-readable evaluator rule reason; icons supplement the text and never replace the explanation
- **ShoppingList** — rows with category, color, reviewed suitable cut, human-readable rule reason, priority and verified impact; reuse ShoppingListRow
- **TabBar** — Items / Outfits / What's Missing / Shopping List

## Edge Cases

- Empty capsule (plan mode) → all categories as gaps, shopping list = everything
- Fully complete capsule → "Your capsule is complete!" in gap tab
- Single item capsule → very low OPR, many gaps shown

## Related Features

- f-006-guided-journey.md — Source flow that creates capsule
- f-010-capsule-management.md — Add/remove/replace items
- f-015-opr.md — OPR calculation and display
