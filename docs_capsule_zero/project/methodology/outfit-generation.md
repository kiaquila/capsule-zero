# Outfit Generation & OPR — Capsule Zero

> Source: Styling Guide v1.3, Section 5. Outfits are generated algorithmically. In v0.1 — static
> (view only), generated on capsule creation or modification.
>
> **OPR counting model ratified 2026-07-21** (PRODUCT-PLAN.md §4 Q1, founder decision). This file is
> the canonical home of the outfit-counting and OPR model; PRODUCT-PLAN §4 Q1 is the decision record.
> The colour engine referenced here implements the `colors.md` compatibility matrix (canonical — Q6
> closed 2026-07-21).

## 1. Outfit Structure (7 Layers)

| Layer | Categories | Rule | Counting role |
|-------|-----------|------|---------------|
| **1: Basic top** | All `categories.md` Core-top categories | Mandatory (unless dress) | **Core** |
| **1 alt: Dress** | Any dress category | Replaces layers 1+2 | **Core** |
| **2: Bottom** | All `categories.md` Core-bottom categories | Mandatory (unless dress) | **Core** |
| **3: Mid layer** | Crew neck sweater, cardigan, bomber, blazer | Optional — adds variety | **Layering** (separate coverage score) |
| **4: Outerwear** | All `categories.md` Outerwear categories | Optional — contextual | **Layering** (separate coverage score) |
| **5: Shoes** | Any shoes category | 1 pair per outfit | **Core** |
| **6: Bag** | Any bags category | Optional, 0–1 | **Accessory** (folds into OPR, capped) |
| **7: Accessories** | Headwear, neckwear, jewelry/watch, belt, eyewear | Optional; total accessory cap in §2.3 | **Accessory** (folds into OPR, capped) |

Three counting roles drive OPR (§3): **Core**, **Layering**, **Accessory**. The exhaustive category
mapping, including the accessory slot for every supported category, lives in `categories.md`
§Category → Algorithm Role Mapping and is reused everywhere (recommendation ranking, gap analysis,
aha-screen). UI/API sections are presentation metadata, not algorithm roles.

## 2. Combination Rules

### 2.1 Color Harmony
All items in a properly assembled capsule match by color by definition — the palette guarantees
compatibility through group-based matching, with achromats always allowed and Desaturated/Dark
allowed as a cross-pair. No limit on the number of colors per outfit beyond the capsule palette
itself. **Any combination of items from the capsule palette is color-valid.** This is the key
advantage of the Capsule Zero color methodology. The compatibility rule is exactly the `colors.md`
matrix (achromatic + any · same chromatic group · Desaturated↔Darks · everything else blocked) —
canonical since Q6 was closed 2026-07-21.

### 2.2 Category Logic
Some categories don't combine:
- Two bottoms in one outfit
- Dress + separate top/bottom (dress replaces layers 1+2)
- Two coats / two mid-layers stacked (one layering piece of each kind per outfit)

### 2.3 Accessory-Combination Ruleset _(ratified 2026-07-21; new)_
Accessories count toward OPR (§3), so — like category logic — they need explicit combination rules
so each **individual outfit** stays realistic (a person does not wear two bags). These are
**per-outfit** rules; the **aggregate** bound that stops accessories from dominating OPR is separate
and lives in §3.1. Per outfit:

1. **One item per accessory slot.** Slots are: **bag, headwear, neckwear, jewelry, belt, eyewear**.
   At most one item from each slot in a single outfit. `categories.md` maps every supported accessory
   category to exactly one slot (Watch shares `jewelry`; Scarf and Tie share `neckwear`).
2. **Accessory compatibility.** Every accessory must be color-compatible with every Core item in
   the base look; accessories in the same variation must also be mutually color-compatible. v0.1
   uses the same `colors.md` matrix for both checks and requires different slots (scarf + hat =
   allowed; two head pieces = not). The richer "which accessory pairs are stylistically compatible"
   table is a v0.1 stub to be extended in Stage 2.
3. **Per-outfit cap.** At most **3 accessory items total, including any bag**, one per slot and all
   mutually compatible. This is the founder-approved `≤3/outfit` cap; it is distinct from `A_max`,
   which caps how many accessorised variants of one base look enter the OPR numerator (§3.1).
4. **Deduplication.** Outfits that differ only by an accessory that does not change the look
   (e.g. swapping one grey scarf for another grey scarf) collapse to one counted outfit. Before
   bounded selection, candidate variations are deduplicated by `(base look, sorted set of
   (slot, colorId))`; the lowest canonical `itemId` is retained only as the rendering representative.

### 2.4 Formality
In v0.1 simplified: all basic items are considered neutral. Formality scoring in v0.2.

### 2.5 Basicity / cut eligibility _(hook — activated Stage 2, Q5)_
Every item passes an **eligibility filter before it enters combination**. In v0.1 the filter checks
colour only (does the item's colour group fit the palette). The filter is the designed insertion
point for **basicity** (`capsule-methodology.md` §6 — cut/silhouette score, currently unimplemented):
Stage 2 adds a basicity gate here so over-designed / dated cuts are down-weighted or excluded **before**
outfits are generated, without reworking the generation pipeline. Stage 1 must not hard-code the
filter to colour-only in a way that blocks this.

## 3. Outfit Productivity Ratio (OPR)

**Hero OPR = wearable outfits ÷ wardrobe pieces that build them.**

### 3.1 Numerator — wearable outfits
1. **Base look** = one valid **Core** combination: `top × bottom × shoes` **or** `dress × shoes`,
   colour-valid per §2.1. Base looks are the backbone of the count.
2. **Accessorised variations (bounded per base look).** A base look counts once bare, plus **at most
   `A_max` accessorised variants** (**v0 fixed value: `A_max = 3`**), chosen deterministically under
   the §2.3 ruleset. It is **not** the full power set of accessory
   combinations. This per-base-look cap is the real aggregate bound: any base look yields at most
   `1 + A_max` counted outfits, so the numerator is `≤ base looks × (1 + A_max)` — accessories raise
   the number, deliberately (founder decision Q1), but by **at most a small constant factor**, never
   multiplicatively.
   - **Why the cap is required (not optional).** Without it, enumerating every valid accessory set
     grows combinatorially while the denominator grows linearly. Worked example using the doc's own
     `≤3/outfit` rule and achromatic accessories (so §2.3.2 never prunes): core 2 tops × 2 bottoms ×
     2 shoes = 8 base looks (6 items); five slots with three colour-distinct items each add 15 items
     and yield `Σ(k=0..3) C(5,k) × 3^k = 376` valid accessory sets per base look. Full enumeration
     would report `8 × 376 = 3,008` outfits / 21 items ≈ **OPR 143.2** for the same small core. That is
     the combinatorial explosion the model rejects.
   - **Deterministic v0 selection.** Enumerate non-empty candidates that pass §2.3, deduplicate them
     by their sorted `(slot, colorId)` tuples, then select at most three with farthest-first traversal:
     start with the candidate
     having the most occupied slots (tie → lexicographically smallest tuple key); each next candidate
     maximises its minimum Hamming distance from already selected candidates across slot occupancy and
     color ID (tie → lexicographically smallest key). Rendering uses the canonical representative
     retained by §2.3.4. Fewer than three valid candidates means use all of them. `A_max = 3` and this
     rule form the **engineering v0 contract (2026-07-22)** within the founder-approved Q1 bounds;
     they are not attributed as an additional founder decision. Quality validation may version them
     later but does not leave Q1 or Stage 1 blocked.
3. **Structural layers (mid-layer, outerwear) do NOT create new counted outfits.** A base look worn
   with or without a cardigan is the *same* outfit for OPR — layering is variety / context, not a new
   look. Their value is reported by the separate **Layering Coverage** score (§3.4).

### 3.2 Denominator — items that build the count
Only items whose category **feeds the numerator**: **Core items** (tops, bottoms, dresses, shoes) +
**Accessory items** in the six canonical slots (bag, headwear, neckwear, jewelry/watch, belt,
eyewear; exact categories in `categories.md`). **Structural-layer items are excluded
from the OPR denominator** — they are surfaced through Layering Coverage instead. This keeps the
metric consistent: a category is in *both* numerator and denominator, or in *neither* (and then in a
separate score). The forbidden hybrid — counting a category's items in the denominator while refusing
its contribution to the numerator (which would penalise owning a cardigan) — is not used.

### 3.3 Consistency guarantee (why this is not the forbidden hybrid)
| Counting role | In numerator? | In OPR denominator? | Where its value shows |
|---|---|---|---|
| Core (top/bottom/dress/shoes) | Yes (base looks) | Yes | Hero OPR |
| Accessory (all six canonical slots) | Yes (bounded variations) | Yes | Hero OPR |
| Layering (mid-layer/outerwear) | No | No | Layering Coverage score |

### 3.4 Layering Coverage (separate score)
For each valid base look, compute two flags: `midCovered = 1` when at least one eligible/color-compatible
mid-layer can be worn with every Core item in that look, and `outerCovered = 1` under the same rule for
outerwear. For `B > 0` base looks:

`Layering Coverage = 100 × Σ(midCovered + outerCovered) / (2 × B)`

Round only for display and show the two diagnostics (`mid: x/B`, `outer: y/B`) so the recommendation is
explainable. When `B = 0`, the score is **N/A**, not zero: the core-feasibility recommendation runs
first (§4). v0 eligibility is colour-only (§2.5); Stage 2 can add cut/formality/context filters without
changing the formula. This is where a cardigan or coat earns its keep without inflating or deflating
hero OPR. Never merge the score into the hero number.

### 3.5 Display & delta
- Hero OPR is shown on the Capsule Result screen and on the capsule card in the Dashboard.
- Updated on every capsule change (add / remove / replace item). Shows delta ("+0.3 from last
  change"). No "good/bad" verdict — just the number.
- Accessorised count and Layering Coverage are shown as clearly-labelled secondary figures, never
  silently folded into the hero number's *meaning*.

### 3.6 Illustrative magnitude
The methodology's classic figure — "a good capsule of 30 items yields 80–150+ unique outfits" — refers
to **Core base looks** (top×bottom×shoes) before accessories. With the bounded accessory increment
(§3.1, ≤ `1 + A_max` per base look) the hero number sits **above** that core figure by **at most a
small constant factor**, not multiplicatively; the exact ranges are pending validation in the
algorithm-v0 baseline layer (FITB + human panel, PRODUCT-PLAN §5 Stage 1 P3); Stage 2 repeats quality
validation after basicity is active. Do **not** pin a hero number in marketing copy or acceptance
criteria until the baseline validation fixes it — the "80–150" line is a floor for the core count,
not the accessorised hero total.

## 4. Recommendation Signal (one next item)

The free-loop "add one item" recommendation evaluates **category+color candidates**, then collapses
equal winners to one category recommendation with its equally valid color options. It uses a reachable
fixed priority and does not merge unlike scales into one score:

1. **Core feasibility:** when there is no valid base look, recommend the missing/replacement Core
   category+color candidate that creates the most valid base looks (minimum one). This includes a
   compatible-color alternative when all required categories exist but their colours cannot form a
   look.
2. **Layering structure:** once a valid base look exists, if Layering Coverage is below 100%, recommend
   the mid/outer category+color candidate that adds the most newly covered base looks (tie: mid before
   outer, then canonical category order). Report impact as covered looks / percentage points, never
   as outfits.
3. **Core growth:** when both layering dimensions cover every current base look, recommend the Core
   category+color candidate with maximum **Δcore** (new deduplicated base looks; tie: canonical
   category order).

- **Core categories** therefore rank by **Δcore**, while **Layering** ranks by coverage gain; the fixed
  priority decides which scale is active instead of comparing their raw values.
- **Accessories are excluded from the "add one item" recommendation — by rule, not omission.** Even
  though accessories feed the hero OPR (§3.1), the single recommendation is about acquiring a garment
  that grows the wardrobe's **base looks** or fills a structural/layering gap (`gap-analysis.md`
  shopping list prioritises structural gaps). Accessories are bounded contributors and styling
  refinements, not the primary growth lever — recommending "buy a 4th scarf" would be noise. They may
  enrich the *display* of existing looks but are never the single "add this next" answer in v0.
- **Color affects feasibility, not taste-ranking in v0.** In the guest state, derived colors can span
  incompatible groups, so candidate color can change Δcore or Layering Coverage and MUST participate
  in that calculation. The output names all max-scoring color options for the winning category; when
  their impact ties, v0 does not invent a preferred color. Stage 2 may add a separate color-gap /
  preference score to rank those ties.

## 5. Generation Trigger

Outfits are regenerated when the capsule is first created (after Journey Step 3) or when an item is
added / removed / replaced. In v0.1: static generation (batch), not real-time — the user sees a
pre-generated outfit grid. In the **guest loop** (pre-signup) the same generation runs entirely in
the browser once the guest has at least one **mutually color-compatible** combination of ≥1 top + ≥1
bottom + ≥1 pair shoes (or ≥1 dress + ≥1 pair shoes). Category presence without a color-valid
combination is a zero-result state with explained add/replace alternatives, not an OPR result
(`capsule-methodology.md` §7.1); guest items never leave the device before signup.
