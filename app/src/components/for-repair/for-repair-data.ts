import type { PersistedMockSession } from "@/features/auth/session";
import type { AppLocale } from "@/i18n/routing";
import type { ProviderRegistry } from "@/lib/providers";
import {
  buildMyItemsSnapshot,
  type MyItemsEntry,
  type MyItemsSnapshot,
} from "@/components/my-items/my-items-data";

export interface ForRepairSnapshot
  extends Omit<MyItemsSnapshot, "categories" | "colors" | "items"> {
  categories: Array<{
    id: string;
    label: string;
    count: number;
  }>;
  items: MyItemsEntry[];
}

interface BuildForRepairSnapshotOptions {
  registry: ProviderRegistry;
  session: PersistedMockSession;
  locale: AppLocale;
}

export async function buildForRepairSnapshot({
  registry,
  session,
  locale,
}: BuildForRepairSnapshotOptions): Promise<ForRepairSnapshot> {
  const baseSnapshot = await buildMyItemsSnapshot({ registry, session, locale });
  const items = baseSnapshot.items
    .filter((item) => item.status === "for_repair")
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));

  return {
    ...baseSnapshot,
    categories: buildCategoryFilters(items),
    items,
    navigation: {
      ...baseSnapshot.navigation,
      forRepair: items.length,
    },
  };
}

function buildCategoryFilters(items: MyItemsEntry[]): ForRepairSnapshot["categories"] {
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
