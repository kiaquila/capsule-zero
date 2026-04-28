# Screen: Guided Journey (3 Steps)
URL: /journey
Feature: features/f-006-guided-journey.md
Prototype: `html-prototypes/guided-journey.html`

## Step 1/3 — Wardrobe Type

```
┌─────────────────────────────────────────────────────────┐
│ [← Back]              Step 1 of 3              [Logo]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│            Choose your wardrobe type                    │
│                                                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │            │  │            │  │            │        │
│  │  Women's   │  │   Men's    │  │   Mixed    │        │
│  │     F      │  │     M      │  │    F+M     │        │
│  │            │  │            │  │            │        │
│  └────────────┘  └────────────┘  └────────────┘        │
│                                                         │
│  This determines which garment                          │
│  categories are available                               │
│                                                         │
│              ● ○ ○  (progress)                          │
└─────────────────────────────────────────────────────────┘
```

## Step 2/3 — Category Checklist

```
┌─────────────────────────────────────────────────────────┐
│ [← Back]              Step 2 of 3              [Logo]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│      What's in your capsule?                            │
│      Select garment types and set quantity              │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  ☑ T-shirt                          [- 2 +]     │   │
│  │  ☑ Button-down shirt                [- 1 +]     │   │
│  │  ☑ Turtleneck                       [- 1 +]     │   │
│  │  ☐ Tank top / Cami                  [- 1 +]     │   │
│  │  ☑ Trousers                         [- 3 +]     │   │
│  │  ☑ Jeans                            [- 2 +]     │   │
│  │  ☑ Skirt                            [- 1 +]     │   │
│  │  ☑ Blazer                           [- 1 +]     │   │
│  │  ☑ Coat                             [- 1 +]     │   │
│  │  ☑ Sneakers                         [- 1 +]     │   │
│  │  ...                                             │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  [+ Add your own category]                              │
│                                                         │
│  Selected: 10 categories    Capsule: Basic (30 items)   │
│                                                         │
│              ○ ● ○  (progress)                          │
│                                                         │
│                          [Continue →]                   │
└─────────────────────────────────────────────────────────┘
```

## Step 3/3 — Colors & Items

```
┌─────────────────────────────────────────────────────────┐
│ [← Back]              Step 3 of 3              [Logo]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│      Choose your colors                                 │
│                                                         │
│  Color Palette                                          │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐             │
│  │░░│ │▓▓│ │██│ │██│ │░░│ │▓▓│ │▓▓│ │░░│             │
│  │Wh│ │Gr│ │Bk│ │Nv│ │Be│ │Cm│ │Tp│ │OW│             │
│  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘             │
│   ✓                   (greyed = incompatible)           │
│                                                         │
│  ─────────────────────────────────────                  │
│                                                         │
│  Add your garments                                      │
│  [Upload photos] [Paste links] [Search catalog]         │
│                                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                   │
│  │ ██████  │ │ ██████  │ │ ██████  │                   │
│  │ Item 1  │ │ Item 2  │ │ + Add   │                   │
│  │ ●●      │ │ ●●●     │ │         │                   │
│  └─────────┘ └─────────┘ └─────────┘                   │
│                                                         │
│              ○ ○ ●  (progress)                          │
│                                                         │
│                    [Create capsule]                      │
└─────────────────────────────────────────────────────────┘
```

## Elements
- **Progress indicator:** 3-dot stepper (● active, ○ inactive)
- **Type cards (Step 1):** Large glass cards with icons
- **Category checklist (Step 2):** Scrollable list, toggles + quantity steppers
- **Item tabs (Step 3):** Upload Photos / Paste Links / Search Catalog
- **Color grid (Step 3):** Single palette grid with achromats first, then all other colors
- **Blocked state:** incompatible colors are unavailable for selection

## Interactivity
- Step 1: Click card → select type, auto-advance to Step 2
- Step 2: Toggle categories, adjust quantities, validate min 8
- Step 3: Add items via 3 methods, then select any number of compatible colors
- Selecting a color updates the availability of the remaining palette options
- [Create capsule] → loading → redirect to Capsule Result
- [← Back] → navigate to previous step

## Responsive
- Mobile: Steps stack vertically, cards in 1-column, full-width inputs
- Tablet: 2-column for type cards, wider checklist
- Desktop: 3-column type cards, spacious layout
