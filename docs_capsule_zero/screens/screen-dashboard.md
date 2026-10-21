# Screen: Dashboard / Personal Cabinet

## MVP algorithm contract — required before release (2026-10-21)

Use the same versioned verified counts/coverage as Capsule Result. Old saved guest-v1 totals remain reproducible interim snapshots; explicit new-version recalculation explains any changed total. No client-side colour-only reconstruction of the metric.

Authority: [PRODUCT-PLAN D4/Q5](../../PRODUCT-PLAN.md); attributes: [methodology §6.1](../project/methodology/capsule-methodology.md);
whole-look, counting, versioning and quality rules: [outfit generation §2.5](../project/methodology/outfit-generation.md).
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
│  │  Layering 100% · mid 12/12 · outer 12/12        │   │
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

- **Capsule Card:** Glass panel with capsule name, OPR, separately labelled Layering Coverage (or `N/A`), item/outfit/category counts, palette dots, direct actions
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
