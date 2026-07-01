import type { PersistedMockSession } from "@/features/auth/session";
import type { AppLocale } from "@/i18n/routing";
import type { ProviderRegistry } from "@/lib/providers";
import type { ColorPoint } from "@/types";
import {
  buildMyItemsSnapshot,
  type MyItemsEntry,
  type MyItemsSnapshot,
} from "@/components/my-items/my-items-data";

export interface UncapsulatedCapsuleOption {
  id: string;
  name: string;
  palette: ColorPoint[];
  itemCount: number;
  outfitCount: number;
}

export interface UncapsulatedSnapshot
  extends Omit<MyItemsSnapshot, "categories" | "colors" | "items"> {
  activeCapsule: UncapsulatedCapsuleOption | null;
  categories: Array<{
    id: string;
    label: string;
    count: number;
  }>;
  items: MyItemsEntry[];
}

interface BuildUncapsulatedSnapshotOptions {
  registry: ProviderRegistry;
  session: PersistedMockSession;
  locale: AppLocale;
}

export async function buildUncapsulatedSnapshot({
  registry,
  session,
  locale,
}: BuildUncapsulatedSnapshotOptions): Promise<UncapsulatedSnapshot> {
  const [baseSnapshot, capsule] = await Promise.all([
    buildMyItemsSnapshot({ registry, session, locale }),
    registry.capsules.getCurrentCapsule(session.userId),
  ]);
  const items = baseSnapshot.items.filter(isUncapsulatedItem);

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
      uncapsulated: items.length,
    },
  };
}

function isUncapsulatedItem(item: MyItemsEntry): boolean {
  return item.status === "uncapsulated" && item.capsuleIds.length === 0 && item.capsules.length === 0;
}

function buildCategoryFilters(items: MyItemsEntry[]): UncapsulatedSnapshot["categories"] {
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
