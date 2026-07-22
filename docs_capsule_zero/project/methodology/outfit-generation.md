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
| **1: Basic top** | T-shirt, button-down shirt, turtleneck, tank top/cami | Mandatory (unless dress) | **Core** |
| **1 alt: Dress** | Any dress category | Replaces layers 1+2 | **Core** |
| **2: Bottom** | Trousers, jeans, skirt, shorts, leggings | Mandatory (unless dress) | **Core** |
| **3: Mid layer** | Cardigan, blazer, crew neck sweater | Optional — adds variety | **Layering** (separate coverage score) |
| **4: Outerwear** | Coat, jacket, parka, puffer jacket | Optional — contextual | **Layering** (separate coverage score) |
| **5: Shoes** | Any shoes category | 1 pair per outfit | **Core** |
| **6: Bag** | Any bags category | Optional, 0–1 | **Accessory** (folds into OPR, capped) |
| **7: Accessories** | Scarf, hat, jewelry, belt | Optional, 0–3 | **Accessory** (folds into OPR, capped) |

Three counting roles drive OPR (§3): **Core**, **Layering**, **Accessory**. They are defined once
here and reused everywhere (recommendation ranking, gap analysis, aha-screen).

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

1. **One item per accessory slot.** Slots are: **bag, hat, scarf, belt, jewelry**. At most one item
   from each slot in a single outfit. (Jewelry is treated as one styling slot in v0.1.)
2. **Accessory ↔ accessory compatibility.** Two accessories may share an outfit only if they
   co-wear. v0.1 baseline: (a) color-compatible by the same `colors.md` matrix used for all items,
   and (b) different slots (scarf + hat = allowed; two head pieces = not). The richer "which
   accessory pairs are stylistically compatible" table is a v0.1 stub to be extended in Stage 2.
3. **Per-outfit cap.** At most **1 bag** (layer 6) + up to **3 layer-7 accessories**, one per slot,
   all mutually compatible.
4. **Deduplication.** Outfits that differ only by an accessory that does not change the look
   (e.g. swapping one grey scarf for another grey scarf) collapse to one counted outfit. An outfit
   is identified by `(base look, set of filled accessory slots with a colour-distinct item in each)`.

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
   `A_max` accessorised variants** (v0 default `A_max = 3`), chosen as the most *distinct* stylings by
   occupied-slot signature under the §2.3 ruleset. It is **not** the full power set of accessory
   combinations. This per-base-look cap is the real aggregate bound: any base look yields at most
   `1 + A_max` counted outfits, so the numerator is `≤ base looks × (1 + A_max)` — accessories raise
   the number, deliberately (founder decision Q1), but by **at most a small constant factor**, never
   multiplicatively.
   - **Why the cap is required (not optional).** Without it, counting every valid accessory set is
     multiplicative: each colour-distinct accessory in a slot multiplies the numerator (`base looks ×
     2^slots`) while adding only **+1** to the denominator. Worked example on the doc's own rules with
     achromatic accessories (universally compatible, so §2.3.2 never prunes): core 2 tops × 2 bottoms ×
     2 shoes = 8 base looks (6 items); add bag + hat + scarf + belt (4 items) → 16 accessory sets per
     base look → 128 "outfits" / 10 items ≈ **OPR 12.8**, and adding a second colour per slot pushes it
     past 100 for the *same* core. That is the combinatorial explosion the model rejects. The cap keeps
     the count honest and premium.
   - `A_max` and the exact variant-selection rule are an **open sub-decision** validated in the
     algorithm-v0 layer (FITB + human panel) and confirmed with the founder — see this spec's Known
     Issues and PRODUCT-PLAN §5.
3. **Structural layers (mid-layer, outerwear) do NOT create new counted outfits.** A base look worn
   with or without a cardigan is the *same* outfit for OPR — layering is variety / context, not a new
   look. Their value is reported by the separate **Layering Coverage** score (§3.4).

### 3.2 Denominator — items that build the count
Only items whose category **feeds the numerator**: **Core items** (tops, bottoms, dresses, shoes) +
**Accessory items** (bags, scarves, hats, jewelry, belts). **Structural-layer items are excluded
from the OPR denominator** — they are surfaced through Layering Coverage instead. This keeps the
metric consistent: a category is in *both* numerator and denominator, or in *neither* (and then in a
separate score). The forbidden hybrid — counting a category's items in the denominator while refusing
its contribution to the numerator (which would penalise owning a cardigan) — is not used.

### 3.3 Consistency guarantee (why this is not the forbidden hybrid)
| Counting role | In numerator? | In OPR denominator? | Where its value shows |
|---|---|---|---|
| Core (top/bottom/dress/shoes) | Yes (base looks) | Yes | Hero OPR |
| Accessory (bag/scarf/hat/jewelry/belt) | Yes (bounded variations) | Yes | Hero OPR |
| Layering (mid-layer/outerwear) | No | No | Layering Coverage score |

### 3.4 Layering Coverage (separate score)
How well the wardrobe's mid-layer / outerwear pieces cover the base looks — e.g. "you can layer 6 of
your 12 base looks." Computed from `gap-analysis.md` Rule 1 (structural gaps) and Rule 4 (layer
balance). This is where the cardigan / coat earns its keep without inflating or deflating the hero
OPR. Never merged into the hero number.

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
algorithm-v0 layer (FITB + human panel, `gap-analysis.md` / PRODUCT-PLAN §5 Этап 2). Do **not** pin a
hero number in marketing copy or acceptance criteria until that validation fixes it — the "80–150"
line is a floor for the core count, not the accessorised hero total.

## 4. Recommendation Signal (one next item)

The free-loop "add one item" recommendation ranks **categories**, consistent with this model:
- **Core categories** rank by **Δcore** — how many new base looks a category+color would unlock.
- **Layering** and **structural** gaps rank by the separate coverage / balance signal
  (`gap-analysis.md` Rules 1/4), never silently mixed into the same argmax as Δcore.
- **Accessories are excluded from the "add one item" recommendation — by rule, not omission.** Even
  though accessories feed the hero OPR (§3.1), the single recommendation is about acquiring a garment
  that grows the wardrobe's **base looks** or fills a structural/layering gap (`gap-analysis.md`
  shopping list prioritises structural gaps). Accessories are bounded contributors and styling
  refinements, not the primary growth lever — recommending "buy a 4th scarf" would be noise. They may
  enrich the *display* of existing looks but are never the single "add this next" answer in v0.
- **Selecting the single winner across the two scales.** Core gaps take priority: the top **Δcore**
  category is the recommendation whenever any core addition still raises the base-look count. Only when
  no core addition materially raises Δcore does the recommendation fall to the top **layering-coverage**
  gap (Rules 1/4). This fixed cross-scale priority is deterministic — the two scales are compared, never
  merged into one score.
- **Color is not ranked in v0**: within a fixed category every palette-compatible color yields the
  same OPR delta, so v0 recommends a *category*, and shows equal options as equal. A specific color
  needs a separate colour-gap / preference signal — Stage 2 (Q5).

## 5. Generation Trigger

Outfits are regenerated when the capsule is first created (after Journey Step 3) or when an item is
added / removed / replaced. In v0.1: static generation (batch), not real-time — the user sees a
pre-generated outfit grid. In the **guest loop** (pre-signup) the same generation runs entirely in
the browser once the guest has **≥ 1 top + ≥ 1 bottom + ≥ 1 pair shoes** (or ≥ 1 dress + ≥ 1 pair
shoes) — the minimum that guarantees ≥ 1 base look (`capsule-methodology.md` §7.1); guest items never
leave the device.
