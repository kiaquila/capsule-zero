# Item Categories — Capsule Zero

> Capsule Zero proprietary methodology.
> Three wardrobe types: Women's (F), Men's (M), Mixed (if marked both F and M).

## Tops

| Category (RU) | Category (EN) | F | M | Description |
|---------------|--------------|---|---|-------------|
| Майка-топ | Tank top / Cami | ✓ | ✓ | Basic layer, round or V-neck |
| Блузка-рубашка | Button-down shirt | ✓ | ✓ | Classic collar, solid color |
| Водолазка | Turtleneck | ✓ | ✓ | Slim fit, fine knit |
| Джемпер | Crew neck sweater | ✓ | ✓ | Thin/medium knit, round neck |
| Кардиган | Cardigan | ✓ | ✓ | Open-front or buttoned |
| Бомбер | Bomber jacket | ✓ | ✓ | Lightweight outerwear, zip-up |
| Пиджак | Blazer | ✓ | ✓ | Structured or relaxed |
| Футболка | T-shirt | ✓ | ✓ | Round or V-neck, basic fit |
| Поло | Polo shirt | ✓ | ✓ | 2–3 button collar, classic cut |
| Худи, свитшот | Hoodie, sweatshirt | ✓ | ✓ | Basic cut |
| Лонгслив | Longsleeve | ✓ | ✓ | Basic cut |

## Dresses & Skirts

| Category (RU) | Category (EN) | F | M | Description |
|---------------|--------------|---|---|-------------|
| Платье | Dress | ✓ | — | Shift, A-line, or wrap |
| Юбка | Skirt | ✓ | — | Pencil, A-line, or midi |

## Bottoms

| Category (RU) | Category (EN) | F | M | Description |
|---------------|--------------|---|---|-------------|
| Брюки | Trousers | ✓ | ✓ | Classic, straight, or wide leg |
| Леггинсы | Leggings | ✓ | — | Ponte-style, wearable outside gym |
| Джинсы | Jeans | ✓ | ✓ | Straight, slim, or relaxed |
| Шорты | Shorts | ✓ | ✓ | Classic, bermuda |
| Чинос | Chinos | — | ✓ | Slim or straight, cotton twill |

## Outerwear

| Category (RU) | Category (EN) | F | M | Description |
|---------------|--------------|---|---|-------------|
| Плащ | Trench coat | ✓ | ✓ | Classic, with belt |
| Полупальто | Short coat | ✓ | ✓ | Hip-length, wool |
| Жилет | Vest / Gilet | ✓ | ✓ | Insulated or classic |
| Пальто | Coat | ✓ | ✓ | Mid-to-long, wool/cashmere |
| Пуховик | Puffer jacket | ✓ | ✓ | Light/medium, clean silhouette |
| Шуба | Fur / Faux fur coat | ✓ | — | Short/medium, solid color |
| Парка | Parka | ✓ | ✓ | Hooded, insulated |
| Куртка | Jacket | ✓ | ✓ | Leather, denim, or utility |

## Shoes

| Category (RU) | Category (EN) | F | M | Description |
|---------------|--------------|---|---|-------------|
| Сандалии | Sandals | ✓ | ✓ | Flat or low heel |
| Балетки | Ballet flats | ✓ | — | Round or pointed toe |
| Туфли | Pumps / Dress shoes | ✓ | ✓ | Heels (F) or oxford/derby (M) |
| Босоножки | Heeled sandals | ✓ | — | Open toe, block/stiletto |
| Ботильоны | Ankle boots | ✓ | ✓ | Low-to-mid heel |
| Ботинки | Boots | ✓ | ✓ | Chelsea, lace-up, or zip |
| Кроссовки/кеды | Sneakers | ✓ | ✓ | Clean, minimal design |
| Лоферы | Loafers | ✓ | ✓ | Classic penny or bit |
| Сапоги/ботфорты | Knee-high boots | ✓ | — | At/above knee |

## Bags

| Category (RU) | Category (EN) | F | M | Description |
|---------------|--------------|---|---|-------------|
| Сумка-шоппер | Tote bag | ✓ | ✓ | Large, everyday |
| Сумка-кроссбоди | Crossbody bag | ✓ | ✓ | Small-to-medium |
| Клатч | Clutch | ✓ | — | Evening or daytime |
| Рюкзак | Backpack | ✓ | ✓ | Clean lines, leather or canvas |

## Accessories

| Category (RU) | Category (EN) | F | M | Description |
|---------------|--------------|---|---|-------------|
| Шарф | Scarf | ✓ | ✓ | Wool, cashmere, or silk |
| Шапка | Beanie / Hat | ✓ | ✓ | Knit or structured |
| Шляпа-федора | Fedora hat | ✓ | ✓ | Classic brim, felt/straw |
| Кепка | Cap | ✓ | ✓ | Baseball, minimal branding |
| Украшения | Jewelry | ✓ | ✓ | Earrings, necklace, bracelet, rings |
| Ремень | Belt | ✓ | ✓ | Leather, classic buckle |
| Очки | Sunglasses | ✓ | ✓ | Wayfarer, aviator, or round |
| Часы | Watch | ✓ | ✓ | Clean dial |
| Галстук | Tie | — | ✓ | Silk, solid color or subtle |

## Category → Algorithm Role Mapping

This table is the canonical bridge from the merchandising/UI taxonomy to the OPR algorithm. The
coarse UI/API section (`tops`, `dresses_skirts`, and so on) is **not** a counting role: implementations
must resolve the concrete category first, then apply this mapping. In particular, a cardigan being
displayed under `tops` does not make it a Core top, and `dresses_skirts` must distinguish Dress from
Skirt. Built-in category seed rows persist the corresponding `algorithmRole` and nullable
`accessorySlot`; the API exposes those machine fields. Implementations must never infer them from a
localized display name.

| Algorithm role / position | Exact categories | OPR denominator | Notes |
|---|---|---|---|
| **Core · top** | Tank top / Cami; Button-down shirt; Turtleneck; T-shirt; Polo shirt; Hoodie / Sweatshirt; Longsleeve | Yes | One top per non-dress base look |
| **Core · bottom** | Skirt; Trousers; Leggings; Jeans; Shorts; Chinos | Yes | Skirt is a bottom despite the `dresses_skirts` UI/API section |
| **Core · dress** | Dress | Yes | Replaces top + bottom |
| **Core · shoes** | All categories in **Shoes** | Yes | Exactly one pair per base look |
| **Layering · mid** | Crew neck sweater; Cardigan; Bomber jacket; Blazer | No | Feeds Layering Coverage, never the OPR numerator |
| **Layering · outer** | All categories in **Outerwear** | No | Feeds Layering Coverage, never the OPR numerator |
| **Accessory · bag** | All categories in **Bags** | Yes | Slot `bag` |
| **Accessory · headwear** | Beanie / Hat; Fedora hat; Cap | Yes | Shared slot `headwear` |
| **Accessory · neckwear** | Scarf; Tie | Yes | Shared slot `neckwear` |
| **Accessory · jewelry** | Jewelry; Watch | Yes | Shared slot `jewelry` in v0 |
| **Accessory · belt** | Belt | Yes | Slot `belt` |
| **Accessory · eyewear** | Sunglasses | Yes | Slot `eyewear` |

**Custom categories:** basicity validation must also assign exactly one algorithm role and, for an
Accessory, one existing slot. A custom category without an unambiguous assignment remains a wardrobe
item but is excluded from OPR/Layering Coverage with an explanation until the user chooses the closest
supported category. Implementations must not infer counting role from the coarse API `layer` alone.

## Category Mechanics

### Quantity per Category
- Selector default: 1
- Min: 0, Max: unlimited
- Example: "T-shirt" × 3 = three separate item slots (each with its own color/photo)

### Custom Categories
- User can add their own category
- System checks for "basicity" algorithmically before accepting

### Basicity Algorithm
An item qualifies as "basic" if:
1. Simple silhouette (no complex cuts)
2. Solid color or non-complex print
3. Combinable with 70%+ of other categories
4. Not occasion-specific

### Gender Filtering
- Gender-specific categories shown only for the corresponding wardrobe type
- "Mixed" wardrobe shows ALL categories

### Minimum / Maximum
- **Min 8 categories** to create a capsule. No upper limit.
- Soft size labeling displayed next to capsule name (non-blocking, informational):
  - Up to 30 items → "Basic capsule"
  - 30–50 items → "Large capsule"
  - 50+ items → "Very large capsule"

**Total items across all 7 groups: 48 base categories** (plus unlimited custom)
