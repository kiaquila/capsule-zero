import { getCategoryById } from "@/lib/categories";
import type { ProviderRegistry, WardrobeEntry } from "@/lib/providers";
import type { AppLocale } from "@/i18n/routing";
import type { Capsule, ColorPoint } from "@/types";
import type { PersistedMockSession } from "@/features/auth/session";

export interface DashboardSnapshot {
  profile: {
    displayName: string;
    email: string;
    initials: string;
    city?: string;
    coinBalance: number;
  };
  activeCapsule: {
    name: string;
    palette: Array<ColorPoint & { size: "large" | "small" }>;
    itemCount: number;
    outfitCount: number;
    categoryCount: number;
    opr: string;
  } | null;
  stats: {
    totalItems: number;
    totalOutfits: number;
    uncapsulated: number;
  };
  shoppingPreview: Array<{
    id: string;
    name: string;
    impact: number;
    priority: "high" | "medium" | "low";
  }>;
  recentItems: Array<{
    id: string;
    name: string;
    category: string;
    age: "today" | "days" | "week";
    ageCount: number;
    colorHex: string;
  }>;
  quickAccess: Array<{
    id: "favorites" | "for_sale" | "for_repair" | "uncapsulated";
    count: number;
  }>;
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

interface BuildDashboardSnapshotOptions {
  registry: ProviderRegistry;
  session: PersistedMockSession;
  locale: AppLocale;
}

const SHOPPING_FALLBACKS = [
  { categoryId: "ankle-boots", impact: 8, priority: "high" as const },
  { categoryId: "cardigan", impact: 6, priority: "medium" as const },
  { categoryId: "scarf", impact: 3, priority: "low" as const },
];
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export async function buildDashboardSnapshot({
  registry,
  session,
  locale,
}: BuildDashboardSnapshotOptions): Promise<DashboardSnapshot> {
  const profile = await registry.profiles.getProfile(session.userId);
  const items = await registry.wardrobe.listItems(session.userId);
  const capsule = await registry.capsules.getCurrentCapsule(session.userId);

  const totalOutfits = capsule?.outfitCount ?? 0;
  const favorites = items.filter((item) => item.favorite).length;
  const forSale = items.filter((item) => item.status === "for_sale").length;
  const forRepair = items.filter((item) => item.status === "for_repair").length;
  const uncapsulated = items.filter((item) => item.status === "uncapsulated").length;
  const shoppingPreview = buildShoppingPreview(capsule, locale);

  return {
    profile: {
      displayName: session.name ?? profile.displayName,
      email: session.email,
      initials: buildInitials(session.name ?? profile.displayName ?? session.email),
      city: profile.city,
      coinBalance: profile.coinBalance,
    },
    activeCapsule: capsule ? buildActiveCapsule(capsule) : null,
    stats: {
      totalItems: items.length,
      totalOutfits,
      uncapsulated,
    },
    shoppingPreview,
    recentItems: buildRecentItems(items, locale),
    quickAccess: [
      { id: "favorites", count: favorites },
      { id: "for_sale", count: forSale },
      { id: "for_repair", count: forRepair },
      { id: "uncapsulated", count: uncapsulated },
    ],
    navigation: {
      myItems: items.length,
      outfits: totalOutfits,
      capsules: capsule ? 1 : 0,
      uncapsulated,
      favorites,
      shoppingList: shoppingPreview.length,
      forSale,
      forRepair,
    },
  };
}

function buildActiveCapsule(capsule: Capsule): NonNullable<DashboardSnapshot["activeCapsule"]> {
  const itemCount = capsule.itemIds.length;
  const opr = itemCount > 0 ? (capsule.outfitCount / itemCount).toFixed(1) : "0.0";
  const colors = [...capsule.palette.achromaticColors, ...capsule.palette.selectedColors];

  return {
    name: capsule.name,
    palette: colors.map((color, index) => ({
      ...color,
      size: index < 4 ? "large" : "small",
    })),
    itemCount,
    outfitCount: capsule.outfitCount,
    categoryCount: capsule.categories.length,
    opr,
  };
}

function buildShoppingPreview(
  capsule: Capsule | null,
  locale: AppLocale,
): DashboardSnapshot["shoppingPreview"] {
  if (!capsule) {
    return [];
  }

  const fromGaps =
    capsule.gapAnalysis.map((item, index) => ({
      id: `gap-${item.categoryId}`,
      name: categoryName(item.categoryId, locale),
      impact: Math.max(4, 12 - index * 3),
      priority: index === 0 ? ("high" as const) : ("medium" as const),
    }));
  const existingIds = new Set(fromGaps.map((item) => item.id));
  const fallbacks = SHOPPING_FALLBACKS.filter(
    (item) => !existingIds.has(`gap-${item.categoryId}`),
  ).map((item) => ({
    id: `fallback-${item.categoryId}`,
    name: categoryName(item.categoryId, locale),
    impact: item.impact,
    priority: item.priority,
  }));

  return [...fromGaps, ...fallbacks].slice(0, 4);
}

function buildRecentItems(
  items: WardrobeEntry[],
  locale: AppLocale,
): DashboardSnapshot["recentItems"] {
  const referenceMs = buildRecentReferenceMs(items);

  return [...items]
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .slice(0, 4)
    .map((item) => {
      const age = buildRecentAge(item.updatedAt, referenceMs);

      return {
        id: item.id,
        name: item.name,
        category: categoryName(item.categoryId, locale),
        ...age,
        colorHex: item.colorPoints[0]?.hex ?? "#FFFFFF",
      };
    });
}

function buildRecentReferenceMs(items: WardrobeEntry[]): number {
  const updatedTimes = items
    .map((item) => Date.parse(item.updatedAt))
    .filter((value) => !Number.isNaN(value));

  return updatedTimes.length ? Math.max(...updatedTimes) : 0;
}

function buildRecentAge(
  updatedAt: string,
  referenceMs: number,
): Pick<DashboardSnapshot["recentItems"][number], "age" | "ageCount"> {
  const updatedMs = Date.parse(updatedAt);

  if (Number.isNaN(updatedMs)) {
    return { age: "week", ageCount: 1 };
  }

  const diffDays = Math.max(
    0,
    Math.floor((utcDayStart(referenceMs) - utcDayStart(updatedMs)) / MS_PER_DAY),
  );

  if (diffDays === 0) {
    return { age: "today", ageCount: 0 };
  }

  if (diffDays < 7) {
    return { age: "days", ageCount: diffDays };
  }

  return { age: "week", ageCount: Math.max(1, Math.floor(diffDays / 7)) };
}

function utcDayStart(value: number): number {
  const date = new Date(value);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function categoryName(categoryId: string, locale: AppLocale): string {
  const category = getCategoryById(categoryId);

  if (!category) {
    return categoryId;
  }

  return locale === "ru" ? category.nameRu : category.nameEn;
}

function buildInitials(value: string): string {
  const cleaned = value.trim();

  if (!cleaned) {
    return "CZ";
  }

  const parts = cleaned
    .replace(/@.*/, "")
    .split(/[.\s_-]+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? "C"}${parts[1][0] ?? "Z"}`.toUpperCase();
}
