# Outfit Generation & OPR — Capsule Zero

> Source: Styling Guide v1.3, Section 5. Outfits are generated algorithmically. In v0.1 — static (view only), generated on capsule creation or modification.

## 1. Outfit Structure (7 Layers)

| Layer | Categories | Rule |
|-------|-----------|------|
| **1: Basic top** | T-shirt, button-down shirt, turtleneck, tank top/cami | Mandatory (unless dress) |
| **1 alt: Dress** | Any dress category | Replaces layers 1+2 |
| **2: Bottom** | Trousers, jeans, skirt, shorts, leggings | Mandatory (unless dress) |
| **3: Mid layer** | Cardigan, blazer, crew neck sweater | Optional — adds variety |
| **4: Outerwear** | Coat, jacket, parka, puffer jacket | Optional — contextual |
| **5: Shoes** | Any shoes category | 1 pair per outfit |
| **6: Bag** | Any bags category | Optional, 0–1 |
| **7: Accessories** | Scarf, hat, jewelry, belt | Optional, 0–3 |

## 2. Combination Rules

### Color Harmony
All items in a properly assembled capsule match by color by definition — the palette guarantees compatibility through group-based matching, with achromats always allowed and Desaturated/Dark allowed as a cross-pair. No limit on the number of colors per outfit beyond the capsule palette itself. **Any combination of items from the capsule palette is color-valid.** This is the key advantage of the Capsule Zero color methodology.

### Category Logic
Some categories don't combine:
- Two bottoms in one outfit
- Dress + separate top/bottom (dress replaces layers 1+2)
- Two coats

### Formality
In v0.1 simplified: all basic items are considered neutral. Formality scoring in v0.2.

### Maximum Outfits
No limit on the number of generated outfits. Ranked by diversity (variety of combinations).

## 3. Outfit Productivity Ratio (OPR)

**Formula:** OPR = number of generated outfits / number of items in capsule

- Displayed on the capsule card in the Dashboard
- Updated on every capsule change (add/remove/replace item)
- Shows delta: "+0.3 from last change" — user sees how each item affects productivity
- No "good/bad" evaluation — just a number
- A good capsule of 30 items yields 80–150+ unique outfits (OPR 2.7–5.0+)

**Display:**
- Hero metric on Capsule Result screen
- Shown on capsule card in Dashboard
- Delta shown after every modification

## 4. Generation Trigger

Outfits are regenerated when:
- Capsule is first created (after Journey Step 3)
- Item is added to capsule
- Item is removed from capsule
- Item is replaced in capsule

In v0.1: static generation (batch), not real-time. User sees pre-generated outfit grid.
