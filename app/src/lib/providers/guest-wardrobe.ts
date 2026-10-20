import type {
  GuestProgressPort,
  SavedGuestItem,
  WardrobeEntry,
  WardrobeRepository,
  WardrobeListFilters,
} from "./contracts";
import { imageOf } from "@/features/guest/catalog";
import { JOURNEY_PALETTE_COLORS } from "@/components/guided-journey/guided-journey-data";

function project(item: SavedGuestItem): WardrobeEntry {
  const color = JOURNEY_PALETTE_COLORS.find(
    (color) => color.id === item.preset.colorId,
  );
  if (!color) throw new Error("Unsupported saved catalog color");
  return {
    id: item.id,
    guestPresetId: item.preset.id,
    userId: item.userId,
    name: item.preset.name.en,
    categoryId: item.preset.categoryId,
    imageUrl: imageOf(item.preset.id),
    photoUrl: imageOf(item.preset.id),
    colorPoints: [color],
    capsuleIds: [],
    isPublic: false,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    sourceType: "catalog",
    status: item.status,
    favorite: item.favorite,
    fromCatalog: true,
    version: 1,
  };
}
function matches(item: WardrobeEntry, filters?: WardrobeListFilters) {
  return (
    (!filters?.status || item.status === filters.status) &&
    (filters?.favorite === undefined || item.favorite === filters.favorite) &&
    (!filters?.capsuleId || item.capsuleIds.includes(filters.capsuleId)) &&
    (!filters?.query ||
      `${item.name} ${item.categoryId}`
        .toLowerCase()
        .includes(filters.query.toLowerCase()))
  );
}
export function withGuestWardrobe(
  base: WardrobeRepository,
  guest: GuestProgressPort,
): WardrobeRepository {
  const owned = async (userId: string, id: string) =>
    (await guest.listItems(userId)).find((item) => item.id === id);
  return {
    ...base,
    async listItems(userId, filters) {
      const [baseItems, guestItems] = await Promise.all([
        base.listItems(userId, filters),
        guest.listItems(userId),
      ]);
      return [
        ...baseItems,
        ...guestItems.map(project).filter((item) => matches(item, filters)),
      ];
    },
    async getItem(userId, id) {
      const item = await owned(userId, id);
      return item ? project(item) : base.getItem(userId, id);
    },
    async updateItemStatus(userId, id, status) {
      return (await owned(userId, id))
        ? project(await guest.updateItem(userId, id, { status }))
        : base.updateItemStatus(userId, id, status);
    },
    async setFavorite(userId, id, favorite) {
      return (await owned(userId, id))
        ? project(await guest.updateItem(userId, id, { favorite }))
        : base.setFavorite(userId, id, favorite);
    },
  };
}
