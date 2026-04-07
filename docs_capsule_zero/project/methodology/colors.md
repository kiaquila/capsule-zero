# Color System — Capsule Zero

> Capsule Zero proprietary color system. 51 colors in 5 groups.
> Source of truth for UI palette picker, compatibility engine, and auto-tagging.
> HEX values subject to visual approval — reference: `html-prototypes/color-system.html`.

---

## System Overview

| Group | Count | HEX range (lightness) |
|---|---|---|
| Achromatics | 3 | Full range (dark → light) |
| Brights | 12 | Medium lightness, high saturation |
| Pastels | 12 | High lightness, medium saturation |
| Desaturated | 12 | Medium lightness, low saturation |
| Darks | 12 | Low lightness, medium saturation |
| **Total** | **51** | |

---

## Achromatics (3)

Compatible with **all 51 colors** in the system.

| ID | Name | HEX |
|---|---|---|
| A1 | Black | `#1C1C1C` |
| A2 | Gray | `#8C8C8C` |
| A3 | White | `#F0F0F0` |

---

## Brights (12)

The 12 base hues at full saturation. Compatible with: **Brights + Achromatics**.

| ID | Name | Base Hue | HEX |
|---|---|---|---|
| B1 | Scarlet | Red | `#E82535` |
| B2 | Vermillion | Red-Orange | `#E84B20` |
| B3 | Tangerine | Orange | `#E87820` |
| B4 | Amber | Yellow-Orange | `#E8AA20` |
| B5 | Canary | Yellow | `#E8D520` |
| B6 | Chartreuse | Yellow-Green | `#7EC820` |
| B7 | Emerald | Green | `#20A84E` |
| B8 | Teal | Blue-Green | `#10A896` |
| B9 | Cobalt | Blue | `#186AE8` |
| B10 | Indigo | Blue-Violet | `#3828E8` |
| B11 | Violet | Violet | `#8820E8` |
| B12 | Fuchsia | Red-Violet | `#D020AA` |

---

## Pastels (12)

Brights + white added (high lightness, medium saturation). Compatible with: **Pastels + Achromatics**.

| ID | Name | Base Hue | HEX |
|---|---|---|---|
| P1 | Blush | Red | `#F5B5BB` |
| P2 | Peach | Red-Orange | `#F5C5B0` |
| P3 | Apricot | Orange | `#F5D5B0` |
| P4 | Beige | Yellow-Orange | `#E8D5B5` |
| P5 | Off-white | Yellow | `#FAF0E6` |
| P6 | Pale Lime | Yellow-Green | `#DCEEB0` |
| P7 | Mint | Green | `#B0EEC5` |
| P8 | Aqua | Blue-Green | `#B0EEDE` |
| P9 | Sky | Blue | `#B0CDEE` |
| P10 | Periwinkle | Blue-Violet | `#C0B8EE` |
| P11 | Lavender | Violet | `#DCB8EE` |
| P12 | Orchid | Red-Violet | `#EEB8E5` |

---

## Desaturated (12)

Brights + grey added (reduced saturation, medium lightness). Compatible with: **Desaturated + Darks + Achromatics**.

| ID | Name | Base Hue | HEX |
|---|---|---|---|
| D1 | Brick | Red | `#B86068` |
| D2 | Coral | Red-Orange | `#C07860` |
| D3 | Terracotta | Orange | `#C08A65` |
| D4 | Sand | Yellow-Orange | `#C0A268` |
| D5 | Straw | Yellow | `#B8B268` |
| D6 | Sage | Yellow-Green | `#88A865` |
| D7 | Fern | Green | `#60A878` |
| D8 | Dusty Teal | Blue-Green | `#50A095` |
| D9 | Slate | Blue | `#5082B8` |
| D10 | Dusty Indigo | Blue-Violet | `#6860B8` |
| D11 | Mauve | Violet | `#9860B8` |
| D12 | Antique Rose | Red-Violet | `#B860A2` |

---

## Darks (12)

Brights + dark added (low lightness, moderate saturation). Compatible with: **Darks + Desaturated + Achromatics**.

| ID | Name | Base Hue | HEX |
|---|---|---|---|
| K1 | Burgundy | Red | `#8C1820` |
| K2 | Rust | Red-Orange | `#8C3015` |
| K3 | Burnt Orange | Orange | `#8C5018` |
| K4 | Ochre | Yellow-Orange | `#8C6C15` |
| K5 | Olive Gold | Yellow | `#787815` |
| K6 | Olive | Yellow-Green | `#4A7A18` |
| K7 | Forest | Green | `#187838` |
| K8 | Pine | Blue-Green | `#187870` |
| K9 | Navy | Blue | `#182878` |
| K10 | Midnight | Blue-Violet | `#201878` |
| K11 | Plum | Violet | `#5A1878` |
| K12 | Mulberry | Red-Violet | `#781860` |

---

## Compatibility Matrix

| Group | + Achromatics | + Brights | + Pastels | + Desaturated | + Darks |
|---|:---:|:---:|:---:|:---:|:---:|
| **Achromatics** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Brights** | ✓ | ✓ | — | — | — |
| **Pastels** | ✓ | — | ✓ | — | — |
| **Desaturated** | ✓ | — | — | ✓ | ✓ |
| **Darks** | ✓ | — | — | ✓ | ✓ |

**Key rule:** Cross-group mixing (e.g. Brights + Pastels, Brights + Darks, Pastels + Desaturated) is **not compatible**. The system blocks these combinations and suggests creating a separate capsule.

---

## Palette Picker — UI Behavior

### Adding a color to the palette
1. User opens color picker in Journey Step 3
2. All 51 colors displayed in 5 groups
3. User selects first chromatic color → its group is "locked" (other groups grey out, except Achromatics which remain always available + the Desaturated↔Dark cross-pair if applicable)
4. User can add more colors from compatible groups only
5. Achromatics always remain selectable regardless of palette state

### Compatibility warning
When a user attempts to add an incompatible color (e.g. a Pastel when palette is Brights-based):
> *"This color doesn't match your palette tone. Add it to a separate capsule."*

### Palette lock
After capsule creation, the palette is **immutable**. Changing colors = creating a new capsule.

---

## Temperature-Based Compatibility Rules

> ⏳ **To be added.** Temperature rules (warm/cool undertone compatibility within and across groups) will be specified separately and layered on top of the group-based rules above.

---

## Notes for Implementation

- Color IDs: `A1–A3`, `B1–B12`, `P1–P12`, `D1–D12`, `K1–K12`
- Each item in the wardrobe stores 1–3 color dot IDs from this table
- Compatibility check: compare item's color group against capsule's locked group
- Achromatics (A1–A3) always pass compatibility check
- Desaturated (D-group) and Darks (K-group) pass each other's check
