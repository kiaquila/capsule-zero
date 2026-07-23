import { getCategoryById, type Category } from "@/lib/categories";
import type { AppLocale } from "@/i18n/routing";
import type { ProviderRegistry, WardrobeEntry } from "@/lib/providers";
import type { Capsule, ColorPoint } from "@/types";
import type { PersistedMockSession } from "@/features/auth/session";
import {
  calculateOutfitProductivity,
  type LayeringCoverage,
  type ProductivityItem,
} from "@/lib/outfit-productivity";
import { isDominantColorCompatibleWithPalette } from "@/lib/color-compatibility";

export type CapsuleResultItemSource = "photo" | "marketplace" | "catalog";

export interface CapsuleResultCategory {
  id: string;
  label: string;
  section: Category["section"] | "custom";
  colorHint: string;
  colorHex: string;
  count: number;
}

export interface CapsuleResultItem extends ProductivityItem {
  id: string;
  name: string;
  categoryId: string;
  categoryLabel: string;
  section: Category["section"] | "custom";
  brand?: string;
  material?: string;
  price?: number;
  imageUrl?: string;
  colorPoints: ColorPoint[];
  source: CapsuleResultItemSource;
  favorite: boolean;
  fromCatalog: boolean;
  compatible: boolean;
  compatibilityNote?: string;
}

export interface CapsuleResultGap {
  id: string;
  categoryId: string;
  categoryLabel: string;
  colorHint: string;
  colorHex: string;
  type: "structural" | "color" | "combinability" | "balance";
  reason: string;
  impact: number;
  priority: "high" | "medium" | "low";
}

export interface CapsuleResultSnapshot {
  profile: {
    displayName: string;
    email: string;
    initials: string;
  };
  capsule: {
    id: string;
    name: string;
    garderType: Capsule["garderType"];
    palette: ColorPoint[];
    itemCount: number;
    outfitCount: number;
    categoryCount: number;
    opr: string;
    oprValue: number;
    oprDelta: string;
    layeringCoverage: LayeringCoverage;
    createdAt: string;
  } | null;
  categories: CapsuleResultCategory[];
  items: CapsuleResultItem[];
  availableItems: CapsuleResultItem[];
  gaps: CapsuleResultGap[];
}

interface BuildCapsuleResultSnapshotOptions {
  registry: ProviderRegistry;
  session: PersistedMockSession;
  locale: AppLocale;
}

const SYNTHETIC_INCOMPATIBLE_COLOR: ColorPoint = {
  hex: "#E9B7C6",
  name: "Blush",
  temperature: "warm",
  group: "pastel",
  shade: "pastel",
  hue: "red-violet",
  isAchromatic: false,
};

export async function buildCapsuleResultSnapshot({
  registry,
  session,
  locale,
}: BuildCapsuleResultSnapshotOptions): Promise<CapsuleResultSnapshot> {
  const profile = await registry.profiles.getProfile(session.userId);
  const [capsule, wardrobeItems, catalogResults] = await Promise.all([
    registry.capsules.getCurrentCapsule(session.userId),
    registry.wardrobe.listItems(session.userId),
    registry.catalogSearch.search(session.userId, ""),
  ]);

  const palette = capsule
    ? [...capsule.palette.achromaticColors, ...capsule.palette.selectedColors]
    : [];
  const capsuleItemIds = new Set(capsule?.itemIds ?? []);
  const categories = capsule ? buildCategories(capsule, locale) : [];
  const capsuleItems = wardrobeItems
    .filter((item) => capsuleItemIds.has(item.id))
    .map((item) => buildItem(item, locale, palette));
  const wardrobeCandidates = wardrobeItems
    .filter(isCapsulePickerEligible)
    .filter((item) => !capsuleItemIds.has(item.id))
    .map((item) => buildItem(item, locale, palette));
  const catalogCandidates = catalogResults.map((result) =>
    buildItem(result.item, locale, palette),
  );
  const availableItems = uniqueItems([
    ...wardrobeCandidates,
    ...catalogCandidates,
    buildSyntheticIncompatibleItem(locale, palette),
  ]);
  const productivity = capsule
    ? calculateOutfitProductivity(capsule.outfitCount, capsuleItems)
    : null;

  return {
    profile: {
      displayName: session.name ?? profile.displayName,
      email: session.email,
      initials: buildInitials(
        session.name ?? profile.displayName ?? session.email,
      ),
    },
    capsule: capsule
      ? {
          id: capsule.id,
          name: capsule.name,
          garderType: capsule.garderType,
          palette,
          itemCount: capsuleItems.length,
          outfitCount: capsule.outfitCount,
          categoryCount: capsule.categories.length,
          opr: productivity?.opr ?? "0.0",
          oprValue: productivity?.oprValue ?? 0,
          oprDelta: "+0.3",
          layeringCoverage: productivity?.layeringCoverage ?? {
            score: null,
            baseLookCount: 0,
            midCoveredLookCount: 0,
            outerCoveredLookCount: 0,
          },
          createdAt: capsule.createdAt,
        }
      : null,
    categories,
    items: capsuleItems,
    availableItems,
    gaps: capsule
      ? buildInitialGaps(capsule, categories, capsuleItems, locale)
      : [],
  };
}

export function isItemCompatibleWithPalette(
  itemColors: ColorPoint[],
  palette: ColorPoint[],
): boolean {
  return isDominantColorCompatibleWithPalette(itemColors, palette);
}

function buildItem(
  item: WardrobeEntry,
  locale: AppLocale,
  palette: ColorPoint[],
): CapsuleResultItem {
  const category = getCategoryById(item.categoryId);
  const compatible = isItemCompatibleWithPalette(item.colorPoints, palette);

  return {
    id: item.id,
    itemId: item.id,
    name: item.name,
    categoryId: item.categoryId,
    categoryLabel: categoryName(item.categoryId, locale),
    section: category?.section ?? "custom",
    algorithmRole: category?.algorithmRole ?? null,
    accessorySlot: category?.accessorySlot ?? null,
    dominantColor: item.colorPoints[0],
    brand: item.brand,
    material: item.material,
    price: item.price,
    imageUrl: resolvePublicImageUrl(item.imageUrl ?? item.photoUrl),
    colorPoints: item.colorPoints,
    source: sourceType(item),
    favorite: item.favorite,
    fromCatalog: item.fromCatalog,
    compatible,
    compatibilityNote: compatible
      ? undefined
      : "Candidate color is outside the immutable capsule palette.",
  };
}

function buildSyntheticIncompatibleItem(
  locale: AppLocale,
  palette: ColorPoint[],
): CapsuleResultItem {
  const categoryId = "scarf";
  const compatible = isItemCompatibleWithPalette(
    [SYNTHETIC_INCOMPATIBLE_COLOR],
    palette,
  );

  return {
    id: "stage-1-incompatible-blush-scarf",
    itemId: "stage-1-incompatible-blush-scarf",
    name: locale === "ru" ? "Шелковый шарф Blush" : "Blush silk scarf",
    categoryId,
    categoryLabel: categoryName(categoryId, locale),
    section: "accessories",
    algorithmRole: "accessory",
    accessorySlot: "neckwear",
    dominantColor: SYNTHETIC_INCOMPATIBLE_COLOR,
    brand: "Stage 1 catalog",
    material: "Silk",
    price: 96,
    colorPoints: [SYNTHETIC_INCOMPATIBLE_COLOR],
    source: "catalog",
    favorite: false,
    fromCatalog: true,
    compatible,
    compatibilityNote: compatible
      ? undefined
      : "Pastel is incompatible with the current Dark/Desaturated palette.",
  };
}

function buildCategories(
  capsule: Capsule,
  locale: AppLocale,
): CapsuleResultCategory[] {
  return capsule.categories.map((entry, index) => {
    const color = pickColorHint(capsule.palette, index);

    return {
      id: entry.categoryId,
      label: categoryName(entry.categoryId, locale),
      section: getCategoryById(entry.categoryId)?.section ?? "custom",
      colorHint: colorName(color, locale),
      colorHex: color.hex,
      count: entry.count,
    };
  });
}

function buildInitialGaps(
  capsule: Capsule,
  categories: CapsuleResultCategory[],
  items: CapsuleResultItem[],
  locale: AppLocale,
): CapsuleResultGap[] {
  const coveredCategories = new Set(items.map((item) => item.categoryId));
  const explicitGaps = capsule.gapAnalysis.map((gap, index) => {
    const category = categories.find((item) => item.id === gap.categoryId);
    const color = pickColorHint(capsule.palette, index + 2);

    return {
      id: `gap-${gap.categoryId}`,
      categoryId: gap.categoryId,
      categoryLabel: category?.label ?? categoryName(gap.categoryId, locale),
      colorHint:
        translateColorHint(gap.colorHint, locale) ??
        category?.colorHint ??
        colorName(color, locale),
      colorHex: category?.colorHex ?? color.hex,
      type: "structural" as const,
      reason: translateGapReason(gap.reason, locale),
      impact: Math.max(8, 12 - index * 2),
      priority: index === 0 ? ("high" as const) : ("medium" as const),
    };
  });

  const explicitIds = new Set(explicitGaps.map((gap) => gap.categoryId));
  const derivedGaps = categories
    .filter((category) => !coveredCategories.has(category.id))
    .filter((category) => !explicitIds.has(category.id))
    .map((category, index) => ({
      id: `gap-derived-${category.id}`,
      categoryId: category.id,
      categoryLabel: category.label,
      colorHint: category.colorHint,
      colorHex: category.colorHex,
      type: gapTypeForSection(category.section),
      reason: buildGapReason(category.section, locale),
      impact: Math.max(4, 10 - index * 2),
      priority:
        index < 2
          ? ("high" as const)
          : index < 4
            ? ("medium" as const)
            : ("low" as const),
    }));

  return [...explicitGaps, ...derivedGaps];
}

function pickColorHint(palette: Capsule["palette"], index: number): ColorPoint {
  const colors = [...palette.selectedColors, ...palette.achromaticColors];
  return colors[index % colors.length] ?? palette.achromaticColors[0];
}

function sourceType(item: WardrobeEntry): CapsuleResultItemSource {
  if (item.fromCatalog || item.sourceType === "catalog") {
    return "catalog";
  }

  return item.sourceType === "marketplace" ? "marketplace" : "photo";
}

function isCapsulePickerEligible(item: WardrobeEntry): boolean {
  return item.status === "active" || item.status === "uncapsulated";
}

function categoryName(categoryId: string, locale: AppLocale): string {
  const category = getCategoryById(categoryId);

  if (!category) {
    return categoryId;
  }

  return locale === "ru" ? category.nameRu : category.nameEn;
}

function gapTypeForSection(
  section: CapsuleResultCategory["section"],
): CapsuleResultGap["type"] {
  if (section === "shoes" || section === "outerwear") {
    return "structural";
  }

  if (section === "bags" || section === "accessories") {
    return "balance";
  }

  return "combinability";
}

function buildGapReason(
  section: CapsuleResultCategory["section"],
  locale: AppLocale,
): string {
  if (locale === "ru") {
    if (section === "shoes") {
      return "Закрывает базовый слой обуви и повышает число повседневных комплектов.";
    }
    if (section === "bags" || section === "accessories") {
      return "Балансирует финальные слои капсулы без изменения палитры.";
    }
    return "Добавляет недостающий слой и расширяет совместимые сочетания.";
  }

  if (section === "shoes") {
    return "Completes the shoe layer and unlocks more everyday outfits.";
  }
  if (section === "bags" || section === "accessories") {
    return "Balances finishing layers without changing the palette.";
  }
  return "Adds a missing layer and expands compatible combinations.";
}

function colorName(color: ColorPoint, locale: AppLocale): string {
  if (locale !== "ru") {
    return color.name;
  }

  const names: Record<string, string> = {
    Black: "Черный",
    White: "Белый",
    Gray: "Серый",
    Navy: "Темно-синий",
    Sand: "Песочный",
    Burgundy: "Бордовый",
    Blush: "Розовый",
  };

  return names[color.name] ?? color.name;
}

function translateColorHint(
  colorHint: string | undefined,
  locale: AppLocale,
): string | undefined {
  if (!colorHint || locale !== "ru") {
    return colorHint;
  }

  return colorHint
    .replaceAll("Black", "Черный")
    .replaceAll("White", "Белый")
    .replaceAll("Gray", "Серый")
    .replaceAll("Navy", "Темно-синий")
    .replaceAll("Sand", "Песочный")
    .replaceAll("Burgundy", "Бордовый");
}

function translateGapReason(reason: string, locale: AppLocale): string {
  if (locale !== "ru") {
    return reason;
  }

  const translations: Record<string, string> = {
    "Completes casual combinations without changing palette.":
      "Завершает повседневные сочетания без изменения палитры.",
  };

  return translations[reason] ?? reason;
}

function resolvePublicImageUrl(
  imageUrl: string | undefined,
): string | undefined {
  if (!imageUrl || imageUrl.startsWith("/fixtures/")) {
    return undefined;
  }

  return imageUrl;
}

function uniqueItems(items: CapsuleResultItem[]): CapsuleResultItem[] {
  const seen = new Set<string>();
  const unique: CapsuleResultItem[] = [];

  for (const item of items) {
    if (seen.has(item.id)) {
      continue;
    }

    seen.add(item.id);
    unique.push(item);
  }

  return unique;
}

function buildInitials(value: string | undefined): string {
  if (!value) {
    return "CZ";
  }

  const parts = value
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase()).join("") || "CZ";
}
