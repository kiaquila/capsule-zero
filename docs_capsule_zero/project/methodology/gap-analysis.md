# Gap Analysis & Shopping List — Capsule Zero

> **MVP contract (2026-10-21):** PRODUCT-PLAN D4/Q5 and `outfit-generation.md` §2.5 require the same
> cut-aware evaluator for every recommendation, including before signup. Evaluate concrete reviewed
> preset attributes, not a hypothetical category+colour with no known cut. Collapse candidates only
> when impact and cut advice agree. Current `guest-v1` is an interim baseline, not completion evidence.

> Source: Styling Guide v1.3, Section 6. Gap analysis identifies what's missing to maximize outfit potential. Shopping list prioritizes the gaps.

## 1. Gap Detection Rules

### Rule 1: Structural Gaps

A fundamental layer is missing from the capsule.

- Example: 0 outerwear items, 0 shoes
- Split by algorithm role (`categories.md` §Category → Algorithm Role Mapping): missing Core shoes are
  a **core-feasibility blocker**; missing mid/outer layers reduce **Layering Coverage** but never reduce
  the OPR numerator. Do not report both in the same unit.

### Rule 2: Color Gaps

The palette contains colors that have no items assigned to them.

- Example: palette includes Navy but no Navy items exist
- Filling these gaps adds combinations without changing the palette

### Rule 3: Combinability Gaps

Adding one item would significantly increase the number of possible outfits.

- For Core categories, the system calculates which missing category+color combination would yield
  the most new **verified** core base looks using colour and whole-outfit cut checks; Layering candidates are scored in verified covered looks / percentage points
- Example: adding a grey Core top would unlock +12 **core base looks**. A cardigan changes Layering
  Coverage, not outfit count.

### Rule 4: Layer Balance

Ideal ratio across layers:

- ~40% tops (layer 1)
- ~25% bottoms (layer 2)
- ~15% outerwear (layer 4)
- ~20% shoes + accessories (layers 5-7)

Imbalance is flagged as a gap with specific recommendations. Core/shoes imbalances are evaluated by
Core feasibility/Δcore; only the mid/outer portions feed Layering Coverage. Accessories never feed the
single guest "add one item" recommendation.

> **Feeds the guest aha (Q1/Q2, 2026-07-21):** Rules 1/3 first detect whether a verified wearable Core look
> exists; the relevant Core candidate ranks by Δcore. Once one exists, the mid/outer portions of Rules
> 1/4 feed **Layering Coverage** (`outfit-generation.md` §3.4); after both layering dimensions cover all
> current looks, Rule 3 returns to incremental Core growth. These unlike scales follow the explicit
> fixed priority in `outfit-generation.md` §4 and are never merged into one argmax. **Accessories are
> not recommended as the next buy** (§4) — they feed
> hero OPR but are styling refinements, not the growth lever. The full list of recommendations +
> shopping list is behind the gate; the guest sees one.

## 2. Shopping List Format

The shopping list is the actionable output of gap analysis. Each row represents a recommended addition:

| Column                | Description                                                          | Example                                                   |
| --------------------- | -------------------------------------------------------------------- | --------------------------------------------------------- |
| **Category**          | Which item type to add                                               | Trousers                                                  |
| **Recommended Color** | Which palette color to match                                         | Navy or charcoal grey                                     |
| **Suitable cut**      | Reviewed silhouette/length/volume and simple/current preset evidence | Straight, regular-length trousers; applicable rule reason |
| **Priority**          | High / Medium / Low                                                  | High                                                      |
| **Impact**            | Role-specific gain; never mix units                                  | +12 core looks / +50 pp strict-v0 Layering Coverage       |

### Example Shopping List

| Category    | Recommended Color     | Priority | Impact                                            |
| ----------- | --------------------- | -------- | ------------------------------------------------- |
| Trousers    | Navy or charcoal grey | High     | +12 core base looks                               |
| Ankle boots | Black                 | High     | +8 core base looks                                |
| Cardigan    | Beige or camel        | Medium   | +12 covered base looks (+50 pp Layering Coverage) |
| Coat        | Charcoal grey         | Medium   | +12 covered base looks (+50 pp Layering Coverage) |

The +50 pp examples assume the proposed layer passes §2.5 with **every** existing base look.
Palette compatibility alone cannot establish this, even in a strict capsule. Completed MVP may give
partial coverage because cuts/volume/lengths differ. Re-evaluate all extended looks and report the
actual gain; the numbers above are conditional illustrations, not category-level guarantees.

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

| Scenario                                       | Handling                                                                                                                                                                   |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fully achromatic capsule                       | Valid. No accent colors needed                                                                                                                                             |
| Incompatible item color                        | NOT allowed in v0.1. Block with separate capsule recommendation                                                                                                            |
| Custom category cannot map to a supported role | Ask for clarification; suggest a supported category. Low simplicity alone does not reject an owned item                                                                    |
| Cut conflict or unreviewed attributes          | Keep the item; explain the failed rule/missing review and offer attribute confirmation or a reviewed preset. Unverified looks do not increase count or recommendation gain |
| Item with multiple colors                      | Dominant color (largest area) used for validation. All color dots preserved                                                                                                |
| Empty capsule (categories but no items)        | Valid "plan" state. Gap analysis = all gaps                                                                                                                                |
| Incorrect auto-tagging on import               | User can edit all fields                                                                                                                                                   |
| User wants to change palette                   | Not possible in v0.1. Create a new capsule (v0.2)                                                                                                                          |

### Validation Summary

> **Scope:** the thresholds below govern the **capsule** entity (post-signup). The **guest loop**
> (pre-signup) uses the lighter rules in `capsule-methodology.md` §7.1 — its only hard requirement is
> at least one **verified wearable** top + bottom + shoes combination (or dress + shoes), including whole-outfit cut checks;
> "min 8 categories" and "min 7
> items" do **not** apply to guests, and the palette is derived, not selected (Q3, 2026-07-21).

| Rule                                 | Value/Threshold                                        | Behavior                                                                                                                                                                                                                                             |
| ------------------------------------ | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Palette: min achromats               | 0                                                      | No blocking                                                                                                                                                                                                                                          |
| Palette: max colors                  | 15 total / 12 chromatic                                | Naturally constrained by combinability rules                                                                                                                                                                                                         |
| Categories: min selected _(capsule)_ | 8                                                      | Blocks progress. Guest: not enforced (§7.1)                                                                                                                                                                                                          |
| Categories: max slots                | Unlimited                                              | Soft size label, no blocking                                                                                                                                                                                                                         |
| Quantity per category                | Min 0, default 1, no hard cap                          | Stepper                                                                                                                                                                                                                                              |
| Total items _(capsule)_              | Min 7 to create; warning at 40; hard limit 50          | Min blocks strict-capsule creation; 40–50 shows warning + suggest new capsule. Guest: min = 1 verified wearable Core combination (§7.1); after signup its items save as `uncapsulated`, not an invalid capsule. → `capsule-methodology.md` Section 7 |
| Custom category                      | Supported category/role mapping                        | Clarify unmappable entries; no low-basicity-only rejection                                                                                                                                                                                           |
| MVP cut checks                       | Simplicity + separate currentness + whole-outfit rules | Same verdicts for outfits, OPR, coverage, gaps and recommendation gains; see `outfit-generation.md` §2.5                                                                                                                                             |
| Item color vs palette                | Same group or Desaturated↔Dark compatibility check     | Block with recommendation                                                                                                                                                                                                                            |
| Photo upload: format                 | JPEG, PNG, WebP                                        | Error for other formats                                                                                                                                                                                                                              |
| Photo upload: size                   | Max 10 MB                                              | Error with suggestion to compress                                                                                                                                                                                                                    |
| Link import: sources                 | Best-effort generic product URL parsing                | Error for unsupported or non-product pages                                                                                                                                                                                                           |
