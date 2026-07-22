# Glossary — Capsule Zero

> Domain-specific terminology used across the project. Multilingual equivalents where available. Active v0.1 locales are EN and RU; ES-AR entries are retained as v0.2 reference material.

## A

### Achromat / Achromatic Color
A color without a hue: Black, Gray, White (3 colors). Achromats are universal connectors — always compatible with each other and with any chromatic color. → Full color IDs and HEX: `project/methodology/colors.md`
- **RU:** Ахроматический цвет
- **ES-AR:** Color acromático

### Auto-tagging
AI-driven classification of items upon addition: name, category, color dots, basicity score. User-editable. Extended fields (brand, material, source URL) parsed automatically on import from marketplace links.
- **RU:** Авторазметка
- **ES-AR:** Etiquetado automático

## B

### Basicity / Basic Item
How "basic" an item is: simple silhouette, solid color potential, high combinability (70%+ of categories), not occasion-specific. Internal score 0–100, not shown to user in v0.1.
- **RU:** Базовость

### Basic Capsule
A capsule built from basic items — simple cuts, solid colors, maximum combinability. Size label for capsules with up to 30 items.
- **RU:** Базовая капсула

## C

### Capsule / Capsule Wardrobe
A curated collection of universal items that combine into the maximum number of complete, aesthetically harmonious outfits. Not minimalism for its own sake, but optimization.
- **RU:** Капсула / Капсульный гардероб
- **ES-AR:** Cápsula

### Color Dots
1–3 circles representing the dominant colors of an item, extracted from the photo. Each dot carries HEX value + classification (group, warm/cool metadata, achromaticity). User-editable.
- **RU:** Цветовые точки

### Color Temperature
Classification of color undertone: Warm (yellow/orange), Cool (blue/pink), or Neutral. Temperature is display/explanation metadata; compatibility is governed by color group.
- **RU:** Цветовая температура

### Compatibility Rules
The rules governing which colors can coexist in a palette: achromatics are always compatible with everything; chromatic colors are compatible when they share a group or form the Desaturated↔Dark cross-pair. → Full rules: `project/methodology/capsule-methodology.md`

## E

### Emotional Arc
The user's emotional journey through the app: Attraction (landing) → Trust (registration, dashboard) → Creativity (journey, import) → Satisfaction (result, management).

## G

### Gap Analysis
Detection of missing items that would increase the capsule's outfit potential. Four rules: structural gaps, color gaps, combinability gaps, layer balance.
- **RU:** Gap-анализ
- **ES-AR:** Qué te falta

### Glassmorphism
The UI design language used throughout Capsule Zero: frosted glass surfaces with `backdrop-filter: blur`, translucent layers, subtle borders. Defines the premium aesthetic.

### Glass Panel
The primary container component: translucent frosted glass surface. Two variants: main panels (blur 40px) and nav/bottom sheets (blur 44px). → Exact token values: `project/frontend/styling.md`

### Guided Journey
The 3-step capsule creation flow: Step 1 (wardrobe type) → Step 2 (categories) → Step 3 (colors + items).

## I

### Intentional Curator
The target user persona: 25–40, upper-middle income, "new money mindset meets old money taste". Values quality over quantity, slow fashion, conscious consumption.

## O

### OPR (Outfit Productivity Ratio)
The hero metric: wearable outfits ÷ wardrobe pieces that build them (core + accessory items; structural layers → separate Layering Coverage score). "80–150 outfits from 30 items" is a floor for core base looks; the accessorised total is higher and fixed by algorithm-v0 validation. Counting model: `project/methodology/outfit-generation.md` §3 (ratified 2026-07-21). Displayed on capsule cards, updated on every change, shows delta.
- **RU:** Outfit Productivity Ratio (используется без перевода)

## P

### Palette
The set of colors chosen for a capsule in Journey Step 3. Achromats appear first in the picker but remain optional. Users can select any number of compatible colors. Locked after confirmation — immutable for the lifetime of that capsule.
- **RU:** Палитра
- **ES-AR:** Paleta

### Palette Lock
After the user confirms their palette in Journey Step 3, it becomes immutable. Changing palette = creating a new capsule. This is a core methodology constraint from FVD v1.1.
- **RU:** Блокировка палитры

## S

### Saturation
The intensity/lightness family of a color: Bright, Pastel, Desaturated, or Dark. Colors in a capsule can combine when they share the same group, with Desaturated and Dark allowed to cross-pair.
- **RU:** Насыщенность

### Screenshot Test
The primary quality criterion: "Will the user screenshot this screen and send to a friend?" If not — back to revision. Applied to every screen in the app.

### Shared Item Database
Items imported from marketplace links that are flagged as public. Other users can find them via "Search from Catalog". Single record with a publicity flag, no duplication. Personal photos never become public.

### Shopping List
The prioritized list of recommended purchases based on gap analysis. Four columns: category, recommended color, priority (High/Medium/Low), and role-specific impact (core base looks or Layering Coverage).
- **RU:** Шоппинг-лист
- **ES-AR:** Lista de compras

## T

### Capsule Zero Color Methodology
Capsule Zero's proprietary color circle methodology that forms the basis of capsule building logic: group harmony, achromatic connectors, and warm/cool display metadata.

## U

### Uncapsulated
Items in the user's wardrobe that are not assigned to any capsule. Displayed in a separate section. Can be added to a capsule, moved to sale, or moved to repair.

## W

### Wardrobe Type
The gender classification chosen in Journey Step 1: Women's (F), Men's (M), or Mixed. Determines which categories are available in Step 2.
