# Capsule Methodology — Capsule Zero

> **Monetization freeze (2026-07-16):** Every coin, balance, Lava.top, billing, payment-product,
> pricing, or purchase-flow statement below is superseded historical context under `PRODUCT-PLAN.md`
> D2. Do not implement, provision, expose, test as a release gate, or use it for a new contract or
> code generation. Stage 4 will delete or replace the retained legacy after choosing a model.

> Capsule Zero proprietary methodology. Full color system: `colors.md`.

## 1. Capsule Philosophy & Basic Principles

A capsule wardrobe is a curated collection of universal items that combine into the maximum number of complete, aesthetically harmonious outfits. The goal is not minimalism for minimalism's sake, but optimization: fewer items, more looks, zero "nothing to wear" mornings.

- **Simple, current cuts by default.** Automatic capsule suggestions favour simple construction without excessive decoration and separately reviewed current silhouettes. This describes the garment, never its brand or price. Neither property guarantees that two pieces work together: every generated outfit must also pass the cut/proportion rules in `outfit-generation.md` §2.5.
- **Color unity.** All items belong to one compatible tonal group set: Brights, Pastels, Desaturated, or Darks, with Desaturated and Darks allowed to cross-pair. Achromatics (Black, Gray, White) are universal connectors compatible with everything.
- **One universal capsule in v0.1.** All seasons, all contexts. Seasonal capsules in v0.2+.
- **Quantity matters.** You can have multiple items in one category (e.g., 3 T-shirts of different colors).
- **Start from the real wardrobe.** The capsule is built from what the user already owns. The platform directs, not dictates.

**Key metric:** Outfit Productivity Ratio = wearable outfits ÷ wardrobe pieces that build them. The
counting model (core base looks + bounded accessory variations; structural layers as a separate
coverage score) is defined in `outfit-generation.md` §3 (ratified 2026-07-21, PRODUCT-PLAN §4 Q1).
The historical “80–150+ outfits from 30 items” illustration refers to core base looks before accessories. It is not a guaranteed minimum: validate real counts after the complete MVP wearability checks before any marketing claim.

## 2. Color Architecture

51 colors in 5 groups. Full table with HEX and IDs: see `colors.md`.

### 2.1 The Five Groups

| Group           | Count | Description                                                |
| --------------- | ----- | ---------------------------------------------------------- |
| **Achromatics** | 3     | Black `#1C1C1C`, Gray `#8C8C8C`, White `#FFFFFF`           |
| **Brights**     | 12    | 12 base hues at full saturation (Scarlet → Fuchsia)        |
| **Pastels**     | 12    | Brights + white → high lightness, soft (Blush → Orchid)    |
| **Desaturated** | 12    | Brights + grey → reduced saturation (Brick → Antique Rose) |
| **Darks**       | 12    | Brights + dark → low lightness (Burgundy → Mulberry)       |

### 2.2 Achromatics — Universal Connectors

Achromatics (Black, Gray, White) are **always compatible** with all 51 colors in the system. They do not restrict or lock the palette group.

## 3. Palette Selection (Journey Step 3)

All 51 colors are displayed at once, organized by group. User taps to add colors to their palette.

> **Guest mode inverts this (Q3, 2026-07-21):** the pre-signup guest tool does **not** ask for a
> palette up front. The palette is **derived** from the items the guest adds ("your items are Darks +
> achromats") and shown as part of the aha result. Registration saves those items as `uncapsulated`;
> it does not establish a locked palette or create a capsule. A locked, immutable palette is only
> established later when the user explicitly promotes an eligible set under §7.2. The picker-first
> flow below governs that strict **capsule** entity, not the guest loop.

### Selection logic

1. Achromatics (3 colors) — always available, always selectable, never locked out
2. First chromatic color selected → that color's **group is locked** for this palette
3. Compatible cross-group (Desaturated ↔ Darks) remains available if locked group is Desaturated or Dark
4. Incompatible groups are greyed out
5. User can deselect any color at any time before confirmation

### Palette Preview

- Color dot strip shows selected palette in real time
- User can add/remove before hitting "Create capsule"

### Palette Lock

- **After confirmation, the palette is immutable for this capsule**
- Changing palette = creating a new capsule
- Incompatible items are BLOCKED with suggestion to create a separate capsule

## 4. Compatibility Rules (Under the Hood)

| Group A     | Group B     | Verdict                 |
| ----------- | ----------- | ----------------------- |
| Achromatics | Any         | **✓ Always compatible** |
| Brights     | Brights     | **✓ Compatible**        |
| Pastels     | Pastels     | **✓ Compatible**        |
| Desaturated | Desaturated | **✓ Compatible**        |
| Desaturated | Darks       | **✓ Compatible**        |
| Darks       | Darks       | **✓ Compatible**        |
| Darks       | Desaturated | **✓ Compatible**        |
| Brights     | Pastels     | **✗ Blocked**           |
| Brights     | Desaturated | **✗ Blocked**           |
| Brights     | Darks       | **✗ Blocked**           |
| Pastels     | Desaturated | **✗ Blocked**           |
| Pastels     | Darks       | **✗ Blocked**           |

**User-facing message on blocked combination:**

> _"This color doesn't match your palette tone. Add it to a separate capsule."_

## 5. Item → Palette Validation

When a user adds an item to a capsule, the system validates the item's color IDs against the palette's locked group:

| Result          | Condition                                                         | User sees                                                                                                 |
| --------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Match**       | Item's color ID is in the palette OR is Achromatic (A1–A3)        | Added silently                                                                                            |
| **Group match** | Item's color is in a compatible group (same group, or Desat↔Dark) | Added with note: "Close match — fits your palette"                                                        |
| **Mismatch**    | Item's color group is incompatible with palette                   | Blocked. Message: "Color doesn't match your palette. Add to your wardrobe and create a separate capsule." |

## 6. Auto-tagging Specification

Every item needs the following attributes. MVP own-image presets are manually labelled and reviewed;
future photo tagging may suggest attributes for confirmation. A new ML service is not required for MVP.

- **Name** — AI-generated (e.g., "White cotton shirt"). Editable.
- **Category** — matched against the base category list. Editable.
- **Color dots** — 1–3 dominant colors, each mapped to a color ID from the 51-color system (e.g. `B1`, `D6`, `A2`). Editable.
- **Basicity score** — internal simplicity score 0–100 under §6.1. It is not a modernity or outfit-compatibility score and is not shown numerically in v0.1.
- **Cut attributes and review** — separate simplicity, currentness and proportion metadata under §6.1; part of the durable attributes layer, independent of the disposable image (PRODUCT-PLAN D6).

**Extended fields** (parsed automatically on import from marketplace links):

- Brand
- Material / composition
- Source URL
- Price

### 6.1 MVP cut attributes and explainable rules _(owner decision, 2026-10-21)_

This is a **required MVP contract**, delivered in PRODUCT-PLAN Stage 2 before MVP acceptance,
including the pre-signup flow. It is not implemented by this documentation change. The currently
shipped `guest-v1` evaluator is an interim colour/category baseline, not evidence of this gate passing.

| Signal                  | MVP rule                                                                                                                                                                                                                                                      | What it must not mean                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Simplicity (`basicity`) | Record construction as `simple` or `complex` and decoration as `none/minimal` or `excessive`. Both favourable → 100; one → 50; neither → 0. Missing either → unknown, not 100. These initial engineering values are versioned, subject to quality validation. | Designer brand, price, popularity or age do not determine simplicity. An uncomplicated print alone does not make a cut complex. |
| Currentness             | Separate `current`, `dated` or `unreviewed` verdict against dated, category-specific reference examples, with reviewer/source, review date and ruleset version. Review at least every six months and when examples change; overdue review becomes unreviewed. | Simple ≠ current; old purchase ≠ dated; latest trend ≠ required. Do not train this judgement on the paper's historical photos.  |
| Proportions             | Category-appropriate fit/volume and length; e.g. fitted/regular/relaxed/oversized, cropped/regular/long and light/medium/bulky. Use `not applicable` where meaningful; missing required attributes remain unknown.                                            | A category name or a high simplicity score cannot prove compatibility of the whole outfit.                                      |

MVP default recommendation candidates come from our manually approved **simple + current** presets.
Existing own-image assets must be reviewed, not automatically grandfathered. Store review evidence
against the actual preset attributes/image revision. A changed silhouette requires re-review; replacing
an equivalent image alone must not erase the durable record. The implementation spec defines the
concrete category vocabularies and reviewed examples before application code is written.

User-owned complex, decorated or dated items remain in the wardrobe and may be saved/favourited.
A low simplicity score alone never blocks saving, capsule membership (subject to existing palette
rules) or a favourite. It lowers styling preference, with a neutral reason; automatic new-item
suggestions still use the approved pool. Actual wearability is a **whole-outfit** decision (§2.5),
not a blanket ban on a user's item. Missing attributes are shown as unreviewed: keep the item, offer
attribute confirmation or a reviewed preset alternative, and exclude unverified combinations from
the verified outfit count. Confirming factual tags does not by itself certify currentness; that
verdict needs the dated reference review.

### 6.2 MVP quality and delivery gate

One versioned ruleset must drive generation, OPR, Layering Coverage, gaps and recommendation gains
before and after signup. Include all supported garments, shoes, accessories and layers; `not applicable`
is explicit, never a bypass. The counting formula stays unchanged; only verified combinations feed
its numerator and coverage. No averaged simplicity/currentness score can compensate for an invalid look.
Validation, explanations, unknown handling and snapshot versioning are defined in
`outfit-generation.md` §2.5. Completing Stage 1 or merging these docs does not complete this gate.

## 7. Limits (v0.1)

### 7.1 Guest mode (pre-signup) — lighter rules _(Q3, ratified 2026-07-21)_

The guest loop is deliberately **not** a capsule and does not enforce the capsule limits below. Its
only hard requirement is enough to produce one base look.

| Parameter         | Guest value                                                                                                                               | Note                                                                                                                                                                                                                                                                                                          |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Required minimum  | **At least one verified wearable** top + bottom + shoes combination (or dress + shoes): colour, category and whole-outfit cut checks pass | Guarantees ≥ 1 verified core base look (`outfit-generation.md` §2.5/§3). Category/colour validity alone is insufficient for the completed MVP. No "min 8 categories", no "min 7 items".                                                                                                                       |
| Everything else   | Optional                                                                                                                                  | Layers, accessories, extra items all optional — the guest may add 3–5 items and get a result.                                                                                                                                                                                                                 |
| Palette           | Derived from items                                                                                                                        | Not asked up front (§3). No immutable lock in guest mode. Incompatible items may remain in the guest wardrobe, but only mutually compatible Core combinations count as looks.                                                                                                                                 |
| Persistence       | localStorage, survives reload                                                                                                             | Losing uploaded items is the worst first experience (PRODUCT-PLAN D1).                                                                                                                                                                                                                                        |
| Zero-result state | Explain + alternatives                                                                                                                    | If required roles exist but no verified Core combination does, explain the colour/cut conflict or missing review and offer reviewed preset/add/replace/attribute-confirmation paths. Do not show a fake positive OPR or open the result gate yet. Unreviewed is not a verdict that the user's taste is wrong. |
| Save after signup | `uncapsulated` wardrobe entries                                                                                                           | Persist the same guest items without forcing capsule thresholds. Recompute and preserve the guest result/full plan from those entries; create a strict capsule only when the user later chooses to promote a compatible set that satisfies §7.2.                                                              |
| "Capsule" concept | Not used in guest UI                                                                                                                      | Registration does not silently create an invalid capsule or force extra items. The strict entity remains post-signup and retains its locked-palette/limit invariants.                                                                                                                                         |

Post-registration the Journey itself is also revised/lightened — that is **Этап 3**, out of scope here.

### 7.2 Capsule (post-signup)

| Parameter                    | Value                                         | Note                                             |
| ---------------------------- | --------------------------------------------- | ------------------------------------------------ |
| Capsules per user            | 1 free; additional via coins                  | Each extra capsule costs 1 coin                  |
| Categories in capsule        | 8 min, no max                                 | Soft size label: Basic / Large / Very Large      |
| Achromatic colors in palette | Optional                                      | Shown first in Journey Step 3                    |
| Additional chromatic colors  | Max 12                                        | Constrained by compatibility rules               |
| Total colors in palette      | Max 15                                        | 12 chromatic + 3 achromatic                      |
| Items per category           | Min 0, default 1, no cap (stepper)            | Each with its own color/photo                    |
| Total items in capsule       | Min 7 to create; warning at 40; hard limit 50 | At 40–50: suggest creating a new capsule instead |

## 8. Shared Item Database

- Items imported from marketplace links can be flagged as "public"
- Public items are added to a shared database
- Other users can find these items via "Search from Catalog" (Journey Step 3)
- Items from shared DB get a "From catalog" badge
- Auto-tagging is pre-filled for shared items
