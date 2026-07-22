import type { AccessorySlot } from "@/lib/api/generated/openapi";
import type { ColorPoint } from "@/types";
import { areColorGroupsCompatible } from "./color-compatibility";

export interface OutfitSelectionItem {
  itemId: string;
  accessorySlot: AccessorySlot | null;
  dominantColor?: Pick<ColorPoint, "id" | "hex" | "group">;
}

export interface AccessoryVariationCandidate {
  key: string;
  items: OutfitSelectionItem[];
}

export function selectAccessoryVariations(
  baseLook: OutfitSelectionItem[],
  accessories: OutfitSelectionItem[],
): AccessoryVariationCandidate[] {
  const candidates = new Map<string, AccessoryVariationCandidate>();
  const canonicalAccessories = [...accessories].sort((first, second) =>
    compareCanonicalText(first.itemId, second.itemId),
  );

  function visit(startIndex: number, selected: OutfitSelectionItem[]): void {
    for (
      let index = startIndex;
      index < canonicalAccessories.length;
      index += 1
    ) {
      const candidate = canonicalAccessories[index];

      if (
        !candidate?.accessorySlot ||
        selected.some(
          (accessory) => accessory.accessorySlot === candidate.accessorySlot,
        ) ||
        !itemsAreMutuallyCompatible([...baseLook, ...selected, candidate])
      ) {
        continue;
      }

      const variation = [...selected, candidate];
      retainCanonicalVariation(candidates, variation);

      if (variation.length < 3) {
        visit(index + 1, variation);
      }
    }
  }

  visit(0, []);
  const remaining = [...candidates.values()];
  const selected: AccessoryVariationCandidate[] = [];

  while (selected.length < 3 && remaining.length > 0) {
    remaining.sort((left, right) =>
      compareVariationCandidates(left, right, selected),
    );
    selected.push(remaining.shift() as AccessoryVariationCandidate);
  }

  return selected;
}

export function canonicalItemIds(items: OutfitSelectionItem[]): string[] {
  return items.map(({ itemId }) => itemId).sort(compareCanonicalText);
}

export function itemsAreMutuallyCompatible(
  items: OutfitSelectionItem[],
): boolean {
  return items.every((item, index) =>
    items
      .slice(index + 1)
      .every((candidate) => colorsAreCompatible(item, candidate)),
  );
}

function retainCanonicalVariation(
  candidates: Map<string, AccessoryVariationCandidate>,
  items: OutfitSelectionItem[],
): void {
  const key = accessoryVariationKey(items);
  const existing = candidates.get(key);
  const candidateItemKey = canonicalItemIds(items).join("|");
  const existingItemKey = existing
    ? canonicalItemIds(existing.items).join("|")
    : null;

  if (!existing || (existingItemKey && candidateItemKey < existingItemKey)) {
    candidates.set(key, { key, items: [...items] });
  }
}

function compareVariationCandidates(
  left: AccessoryVariationCandidate,
  right: AccessoryVariationCandidate,
  selected: AccessoryVariationCandidate[],
): number {
  if (selected.length === 0) {
    return (
      right.items.length - left.items.length ||
      compareCanonicalText(left.key, right.key)
    );
  }

  const leftDistance = Math.min(
    ...selected.map((candidate) => variationDistance(left, candidate)),
  );
  const rightDistance = Math.min(
    ...selected.map((candidate) => variationDistance(right, candidate)),
  );
  return (
    rightDistance - leftDistance || compareCanonicalText(left.key, right.key)
  );
}

function variationDistance(
  first: AccessoryVariationCandidate,
  second: AccessoryVariationCandidate,
): number {
  const firstSlots = variationSlots(first.items);
  const secondSlots = variationSlots(second.items);
  const slots = new Set([...firstSlots.keys(), ...secondSlots.keys()]);
  return [...slots].filter(
    (slot) => firstSlots.get(slot) !== secondSlots.get(slot),
  ).length;
}

function variationSlots(
  accessories: OutfitSelectionItem[],
): Map<string, string> {
  return new Map(
    accessories.flatMap((accessory) => {
      if (!accessory.accessorySlot) {
        return [];
      }
      return [[accessory.accessorySlot, accessoryColorId(accessory)]];
    }),
  );
}

function accessoryVariationKey(accessories: OutfitSelectionItem[]): string {
  return accessories
    .map((accessory) => [accessory.accessorySlot, accessoryColorId(accessory)])
    .sort(([firstSlot, firstColor], [secondSlot, secondColor]) =>
      compareCanonicalText(
        `${firstSlot}:${firstColor}`,
        `${secondSlot}:${secondColor}`,
      ),
    )
    .map((tuple) => JSON.stringify(tuple))
    .join("|");
}

function accessoryColorId(accessory: OutfitSelectionItem): string {
  return (
    accessory.dominantColor?.id ??
    accessory.dominantColor?.hex.toLowerCase() ??
    accessory.itemId
  );
}

function compareCanonicalText(first: string, second: string): number {
  return first < second ? -1 : first > second ? 1 : 0;
}

function colorsAreCompatible(
  first: OutfitSelectionItem,
  second: OutfitSelectionItem,
): boolean {
  if (!first.dominantColor || !second.dominantColor) {
    return true;
  }

  return areColorGroupsCompatible(
    first.dominantColor.group,
    second.dominantColor.group,
  );
}
