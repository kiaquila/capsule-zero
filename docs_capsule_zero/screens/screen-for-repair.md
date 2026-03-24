# Screen: For Repair
URL: /for-repair
Feature: features/f-014-wardrobe-management.md
Prototype: `html-prototypes/for-repair.html`

## Desktop Layout

```
┌─────────────────────────────────────────────────────────┐
│ [← Dashboard]        For Repair (2)          [Avatar]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────┐ ┌─────────┐                               │
│  │ ██████  │ │ ██████  │                               │
│  │ Black   │ │ Navy    │                               │
│  │ Boots   │ │ Trousers│                               │
│  │ ●       │ │ ●       │                               │
│  │                                                │      │
│  │ [Mark as Fixed]                                │      │
│  └─────────┘ └─────────┘                               │
│                                                         │
│  Items here are excluded from capsules until fixed.     │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [My Items] [Capsules] [♡] [Profile]                    │
└─────────────────────────────────────────────────────────┘
```

## Elements
- **Item Cards:** Photo + name + color dots + fix action
- **Info text:** "Excluded from capsules until fixed"
- **Action:** Mark as Fixed → returns to My Items / Uncapsulated

## Interactivity
- Click [Mark as Fixed] → item returns to My Items (Uncapsulated)
- If item was in capsule when moved to repair → capsule already recomputed
