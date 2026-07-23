import type { PreviewBaseLook } from "@/lib/outfit-productivity";
import type { CapsuleResultItem } from "./capsule-result-data";

export interface OutfitLayer {
  id: string;
  label: string;
  colorHex: string;
  isGap: boolean;
}

export interface OutfitCard {
  id: string;
  name: string;
  note: string;
  layers: OutfitLayer[];
}

interface BuildPreviewOutfitCardsOptions {
  items: CapsuleResultItem[];
  previewBaseLooks: PreviewBaseLook[];
  names: string[];
  note: string;
}

export function buildPreviewOutfitCards({
  items,
  previewBaseLooks,
  names,
  note,
}: BuildPreviewOutfitCardsOptions): OutfitCard[] {
  const itemById = new Map(items.map((item) => [item.id, item]));
  const cards: OutfitCard[] = [];

  previewBaseLooks.forEach((baseLook, baseIndex) => {
    const variations = [
      { key: "base", itemIds: [] },
      ...baseLook.selectedAccessoryVariations,
    ];

    variations.forEach((variation, variationIndex) => {
      const itemIds = [...baseLook.itemIds, ...variation.itemIds];
      const layers = itemIds.flatMap((itemId) => {
        const item = itemById.get(itemId);
        return item ? [layerFromItem(item)] : [];
      });

      if (layers.length !== itemIds.length) {
        return;
      }

      cards.push({
        id: `${baseIndex}:${variationIndex}:${variation.key}`,
        name: names[cards.length % names.length] ?? names[0] ?? "",
        note,
        layers,
      });
    });
  });

  return cards;
}

function layerFromItem(item: CapsuleResultItem): OutfitLayer {
  return {
    id: item.id,
    label: item.categoryLabel,
    colorHex: item.colorPoints[0]?.hex ?? "#8C8C8C",
    isGap: false,
  };
}
