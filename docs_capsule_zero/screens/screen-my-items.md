# Screen: My Items

## MVP algorithm contract — required before release (2026-10-21)

Item review uses separate simplicity/currentness and applicable cut tags. Keep owned unusual/dated pieces and favourites; uncertain tags remain editable/unreviewed. Reuse existing detail surfaces for neutral guidance, without exposing the internal basicity number.

Stage 2 must extend the existing item-detail surface with “Review cut” reference comparisons and “Request review” for ambiguity. These controls and review states are future implementation work, not shipped UI. The implementation must show request/needs-details/outcome, retain the item and recalculate after a reviewed outcome; exact transitions and actors are in methodology §6.1.

Authority: [PRODUCT-PLAN D4/Q5](../../PRODUCT-PLAN.md); attributes: [methodology §6.1](../project/methodology/capsule-methodology.md);
whole-look, counting, versioning and quality rules: [outfit generation §2.5](../project/methodology/outfit-generation.md).
URL: /my-items
Feature: features/f-005-my-items.md
Prototype: `html-prototypes/my-items.html`

## Desktop Layout

```
┌─────────────────────────────────────────────────────────┐
│ [← Dashboard]         My Items (47)          [Avatar]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Filter: [All categories ▾]  [All colors ▾]             │
│                                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │ ██████  │ │ ██████  │ │ ██████  │ │ ██████  │      │
│  │ White   │ │ Navy    │ │ Black   │ │ Beige   │      │
│  │ T-shirt │ │ Jeans   │ │ Blazer  │ │ Coat    │      │
│  │ ●●      │ │ ●       │ │ ●       │ │ ●●      │      │
│  │ ┌capsule┐│ │         │ │ ┌capsule┐│ │         │      │
│  │ [♡]     │ │ [♡]     │ │ [♡]     │ │ [♡]     │      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │ ██████  │ │ ██████  │ │ ██████  │ │ ██████  │      │
│  │ Grey    │ │ White   │ │ Camel   │ │ Black   │      │
│  │ Trousers│ │ Shirt   │ │ Loafers │ │ Sneakers│      │
│  │ ●       │ │ ●●      │ │ ●       │ │ ●       │      │
│  │         │ │ ┌capsule┐│ │         │ │ ┌capsule┐│      │
│  │ [♡]     │ │ [♡]     │ │ [♡]     │ │ [♡]     │      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [My Items] [Capsules] [♡] [Profile]                    │
└─────────────────────────────────────────────────────────┘
```

## Detail / Edit View

```
│  ┌──────────────────────────────────────────────────┐   │
│  │  ┌────────────┐                                  │   │
│  │  │  ████████  │  White T-shirt           [Edit]  │   │
│  │  │  ████████  │                                  │   │
│  │  │  ████████  │  Category: T-shirt               │   │
│  │  │  ████████  │  Colors: ● ●                     │   │
│  │  │            │  Brand: COS                      │   │
│  │  └────────────┘  Material: 100% cotton           │   │
│  │                  Price: $45                       │   │
│  │                  Capsule: My Capsule              │   │
│  │                                                   │   │
│  │  [♡ Favorite]  [For Sale]  [For Repair]          │   │
│  └──────────────────────────────────────────────────┘   │
```

## Elements

- **Header:** Title + item count
- **Filter Bar:** Category dropdown + color filter
- **Item Cards:** Photo + name (header) + color dots + capsule badge + favorite heart
- **Detail View:** Large photo + all fields + action buttons
- **Edit Mode:** Inline editable fields (name, photo, category, color dots, brand, material, price)

## Interactivity

- Click card → detail view
- Click [Edit] → inline editing mode
- Save → no page reload
- Click filter → grid updates
- Click [♡] → toggle favorite
- Click [For Sale] / [For Repair] → move item to section

## Responsive

- Mobile: 2-column grid, detail view full-screen overlay
- Tablet: 3-column grid
- Desktop: 4-column grid, detail as side panel or modal
