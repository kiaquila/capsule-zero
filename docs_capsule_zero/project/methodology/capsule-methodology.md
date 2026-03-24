# Capsule Methodology — Capsule Zero

> Capsule Zero proprietary methodology. Full color system: `colors.md`.

## 1. Capsule Philosophy & Basic Principles

A capsule wardrobe is a curated collection of universal items that combine into the maximum number of complete, aesthetically harmonious outfits. The goal is not minimalism for minimalism's sake, but optimization: fewer items, more looks, zero "nothing to wear" mornings.

- **Basic cuts only.** Every item has a simple, non-designer cut. This guarantees universal combinability.
- **Color unity.** All items belong to one tonal group (Brights, Pastels, Desaturated, or Darks). Achromatics (Onyx, Stone, Chalk) are universal connectors compatible with everything.
- **One universal capsule in v0.1.** All seasons, all contexts. Seasonal capsules in v0.2+.
- **Quantity matters.** You can have multiple items in one category (e.g., 3 T-shirts of different colors).
- **Start from the real wardrobe.** The capsule is built from what the user already owns. The platform directs, not dictates.

**Key metric:** Outfit Productivity Ratio = number of outfits / number of items. A good capsule of 30 items yields 80–150+ unique outfits.

## 2. Color Architecture

51 colors in 5 groups. Full table with HEX and IDs: see `colors.md`.

### 2.1 The Five Groups

| Group | Count | Description |
|---|---|---|
| **Achromatics** | 3 | Black `#1C1C1C`, Gray `#8C8C8C`, White `#F0F0F0` |
| **Brights** | 12 | 12 base hues at full saturation (Scarlet → Fuchsia) |
| **Pastels** | 12 | Brights + white → high lightness, soft (Blush → Orchid) |
| **Desaturated** | 12 | Brights + grey → reduced saturation (Brick → Antique Rose) |
| **Darks** | 12 | Brights + dark → low lightness (Burgundy → Mulberry) |

### 2.2 Achromatics — Universal Connectors

Achromatics (Black, Gray, White) are **always compatible** with all 51 colors in the system. They do not restrict or lock the palette group.

## 3. Palette Selection (Journey Step 3)

All 51 colors are displayed at once, organized by group. User taps to add colors to their palette.

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

## 7. Capsule Limits (v0.1)

| Parameter | Value | Note |
|-----------|-------|------|
| Capsules per user | 1 free; additional via coins | Each extra capsule costs 1 coin |
| Categories in capsule | 8 min, no max | Soft size label: Basic / Large / Very Large |
| Achromatic colors in palette | Optional | Shown first in Journey Step 3 |
| Additional chromatic colors | No hard cap | Constrained by compatibility rules |
| Total colors in palette | No hard cap | Constrained by compatibility rules |
| Items per category | Min 0, default 1, no cap (stepper) | Each with its own color/photo |
| Total items in capsule | Min 7 to create; warning at 40; hard limit 50 | At 40–50: suggest creating a new capsule instead |

## 8. Shared Item Database

- Items imported from marketplace links can be flagged as "public"
- Public items are added to a shared database
- Other users can find these items via "Search from Catalog" (Journey Step 3)
- Items from shared DB get a "From catalog" badge
- Auto-tagging is pre-filled for shared items
