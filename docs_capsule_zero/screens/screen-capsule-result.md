# Screen: Capsule Result
URL: /capsule/[id]
Feature: features/f-009-capsule-result.md
Prototype: `html-prototypes/capsule-result.html`

## Desktop Layout

```
┌─────────────────────────────────────────────────────────┐
│ [← Dashboard]                               [Avatar]    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Your capsule is ready                                  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  My Capsule        OPR: 4.2  (+0.3 ▲)           │   │
│  │  Layering: 100% · mid 12/12 · outer 12/12       │   │
│  │  30 items · 126 outfits                          │   │
│  │  Palette: ● ● ● ● ● ●                           │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  [Items]  [Outfits]  [What's missing]  [Shopping list]  │
│  ────────────────────────────────────────────────────   │
│                                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │ ██████  │ │ ██████  │ │ ██████  │ │ ██████  │      │
│  │ T-shirt │ │ Jeans   │ │ Blazer  │ │ Coat    │      │
│  │ ●●      │ │ ●       │ │ ●●      │ │ ●       │      │
│  │ [♡] [⋯] │ │ [♡] [⋯] │ │ [♡] [⋯] │ │ [♡] [⋯] │      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │ ██████  │ │ ██████  │ │ ██████  │ │ + Add   │      │
│  │ Shoes   │ │ Shirt   │ │ Skirt   │ │  item   │      │
│  │ ●       │ │ ●●      │ │ ●●●     │ │         │      │
│  │ [♡] [⋯] │ │ [♡] [⋯] │ │ [♡] [⋯] │ │         │      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [My Items] [Capsules] [♡] [Profile]                    │
└─────────────────────────────────────────────────────────┘
```

## Tab: Outfits

```
│  [Items]  [Outfits]  [What's missing]  [Shopping list]  │
│  ────────────────────────────────────────────────────   │
│                                                         │
│  126 outfits generated                                  │
│                                                         │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │ ┌────┐ ┌────┐    │  │ ┌────┐ ┌────┐    │            │
│  │ │Top │ │Bot │    │  │ │Top │ │Bot │    │            │
│  │ └────┘ └────┘    │  │ └────┘ └────┘    │            │
│  │ ┌────┐ ┌────┐    │  │ ┌────┐ ┌────┐    │            │
│  │ │Shoe│ │Bag │    │  │ │Coat│ │Shoe│    │            │
│  │ └────┘ └────┘    │  │ └────┘ └────┘    │            │
│  │  Outfit #1       │  │  Outfit #2       │            │
│  └──────────────────┘  └──────────────────┘            │
```

## Tab: What's Missing (Gap Analysis)

```
│  [Items]  [Outfits]  [What's missing]  [Shopping list]  │
│  ────────────────────────────────────────────────────   │
│                                                         │
│  (!) Ankle boots — Black                                │
│  (!) Cardigan — Beige or Camel                          │
│  (i) Scarf — Grey                                       │
│                                                         │
│  — or if complete: —                                    │
│  ✓ Your capsule is complete!                            │
```

## Tab: Shopping List

```
│  [Items]  [Outfits]  [What's missing]  [Shopping list]  │
│  ────────────────────────────────────────────────────   │
│                                                         │
│  Category          Color              Priority  Impact  │
│  ─────────────────────────────────────────────────────  │
│  Trousers          Navy / charcoal    High     +12 core looks │
│  Ankle boots       Black              High     +8 core looks  │
│  Cardigan          Beige / camel      Medium   +12 covered looks (+50 pp) │
│  Coat              Charcoal grey      Medium   +12 covered looks (+50 pp) │
│                                                         │
│  Click row → search in catalog                          │
```

## Elements
- **Capsule Header:** Name, OPR (large), delta, item/outfit counts, palette strip; secondary Layering Coverage with `mid x/B · outer y/B`
- **Tab Bar:** 4 tabs — Items / Outfits / What's missing / Shopping list
- **Item Cards:** Photo + name + color dots + favorite heart + actions menu (⋯)
- **Actions Menu (⋯):** Remove from capsule / Replace item
- **Add Item Card:** "+" card at end of grid

## Interactivity
- Click tab → switch content (no page reload)
- Click item card → detail view
- Click [♡] → toggle favorite
- Click [⋯] → actions: Remove / Replace
- Click [+ Add item] → item picker (My Items / Catalog / Upload)
- Click shopping list row → catalog search pre-filtered
- Incompatible replacement → blocked with message

## Responsive
- Mobile: 2-column item grid, tabs scroll horizontally
- Tablet: 3-column grid
- Desktop: 4-column grid
