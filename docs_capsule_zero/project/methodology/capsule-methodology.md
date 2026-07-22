# Capsule Methodology — Capsule Zero

> **Monetization freeze (2026-07-16):** Every coin, balance, Lava.top, billing, payment-product,
> pricing, or purchase-flow statement below is superseded historical context under `PRODUCT-PLAN.md`
> D2. Do not implement, provision, expose, test as a release gate, or use it for a new contract or
> code generation. Stage 4 will delete or replace the retained legacy after choosing a model.

> Capsule Zero proprietary methodology. Full color system: `colors.md`.

## 1. Capsule Philosophy & Basic Principles

A capsule wardrobe is a curated collection of universal items that combine into the maximum number of complete, aesthetically harmonious outfits. The goal is not minimalism for minimalism's sake, but optimization: fewer items, more looks, zero "nothing to wear" mornings.

- **Basic cuts only.** Every item has a simple, non-designer cut. This guarantees universal combinability.
- **Color unity.** All items belong to one compatible tonal group set: Brights, Pastels, Desaturated, or Darks, with Desaturated and Darks allowed to cross-pair. Achromatics (Black, Gray, White) are universal connectors compatible with everything.
- **One universal capsule in v0.1.** All seasons, all contexts. Seasonal capsules in v0.2+.
- **Quantity matters.** You can have multiple items in one category (e.g., 3 T-shirts of different colors).
- **Start from the real wardrobe.** The capsule is built from what the user already owns. The platform directs, not dictates.

**Key metric:** Outfit Productivity Ratio = wearable outfits / wardrobe pieces that build them. The
counting model (core base looks + bounded accessory variations; structural layers as a separate
coverage score) is defined in `outfit-generation.md` §3 (ratified 2026-07-21, PRODUCT-PLAN §4 Q1).
The classic "a good capsule of 30 items yields 80–150+ unique outfits" figure refers to **core base
looks** before accessories; the accessorised hero total sits above it and is fixed by algorithm-v0
validation, not asserted here.

## 2. Color Architecture

51 colors in 5 groups. Full table with HEX and IDs: see `colors.md`.

### 2.1 The Five Groups

| Group | Count | Description |
|---|---|---|
| **Achromatics** | 3 | Black `#1C1C1C`, Gray `#8C8C8C`, White `#FFFFFF` |
| **Brights** | 12 | 12 base hues at full saturation (Scarlet → Fuchsia) |
| **Pastels** | 12 | Brights + white → high lightness, soft (Blush → Orchid) |
| **Desaturated** | 12 | Brights + grey → reduced saturation (Brick → Antique Rose) |
| **Darks** | 12 | Brights + dark → low lightness (Burgundy → Mulberry) |

### 2.2 Achromatics — Universal Connectors

Achromatics (Black, Gray, White) are **always compatible** with all 51 colors in the system. They do not restrict or lock the palette group.

## 3. Palette Selection (Journey Step 3)

All 51 colors are displayed at once, organized by group. User taps to add colors to their palette.

> **Guest mode inverts this (Q3, 2026-07-21):** the pre-signup guest tool does **not** ask for a
> palette up front. The palette is **derived** from the items the guest adds ("your items are Darks +
> achromats") and shown as part of the aha result. A locked, immutable palette is only established
> when the guest registers and their items become a real capsule (§7). The picker-first flow below
> governs the post-signup **capsule** entity, not the guest loop.

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

| Group A | Group B | Verdict |
|---|---|---|
| Achromatics | Any | **✓ Always compatible** |
| Brights | Brights | **✓ Compatible** |
| Pastels | Pastels | **✓ Compatible** |
| Desaturated | Desaturated | **✓ Compatible** |
| Desaturated | Darks | **✓ Compatible** |
| Darks | Darks | **✓ Compatible** |
| Darks | Desaturated | **✓ Compatible** |
| Brights | Pastels | **✗ Blocked** |
| Brights | Desaturated | **✗ Blocked** |
| Brights | Darks | **✗ Blocked** |
| Pastels | Desaturated | **✗ Blocked** |
| Pastels | Darks | **✗ Blocked** |

**User-facing message on blocked combination:**
> *"This color doesn't match your palette tone. Add it to a separate capsule."*

## 5. Item → Palette Validation

When a user adds an item to a capsule, the system validates the item's color IDs against the palette's locked group:

| Result | Condition | User sees |
|---|---|---|
| **Match** | Item's color ID is in the palette OR is Achromatic (A1–A3) | Added silently |
| **Group match** | Item's color is in a compatible group (same group, or Desat↔Dark) | Added with note: "Close match — fits your palette" |
| **Mismatch** | Item's color group is incompatible with palette | Blocked. Message: "Color doesn't match your palette. Add to your wardrobe and create a separate capsule." |

## 6. Auto-tagging Specification

Every item must have auto-generated tags (AI-generated on addition, user-editable):

- **Name** — AI-generated (e.g., "White cotton shirt"). Editable.
- **Category** — matched against the base category list. Editable.
- **Color dots** — 1–3 dominant colors, each mapped to a color ID from the 51-color system (e.g. `B1`, `D6`, `A2`). Editable.
- **Basicity score** — internal score 0–100. Not shown to user in v0.1.

**Extended fields** (parsed automatically on import from marketplace links):
- Brand
- Material / composition
- Source URL
- Price

## 7. Limits (v0.1)

### 7.1 Guest mode (pre-signup) — lighter rules _(Q3, ratified 2026-07-21)_

The guest loop is deliberately **not** a capsule and does not enforce the capsule limits below. Its
only hard requirement is enough to produce one base look.

| Parameter | Guest value | Note |
|-----------|-------------|------|
| Required minimum | **1 top + 1 bottom + 1 pair shoes** (or 1 dress + 1 pair shoes) | Guarantees ≥ 1 core base look (`outfit-generation.md` §3). No "min 8 categories", no "min 7 items". |
| Everything else | Optional | Layers, accessories, extra items all optional — the guest may add 3–5 items and get a result. |
| Palette | Derived from items | Not asked up front (§3). No immutable lock in guest mode. |
| Persistence | localStorage, survives reload | Losing uploaded items is the worst first experience (PRODUCT-PLAN D1). |
| "Capsule" concept | Not used | The strict capsule entity (locked palette + limits below) is created only after registration, from the same items. |

Post-registration the Journey itself is also revised/lightened — that is **Этап 3**, out of scope here.

### 7.2 Capsule (post-signup)

| Parameter | Value | Note |
|-----------|-------|------|
| Capsules per user | 1 free; additional via coins | Each extra capsule costs 1 coin |
| Categories in capsule | 8 min, no max | Soft size label: Basic / Large / Very Large |
| Achromatic colors in palette | Optional | Shown first in Journey Step 3 |
| Additional chromatic colors | Max 12 | Constrained by compatibility rules |
| Total colors in palette | Max 15 | 12 chromatic + 3 achromatic |
| Items per category | Min 0, default 1, no cap (stepper) | Each with its own color/photo |
| Total items in capsule | Min 7 to create; warning at 40; hard limit 50 | At 40–50: suggest creating a new capsule instead |

## 8. Shared Item Database

- Items imported from marketplace links can be flagged as "public"
- Public items are added to a shared database
- Other users can find these items via "Search from Catalog" (Journey Step 3)
- Items from shared DB get a "From catalog" badge
- Auto-tagging is pre-filled for shared items
