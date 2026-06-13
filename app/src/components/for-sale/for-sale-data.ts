import type { PersistedMockSession } from "@/features/auth/session";
import type { AppLocale } from "@/i18n/routing";
import type { ProviderRegistry } from "@/lib/providers";
import type { ColorPoint } from "@/types";
import {
  buildMyItemsSnapshot,
  type MyItemsEntry,
  type MyItemsSnapshot,
} from "@/components/my-items/my-items-data";
import { isWardrobeStatisticItem } from "@/components/wardrobe/wardrobe-statistics";

export interface ForSaleCapsuleOption {
  id: string;
  name: string;
  palette: ColorPoint[];
  itemCount: number;
  outfitCount: number;
}

export interface ForSaleSnapshot
  extends Omit<MyItemsSnapshot, "categories" | "colors" | "items"> {
  activeCapsule: ForSaleCapsuleOption | null;
  categories: Array<{
    id: string;
    label: string;
    count: number;
  }>;
  items: MyItemsEntry[];
}

interface BuildForSaleSnapshotOptions {
  registry: ProviderRegistry;
  session: PersistedMockSession;
  locale: AppLocale;
}

export async function buildForSaleSnapshot({
  registry,
  session,
  locale,
}: BuildForSaleSnapshotOptions): Promise<ForSaleSnapshot> {
  const [baseSnapshot, capsule] = await Promise.all([
    buildMyItemsSnapshot({ registry, session, locale }),
    registry.capsules.getCurrentCapsule(session.userId),
  ]);
  const items = baseSnapshot.items
    .filter((item) => item.status === "for_sale")
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  const wardrobeStatisticItems = baseSnapshot.items.filter(isWardrobeStatisticItem);

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
      myItems: wardrobeStatisticItems.length,
      forSale: items.length,
    },
  };
}

function buildCategoryFilters(items: MyItemsEntry[]): ForSaleSnapshot["categories"] {
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
