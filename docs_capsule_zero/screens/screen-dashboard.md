# Screen: Dashboard / Personal Cabinet
URL: /dashboard
Feature: features/f-003-dashboard.md
Prototype: `html-prototypes/dashboard.html`

## Desktop Layout — Filled State

```
┌─────────────────────────────────────────────────────────┐
│ [Logo]                              [Avatar] [☰]        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  My Capsule                              OPR 4.2 │   │
│  │  ●● ●●● ●●       30 items    150 outfits        │   │
│  │  [View Capsule]                    +0.3 ▲        │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ My Items │  │Uncapsu-  │  │Favorites │              │
│  │    47    │  │ lated    │  │    12    │              │
│  │          │  │    8     │  │          │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │Shopping  │  │ For Sale │  │For Repair│              │
│  │  List    │  │    3     │  │    2     │              │
│  │    5     │  │          │  │          │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [My Items] [Capsules] [♡] [Profile]    (bottom nav)   │
└─────────────────────────────────────────────────────────┘
```

## Desktop Layout — Empty State

```
┌─────────────────────────────────────────────────────────┐
│ [Logo]                              [Avatar] [☰]        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                                                         │
│              Welcome to Capsule Zero                    │
│                                                         │
│           Your wardrobe journey starts here.            │
│                                                         │
│           [  Create Your First Capsule  ]               │
│                                                         │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ My Items │  │Uncapsu-  │  │Favorites │              │
│  │    0     │  │ lated    │  │    0     │              │
│  │          │  │    0     │  │          │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [My Items] [Capsules] [♡] [Profile]    (bottom nav)   │
└─────────────────────────────────────────────────────────┘
```

## Elements
- **Capsule Card:** Glass panel with capsule name, OPR, item/outfit/category counts, palette dots, direct actions
- **Stats Row:** Total Items, Total Outfits, Uncapsulated
- **Preview Panels:** Shopping List and Recently Added
- **Quick Access Cards:** Favorites, For Sale, For Repair, Uncapsulated
- **Navigation:** Bottom nav plus More sheet with Outfits, Shopping List, For Sale, For Repair, Profile, Settings

## Interactivity
- Click section card → navigate to corresponding screen
- Click capsule card → navigate to Capsule Result
- Click [Create Your First Capsule] → navigate to Guided Journey
- Each section shows live count

## Responsive
- Mobile: 2-column grid for section cards, capsule card full-width
- Tablet: 3-column grid
- Desktop: 3-column grid with larger cards
