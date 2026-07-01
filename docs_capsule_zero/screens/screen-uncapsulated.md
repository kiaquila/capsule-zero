# Screen: Uncapsulated
URL: /uncapsulated
Feature: features/f-014-wardrobe-management.md
Prototype: `html-prototypes/uncapsulated.html`

## Desktop Layout

```
┌─────────────────────────────────────────────────────────┐
│ [← Dashboard]       Uncapsulated (8)         [Avatar]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Filter: [All categories ▾]                             │
│                                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │ ██████  │ │ ██████  │ │ ██████  │ │ ██████  │      │
│  │ Red     │ │ Floral  │ │ Pink    │ │ Graphic │      │
│  │ Dress   │ │ Skirt   │ │ Heels   │ │ T-shirt │      │
│  │ ●●      │ │ ●●●     │ │ ●       │ │ ●●      │      │
│  │                                                │      │
│  │ [Add to capsule] [For Sale] [For Repair]       │      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
│                                                         │
│  These items await their destiny — and that's normal.   │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [My Items] [Capsules] [♡] [Profile]                    │
└─────────────────────────────────────────────────────────┘
```

## Empty State

```
│                                                         │
│          No uncapsulated items                          │
│          All your items are in capsules!                 │
│                                                         │
```

## Elements
- **Header:** Title + count
- **Filter:** Category dropdown
- **Item Cards:** Photo + name + color dots + action buttons
- **Actions:** Add to capsule / Move to For Sale / Move to For Repair

## Interactivity
- Click [Add to capsule] → capsule picker (validates color compatibility)
- Click [For Sale] → item moves to For Sale section
- Click [For Repair] → item moves to For Repair section
- Filter → grid updates by category
