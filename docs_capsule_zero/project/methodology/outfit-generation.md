# Outfit Generation & OPR — Capsule Zero

> Source: Styling Guide v1.3, Section 5. Outfits are generated algorithmically. In v0.1 — static
> (view only), generated on capsule creation or modification.
>
> **OPR counting model ratified 2026-07-21** (PRODUCT-PLAN.md §4 Q1, founder decision). This file is
> the canonical home of the outfit-counting and OPR model; PRODUCT-PLAN §4 Q1 is the decision record.
> The colour engine referenced here implements the `colors.md` compatibility matrix (canonical — Q6
> closed 2026-07-21).

## 1. Outfit Structure (7 Layers)

| Layer              | Categories                                       | Rule                                  | Counting role                          |
| ------------------ | ------------------------------------------------ | ------------------------------------- | -------------------------------------- |
| **1: Basic top**   | All `categories.md` Core-top categories          | Mandatory (unless dress)              | **Core**                               |
| **1 alt: Dress**   | Any dress category                               | Replaces layers 1+2                   | **Core**                               |
| **2: Bottom**      | All `categories.md` Core-bottom categories       | Mandatory (unless dress)              | **Core**                               |
| **3: Mid layer**   | Crew neck sweater, cardigan, bomber, blazer      | Optional — adds variety               | **Layering** (separate coverage score) |
| **4: Outerwear**   | All `categories.md` Outerwear categories         | Optional — contextual                 | **Layering** (separate coverage score) |
| **5: Shoes**       | Any shoes category                               | 1 pair per outfit                     | **Core**                               |
| **6: Bag**         | Any bags category                                | Optional, 0–1                         | **Accessory** (folds into OPR, capped) |
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
   allowed; two head pieces = not). Completed MVP also checks the complete accessorised look under
   §2.5; the colour/slot checks alone do not certify stylistic compatibility.
3. **Per-outfit cap.** At most **3 accessory items total, including any bag**, one per slot and all
   mutually compatible. This is the founder-approved `≤3/outfit` cap; it is distinct from `A_max`,
   which caps how many accessorised variants of one base look enter the OPR numerator (§3.1).
4. **Deduplication.** Outfits that differ only by an accessory that does not change the look
   (e.g. swapping one grey scarf for another grey scarf) collapse to one counted outfit. Before
   bounded selection, candidate variations are deduplicated by `(base look, sorted set of
(slot, colorId, reviewed style signature))`; the lowest canonical `itemId` is retained only as the rendering representative. The style signature comprises the applicable cut/volume/length/decor tags used by §2.5; retain only verified candidates before deduplication. Historically v0 used `(slot, colorId)` alone, which cannot distinguish different silhouettes of the same colour.

### 2.4 Formality

Advanced occasion/season/formality scoring remains v0.2 scope. It must not defer MVP cut/proportion
checks: being a basic item does not make every combination stylistically neutral or wearable.

### 2.5 Simplicity, currentness and whole-outfit compatibility _(required for MVP)_

PRODUCT-PLAN D4/Q5 and `capsule-methodology.md` §6.1 define **two independent item signals**:
simple construction without excessive decoration, and reviewed currentness. Reuse `basicity` for
simplicity only. Both signals enter generation and recommendation; neither replaces outfit checks.
Stage 2 delivers the complete path before MVP acceptance, including guest results. The existing
`guest-v1` colour/category evaluator remains an interim implementation until that work passes validation.

The MVP pipeline is deterministic and uses manually reviewed preset attributes and rule tables:

1. **Read attributes and version.** Resolve concrete category/role, colours, construction/decor,
   currentness review and category-appropriate fit, volume and length. Unknown required values stay
   unknown. Use one dated, versioned ruleset for every output, not separate ad hoc UI filters.
2. **Build candidates.** Enforce `colors.md`, category roles and accessory-slot/cap rules. Default
   new-item suggestions use simple + current approved presets. Personal items are retained; low
   simplicity alone is a preference penalty, not an item-level prohibition.
3. **Validate the entire look.** A reviewed table keyed by category/fit/volume/length combinations
   returns `pass`, `fail` or `unreviewed`, with a rule ID and a plain-language reason. Evaluate
   top+bottom+shoes or dress+shoes as a complete tuple; passing all pairs alone is insufficient.
   Evaluate the whole composition again when adding a bag/accessory or a structural layer. Check
   layering clearance (e.g. bulky knit inside a fitted blazer), lengths and balanced proportions.
   Two oversized pieces are not automatically invalid; a supported tuple needs a reviewed example.
   This table covers the supported MVP catalog, not all imaginable clothes. An explicitly approved
   personal-item combination may pass despite a low basicity score; preference cannot turn fail or
   unreviewed into pass.
4. **Count and recommend from the same verdicts.** Only `pass` base looks and accessory variants
   enter OPR. Only `pass` extended looks earn Layering Coverage. Deduplicate after validation using
   the style signature (§2.3), then apply the existing variation cap. Compute every candidate's
   gain by running this same evaluator after addition/replacement; never use the raw Cartesian
   product or a separate colour-only shortcut. Preserve §4's feasibility → layering → core-growth
   priorities and their distinct units. Simplicity/currentness preference is subordinate to
   feasibility and verified gains, and is never added to OPR as points.
5. **Explain failures and uncertainty.** Return the rule reason and an alternative using an existing
   item or approved preset. No verified base look means a zero-result state; unreviewed combinations
   are labelled as such, not claimed wearable or silently assigned perfect attributes. The item
   remains available for correction/review without being deleted or judging the owner's taste.

**Implementation evidence required before MVP release:** a finite category-specific attribute
vocabulary, dated current/dated reference examples, a reviewed compatibility table covering all
offered preset combinations and supported layer/accessory extensions (each tuple either explicitly
reviewed or matched by a reviewed rule), deterministic rule IDs/reasons, and application TDD before
implementation. Test at least: simple-but-dated versus simple-current; same colours/different cut;
all-pairs-pass but full-tuple-fail; bulky knit/fitted blazer; excessive decoration; unknown attributes;
favourite preservation; and excluded combinations contributing zero gain/coverage/count.

Validate on a held-out stylist-labelled set with compatible and incompatible examples: four-choice
FITB accuracy and human wearability review against the frozen colour-only baseline. Report both,
including false positives, set sizes and coverage of every supported category. The implementation
spec fixes the dataset, sample sizes and numeric pass thresholds **before** tuning/running; inability
to meet them blocks MVP release. This documentation PR does not claim measured quality or delivery.

**Versioning:** version the evaluator, cut rules and currentness reference set together. Preserve
immutable saved `guest-v1` results with their original evaluator; do not reinterpret those totals as
MVP-verified. Introduce an explicitly versioned recalculation path and explain changed totals, retaining
the old snapshot. A ruleset/catalog review update must recompute new results consistently, including
recommendation deltas, while historic snapshots remain reproducible. OpenAPI/storage changes and
frontend/backend/mobile parity fixtures belong to the implementation PR, not this doc-only change.

## 3. Outfit Productivity Ratio (OPR)

**Hero OPR = wearable outfits ÷ wardrobe pieces that build them.**

### 3.1 Numerator — wearable outfits

1. **Base look** = one valid **Core** combination: `top × bottom × shoes` **or** `dress × shoes`,
   colour-valid per §2.1 and verified by the whole-outfit checks in §2.5. Base looks are the backbone of the count.
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
   - **Deterministic MVP selection (cut extension, 2026-10-21).** Enumerate non-empty candidates that pass §2.3, deduplicate them
     by their sorted `(slot, colorId, reviewed style signature)` tuples, then select at most three with farthest-first traversal:
     start with the candidate
     having the most occupied slots (tie → lexicographically smallest tuple key); each next candidate
     maximises its minimum Hamming distance from already selected candidates across slot occupancy and
     color ID and reviewed style signature (tie → lexicographically smallest key). Rendering uses the canonical representative
     retained by §2.3.4. Fewer than three valid candidates means use all of them. `A_max = 3` and this
     rule retain the **engineering v0 cap/selection approach (2026-07-22)** within the founder-approved Q1 bounds; the reviewed style signature and full-look filtering are the required 2026-10-21 MVP extension. This is not a claim that the extension shipped in July. Quality validation must pass before MVP release.
3. **Structural layers (mid-layer, outerwear) do NOT create new counted outfits.** A base look worn
   with or without a cardigan is the _same_ outfit for OPR — layering is variety / context, not a new
   look. Their value is reported by the separate **Layering Coverage** score (§3.4).

### 3.2 Denominator — items that build the count

Only items whose category **feeds the numerator**: **Core items** (tops, bottoms, dresses, shoes) +
**Accessory items** in the six canonical slots (bag, headwear, neckwear, jewelry/watch, belt,
eyewear; exact categories in `categories.md`). **Structural-layer items are excluded
from the OPR denominator** — they are surfaced through Layering Coverage instead. All selected Core/Accessory items stay in the denominator even when none of their combinations pass cut checks; do not hide an item from the denominator to inflate OPR. This keeps the
metric consistent: a category is in _both_ numerator and denominator, or in _neither_ (and then in a
separate score). The forbidden hybrid — counting a category's items in the denominator while refusing
its contribution to the numerator (which would penalise owning a cardigan) — is not used.

### 3.3 Consistency guarantee (why this is not the forbidden hybrid)

| Counting role                       | In numerator?            | In OPR denominator? | Where its value shows   |
| ----------------------------------- | ------------------------ | ------------------- | ----------------------- |
| Core (top/bottom/dress/shoes)       | Yes (base looks)         | Yes                 | Hero OPR                |
| Accessory (all six canonical slots) | Yes (bounded variations) | Yes                 | Hero OPR                |
| Layering (mid-layer/outerwear)      | No                       | No                  | Layering Coverage score |

### 3.4 Layering Coverage (separate score)

For each valid base look, compute two flags: `midCovered = 1` when at least one eligible/color-compatible
mid-layer can be worn with every Core item in that look, and `outerCovered = 1` under the same rule for
outerwear. For `B > 0` base looks:

`Layering Coverage = 100 × Σ(midCovered + outerCovered) / (2 × B)`

Round only for display and show the two diagnostics (`mid: x/B`, `outer: y/B`) so the recommendation is
explainable. When `B = 0`, the score is **N/A**, not zero: the core-feasibility recommendation runs
first (§4). Completed MVP eligibility includes whole-look cut checks (§2.5), even when all colours
match; this does not change the formula. Advanced occasion/season scoring remains separate scope.
This is where a cardigan or coat earns its keep without inflating or deflating
hero OPR. Never merge the score into the hero number.

### 3.5 Display & delta

- Hero OPR is shown on the Capsule Result screen and on the capsule card in the Dashboard.
- Updated on every capsule change (add / remove / replace item). Shows delta ("+0.3 from last
  change"). No "good/bad" verdict — just the number.
- Accessorised count and Layering Coverage are shown as clearly-labelled secondary figures, never
  silently folded into the hero number's _meaning_.

### 3.6 Illustrative magnitude

The methodology's classic figure — "a good capsule of 30 items yields 80–150+ unique outfits" — refers
to **Core base looks** (top×bottom×shoes) before accessories. With the bounded accessory increment
(§3.1, ≤ `1 + A_max` per base look) the hero number sits **above** that core figure by **at most a
small constant factor**, not multiplicatively; the exact ranges are pending validation in the
interim baseline layer (FITB + human panel, PRODUCT-PLAN §5 Stage 1 P3). Stage 2 must validate the
complete cut-aware MVP before release. Do **not** pin a hero number or promise a minimum count in
marketing/acceptance until that complete validation fixes it: "80–150" is a historical core-only
illustration, not a guaranteed floor after wearability filtering or the accessorised hero total.

## 4. Recommendation Signal (one next item)

The free-loop "add one item" recommendation evaluates **reviewed preset candidates with category,
colour and cut attributes** using §2.5, then collapses equal winners only when their verified impact
and cut guidance are equivalent. Show the winning category, suitable cut and equally valid colours.
It uses a reachable
fixed priority and does not merge unlike scales into one score:

1. **Core feasibility:** when there is no valid base look, recommend the missing/replacement Core
   reviewed preset candidate that creates the most verified base looks (minimum one). This includes a
   compatible-colour or cut alternative when all required categories exist but cannot form a
   verified look. If no reviewed candidate restores a look, explain the missing review/conflict;
   do not invent a positive gain.
2. **Layering structure:** once a valid base look exists, if Layering Coverage is below 100%, recommend
   the reviewed mid/outer preset candidate that adds the most newly covered base looks (tie: mid before
   outer, then canonical category order). Report impact as covered looks / percentage points, never
   as outfits.
3. **Core growth:** when both layering dimensions cover every current base look, recommend the Core
   reviewed preset candidate with maximum **Δcore** (new deduplicated base looks; tie: canonical
   category order).

- **Core categories** therefore rank by **Δcore**, while **Layering** ranks by coverage gain; the fixed
  priority decides which scale is active instead of comparing their raw values.
- **Accessories are excluded from the "add one item" recommendation — by rule, not omission.** Even
  though accessories feed the hero OPR (§3.1), the single recommendation is about acquiring a garment
  that grows the wardrobe's **base looks** or fills a structural/layering gap (`gap-analysis.md`
  shopping list prioritises structural gaps). Accessories are bounded contributors and styling
  refinements, not the primary growth lever — recommending "buy a 4th scarf" would be noise. They may
  enrich the _display_ of existing looks but are never the single "add this next" answer in v0.
- **Color affects feasibility, not taste-ranking in v0.** In the guest state, derived colors can span
  incompatible groups, so candidate color can change Δcore or Layering Coverage and MUST participate
  in that calculation. The output names all max-scoring color options for the winning category; when
  their impact ties, v0 does not invent a preferred color. Stage 2 may add a separate color-gap /
  preference score to rank those ties.

## 5. Generation Trigger

Outfits are regenerated when the capsule is first created (after Journey Step 3) or when an item is
added / removed / replaced. In v0.1: static generation (batch), not real-time — the user sees a
pre-generated outfit grid. In the **guest loop** (pre-signup) the same generation runs entirely in
the browser once the guest has at least one **verified wearable** combination of ≥1 top + ≥1
bottom + ≥1 pair shoes (or ≥1 dress + ≥1 pair shoes). Category/colour presence without a §2.5 pass
is a zero-result state with explained add/replace/review alternatives, not a positive OPR result
(`capsule-methodology.md` §7.1); guest items never leave the device before signup.
