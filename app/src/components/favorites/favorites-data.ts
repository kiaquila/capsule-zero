import type { PersistedMockSession } from "@/features/auth/session";
import type { AppLocale } from "@/i18n/routing";
import type { ProviderRegistry } from "@/lib/providers";
import type { ColorPoint } from "@/types";
import {
  buildMyItemsSnapshot,
  type MyItemsEntry,
  type MyItemsSnapshot,
} from "@/components/my-items/my-items-data";

export interface FavoritesCapsuleOption {
  id: string;
  name: string;
  palette: ColorPoint[];
  itemCount: number;
  outfitCount: number;
}

export interface FavoritesSnapshot
  extends Omit<MyItemsSnapshot, "categories" | "colors" | "items"> {
  activeCapsule: FavoritesCapsuleOption | null;
  categories: Array<{
    id: string;
    label: string;
    count: number;
  }>;
  items: MyItemsEntry[];
  totals: {
    mine: number;
    catalog: number;
    total: number;
  };
}

interface BuildFavoritesSnapshotOptions {
  registry: ProviderRegistry;
  session: PersistedMockSession;
  locale: AppLocale;
}

export async function buildFavoritesSnapshot({
  registry,
  session,
  locale,
}: BuildFavoritesSnapshotOptions): Promise<FavoritesSnapshot> {
  const [baseSnapshot, capsule] = await Promise.all([
    buildMyItemsSnapshot({ registry, session, locale }),
    registry.capsules.getCurrentCapsule(session.userId),
  ]);
  const items = baseSnapshot.items
    .filter((item) => item.favorite)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  const totals = {
    mine: items.filter((item) => !item.fromCatalog).length,
    catalog: items.filter((item) => item.fromCatalog).length,
    total: items.length,
  };

  return {
    ...baseSnapshot,
    activeCapsule: capsule
      ? {
          id: capsule.id,
          name: capsule.name,
          palette: [...capsule.palette.achromaticColors, ...capsule.palette.selectedColors],
          itemCount: capsule.itemIds.length,
          outfitCount: capsule.outfitCount,
        }
      : null,
    categories: buildCategoryFilters(items),
    items,
    navigation: {
      ...baseSnapshot.navigation,
      favorites: totals.total,
    },
    totals,
  };
}

function buildCategoryFilters(items: MyItemsEntry[]): FavoritesSnapshot["categories"] {
  const counts = new Map<string, { id: string; label: string; count: number }>();

  items.forEach((item) => {
    const existing = counts.get(item.categoryId);
    counts.set(item.categoryId, {
      id: item.categoryId,
      label: item.categoryLabel,
      count: (existing?.count ?? 0) + 1,
    });
  });

  return [...counts.values()].sort((a, b) => a.label.localeCompare(b.label));
}
