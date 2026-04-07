# Screen: My Items
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
