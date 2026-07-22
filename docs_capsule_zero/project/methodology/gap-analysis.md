# Gap Analysis & Shopping List — Capsule Zero

> Source: Styling Guide v1.3, Section 6. Gap analysis identifies what's missing to maximize outfit potential. Shopping list prioritizes the gaps.

## 1. Gap Detection Rules

### Rule 1: Structural Gaps
A fundamental layer is missing from the capsule.
- Example: 0 outerwear items, 0 shoes
- These are the highest-priority gaps as they block entire outfit categories

### Rule 2: Color Gaps
The palette contains colors that have no items assigned to them.
- Example: palette includes Navy but no Navy items exist
- Filling these gaps adds combinations without changing the palette

### Rule 3: Combinability Gaps
Adding one item would significantly increase the number of possible outfits.
- The system calculates which missing category+color combination would yield the most new outfits
- Example: adding a grey cardigan (layer 3) would unlock +12 outfits

### Rule 4: Layer Balance
Ideal ratio across layers:
- ~40% tops (layer 1)
- ~25% bottoms (layer 2)
- ~15% outerwear (layer 4)
- ~20% shoes + accessories (layers 5-7)

Imbalance is flagged as a gap with specific recommendations.

> **Feeds the guest aha (Q1/Q2, 2026-07-21):** Rule 3 (Combinability) is the source of the single
> "add one item" recommendation shown to the guest before the signup gate; Rules 1 + 4 (structural
> gaps + layer balance) feed the **Layering Coverage** score defined in `outfit-generation.md` §3.4.
> The recommendation ranks **categories** by Δcore (core gaps first) or by the coverage/balance signal
> (layering gaps) — the two scales are compared by fixed priority, never merged into one argmax
> (`outfit-generation.md` §4). **Accessories are not recommended as the next buy** (§4) — they feed
> hero OPR but are styling refinements, not the growth lever. The full list of recommendations +
> shopping list is behind the gate; the guest sees one.

## 2. Shopping List Format

The shopping list is the actionable output of gap analysis. Each row represents a recommended addition:

| Column | Description | Example |
|--------|------------|---------|
| **Category** | Which item type to add | Trousers |
| **Recommended Color** | Which palette color to match | Navy or charcoal grey |
| **Priority** | High / Medium / Low | High |
| **Impact** | How many new outfits this would unlock | +12 outfits |

### Example Shopping List

| Category | Recommended Color | Priority | Impact |
|----------|------------------|----------|--------|
| Trousers | Navy or charcoal grey | High | +12 outfits |
| Ankle boots | Black | High | +8 outfits |
| Cardigan | Beige or camel | Medium | +6 outfits |
| Scarf | Grey | Low | +3 outfits |

## 3. Shopping List → Catalog Bridge

Shopping list items are linked to the catalog search (US-012):
- Users can find matching items directly from the shopping list
- Click on a shopping list row → opens Search from Catalog pre-filtered by category and color
- Items from the shared database that match the recommendation are shown first

## 4. Empty Gap Analysis

When the capsule has categories selected but no items added yet:
- Valid state = "plan" mode
- Gap analysis shows ALL categories as gaps
- Shopping list shows everything needed to fill the planned capsule
- This is the starting state after Journey Step 2 (categories selected, items not yet added)

## 5. Validation Rules & Edge Cases

### Edge Cases

| Scenario | Handling |
|----------|---------|
| Fully achromatic capsule | Valid. No accent colors needed |
| Incompatible item color | NOT allowed in v0.1. Block with separate capsule recommendation |
| Custom category rejected | Error with explanation. Suggest similar basic category |
| Item with multiple colors | Dominant color (largest area) used for validation. All color dots preserved |
| Empty capsule (categories but no items) | Valid "plan" state. Gap analysis = all gaps |
| Incorrect auto-tagging on import | User can edit all fields |
| User wants to change palette | Not possible in v0.1. Create a new capsule (v0.2) |

### Validation Summary

> **Scope:** the thresholds below govern the **capsule** entity (post-signup). The **guest loop**
> (pre-signup) uses the lighter rules in `capsule-methodology.md` §7.1 — its only hard requirement is
> **1 top + 1 bottom + 1 pair shoes** (or 1 dress + 1 pair shoes); "min 8 categories" and "min 7
> items" do **not** apply to guests, and the palette is derived, not selected (Q3, 2026-07-21).

| Rule | Value/Threshold | Behavior |
|------|----------------|----------|
| Palette: min achromats | 0 | No blocking |
| Palette: max colors | 15 total / 12 chromatic | Naturally constrained by combinability rules |
| Categories: min selected _(capsule)_ | 8 | Blocks progress. Guest: not enforced (§7.1) |
| Categories: max slots | Unlimited | Soft size label, no blocking |
| Quantity per category | Min 0, default 1, no hard cap | Stepper |
| Total items _(capsule)_ | Min 7 to create; warning at 40; hard limit 50 | Min blocks creation; 40–50 shows warning + suggest new capsule. Guest: min = 1 core triad (§7.1). → `capsule-methodology.md` Section 7 |
| Custom category | Basicity algorithm | Rejection with explanation |
| Item color vs palette | Same group or Desaturated↔Dark compatibility check | Block with recommendation |
| Photo upload: format | JPEG, PNG, WebP | Error for other formats |
| Photo upload: size | Max 10 MB | Error with suggestion to compress |
| Link import: sources | Best-effort generic product URL parsing | Error for unsupported or non-product pages |
