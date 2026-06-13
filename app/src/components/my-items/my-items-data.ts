import { CATEGORIES, getCategoryById, type Category } from "@/lib/categories";
import type {
  ItemSourceType,
  ItemStatus,
  ProviderRegistry,
  WardrobeEntry,
} from "@/lib/providers";
import type { PersistedMockSession } from "@/features/auth/session";
import type { AppLocale } from "@/i18n/routing";
import type { ColorPoint } from "@/types";
import { isWardrobeStatisticItem } from "@/components/wardrobe/wardrobe-statistics";

export interface MyItemsCapsuleMembership {
  id: string;
  name: string;
  active: boolean;
  palette: ColorPoint[];
}

export interface MyItemsEntry {
  id: string;
  name: string;
  categoryId: string;
  categoryLabel: string;
  section: Category["section"] | "custom";
  imageUrl?: string;
  colorPoints: ColorPoint[];
  brand?: string;
  material?: string;
  price?: number;
  sourceType: ItemSourceType;
  sourceUrl?: string;
  status: ItemStatus;
  favorite: boolean;
  fromCatalog: boolean;
  isPublic: boolean;
  capsuleIds: string[];
  capsules: MyItemsCapsuleMembership[];
  updatedAt: string;
}

export interface MyItemsSnapshot {
  profile: {
    displayName: string;
    email: string;
    initials: string;
  };
  items: MyItemsEntry[];
  categories: Array<{
    id: string;
    label: string;
    count: number;
  }>;
  categoryOptions: Array<{
    id: string;
    label: string;
  }>;
  colors: Array<ColorPoint & { count: number }>;
  navigation: {
    myItems: number;
    outfits: number;
    capsules: number;
    uncapsulated: number;
    favorites: number;
    shoppingList: number;
    forSale: number;
    forRepair: number;
  };
}

interface BuildMyItemsSnapshotOptions {
  registry: ProviderRegistry;
  session: PersistedMockSession;
  locale: AppLocale;
}

export async function buildMyItemsSnapshot({
  registry,
  session,
  locale,
}: BuildMyItemsSnapshotOptions): Promise<MyItemsSnapshot> {
  const [profile, items, capsule] = await Promise.all([
    registry.profiles.getProfile(session.userId),
    registry.wardrobe.listItems(session.userId),
    registry.capsules.getCurrentCapsule(session.userId),
  ]);
  const capsuleMembership = capsule
    ? {
        id: capsule.id,
        name: capsule.name,
        active: true,
        palette: [...capsule.palette.achromaticColors, ...capsule.palette.selectedColors],
      }
    : null;
  const mappedItems = items.map((item) =>
    buildItem(item, locale, capsuleMembership),
  );
  const wardrobeStatisticItems = mappedItems.filter(isWardrobeStatisticItem);
  const favorites = mappedItems.filter((item) => item.favorite).length;
  const forSale = mappedItems.filter((item) => item.status === "for_sale").length;
  const forRepair = mappedItems.filter((item) => item.status === "for_repair").length;
  const uncapsulated = mappedItems.filter((item) => item.status === "uncapsulated").length;

  return {
    profile: {
      displayName: session.name ?? profile.displayName,
      email: session.email,
      initials: buildInitials(session.name ?? profile.displayName ?? session.email),
    },
    items: mappedItems,
    categories: buildCategories(wardrobeStatisticItems),
    categoryOptions: buildCategoryOptions(locale),
    colors: buildColors(wardrobeStatisticItems),
    navigation: {
      myItems: wardrobeStatisticItems.length,
      outfits: capsule?.outfitCount ?? 0,
      capsules: capsule ? 1 : 0,
      uncapsulated,
      favorites,
      shoppingList: capsule?.gapAnalysis.length ?? 0,
      forSale,
      forRepair,
    },
  };
}

function buildItem(
  item: WardrobeEntry,
  locale: AppLocale,
  capsuleMembership: MyItemsCapsuleMembership | null,
): MyItemsEntry {
  const category = getCategoryById(item.categoryId);
  const capsules =
    capsuleMembership && item.capsuleIds.includes(capsuleMembership.id)
      ? [capsuleMembership]
      : [];

  return {
    id: item.id,
    name: item.name,
    categoryId: item.categoryId,
    categoryLabel: categoryName(item.categoryId, locale),
    section: category?.section ?? "custom",
    imageUrl: resolvePublicImageUrl(item.imageUrl ?? item.photoUrl),
    colorPoints: item.colorPoints,
    brand: item.brand,
    material: item.material,
    price: item.price,
    sourceType: item.sourceType,
    sourceUrl: item.sourceUrl,
    status: item.status,
    favorite: item.favorite,
    fromCatalog: item.fromCatalog,
    isPublic: item.isPublic,
    capsuleIds: item.capsuleIds,
    capsules,
    updatedAt: item.updatedAt,
  };
}

function buildCategories(items: MyItemsEntry[]): MyItemsSnapshot["categories"] {
  const counts = new Map<string, { label: string; count: number }>();

  items.forEach((item) => {
    const existing = counts.get(item.categoryId);
    counts.set(item.categoryId, {
      label: item.categoryLabel,
      count: (existing?.count ?? 0) + 1,
    });
  });

  return [...counts.entries()]
    .map(([id, value]) => ({ id, ...value }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function buildCategoryOptions(locale: AppLocale): MyItemsSnapshot["categoryOptions"] {
  return CATEGORIES.map((category) => ({
    id: category.id,
    label: locale === "ru" ? category.nameRu : category.nameEn,
  })).sort((a, b) => a.label.localeCompare(b.label));
}

function buildColors(items: MyItemsEntry[]): MyItemsSnapshot["colors"] {
  const counts = new Map<string, ColorPoint & { count: number }>();

  items.forEach((item) => {
    item.colorPoints.forEach((color) => {
      const key = color.hex.toUpperCase();
      const existing = counts.get(key);
      counts.set(key, {
        ...color,
        hex: key,
        count: (existing?.count ?? 0) + 1,
      });
    });
  });

  return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function categoryName(categoryId: string, locale: AppLocale): string {
  const category = getCategoryById(categoryId);

  if (!category) {
    return categoryId;
  }

  return locale === "ru" ? category.nameRu : category.nameEn;
}

function resolvePublicImageUrl(value?: string): string | undefined {
  if (!value || value.startsWith("/fixtures/") || value.startsWith("mock://")) {
    return undefined;
  }

  return value;
}

function buildInitials(value: string): string {
  const cleaned = value.trim();

  if (!cleaned) {
    return "CZ";
  }

  const parts = cleaned.split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "CZ";
}
