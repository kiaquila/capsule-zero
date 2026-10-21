# Screen: Capsule Result

## MVP algorithm contract — required before release (2026-10-21)

Render shared evaluator outputs and rule reasons; do not show colour-valid/cut-failed or unreviewed combinations as verified looks. Shopping guidance includes a suitable cut as well as category/colour. Reuse existing panels/cards and EN/RU explanations; numeric basicity remains internal.

Authority: [PRODUCT-PLAN D4/Q5](../../PRODUCT-PLAN.md); attributes: [methodology §6.1](../project/methodology/capsule-methodology.md);
whole-look, counting, versioning and quality rules: [outfit generation §2.5](../project/methodology/outfit-generation.md).
URL: /capsule/[id]
Feature: features/f-009-capsule-result.md
Prototype: `html-prototypes/capsule-result.html`

> **Q8 implementation gate (2026-07-24):** any Catalog action that would search
> or copy shared user-imported merchant imagery is design-only until the
> compliance-scheme spec and external legal review have both landed. Owned
> preset selection is a separate Stage-2 surface.

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

Verified looks use the canonical §2.5 simplicity display order (non-100 item count ascending,
basicity sum descending, sorted canonical item IDs ascending). The §3 diversity selection/caps
cannot replace this order or change verified counts.

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
│    Cut: simple ankle shaft · Why: clearance with selected hems │
│  (!) Cardigan — Beige or Camel                          │
│    Cut: regular volume · Why: reviewed room over selected tops │
│  (i) Scarf — Grey                                       │
│    Cut: simple, low volume · Why: verified accessory variant │
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
│    Cut: straight, regular length · Why: balanced proportions │
│  Ankle boots       Black              High     +8 core looks  │
│    Cut: simple ankle shaft · Why: clearance with selected hems │
│  Cardigan          Beige / camel      Medium   +12 covered looks (+50 pp) │
│    Cut: regular volume · Why: reviewed room over selected tops │
│  Coat              Charcoal grey      Medium   +12 covered looks (+50 pp) │
│    Cut: straight, roomy · Why: reviewed length/volume with layers │
│                                                         │
│  Reasons and gains come from the same reviewed evaluator │
│  Click row → matching own presets; merchant search Q8-gated │
```

## Elements

- **Capsule Header:** Name, OPR (large), delta, item/outfit counts, palette strip; secondary Layering Coverage with `mid x/B · outer y/B`
- **Tab Bar:** 4 tabs — Items / Outfits / What's missing / Shopping list
- **Item Cards:** Photo + name + color dots + favorite heart + actions menu (⋯)
- **Actions Menu (⋯):** Remove from capsule / Replace item
- **GapAnalysisList:** Each row shows category, colour, reviewed suitable cut and human-readable evaluator rule reason (stable shared rule IDs). Keep cut/reason visible on mobile; icons alone are insufficient.
- **Shopping List Row:** Category, color, reviewed suitable cut, human-readable rule reason, priority and role-specific verified impact. Cut/reason remain visible on mobile; do not hide them in a tooltip.
- **Add Item Card:** "+" card at end of grid

## Interactivity

- Click tab → switch content (no page reload)
- Click item card → detail view
- Click [♡] → toggle favorite
- Click [⋯] → actions: Remove / Replace
- Click [+ Add item] → item picker (My Items / owned Presets / Upload); shared merchant Catalog
  remains Q8-gated
- Click shopping list row → owned-preset suggestions filtered by category, color and reviewed suitable-cut signature when Stage 2 lands; shared merchant search
  only after both Q8 gates
- Incompatible replacement → blocked with message

## Responsive

- Mobile: 2-column item grid, tabs scroll horizontally
- Tablet: 3-column grid
- Desktop: 4-column grid
