import type {
  AlgorithmRole,
  CustomCategoryValidationResponse,
  LayeringCoverage,
} from "@/lib/api/generated/openapi";
import type { ColorPoint } from "@/types";
import {
  canonicalItemIds,
  itemsAreMutuallyCompatible,
  selectAccessoryVariations,
} from "./outfit-variation-selection";

export type { LayeringCoverage };

export interface ProductivityItem extends Pick<
  CustomCategoryValidationResponse,
  "algorithmRole" | "accessorySlot"
> {
  itemId: string;
  dominantColor?: Pick<ColorPoint, "id" | "hex" | "group">;
}

export interface OutfitProductivity {
  outfitCount: number;
  opr: string;
  oprValue: number;
  denominator: number;
  layeringCoverage: LayeringCoverage;
}

export interface SelectedAccessoryVariation {
  key: string;
  itemIds: string[];
}

export interface PreviewBaseLook {
  itemIds: string[];
  selectedAccessoryVariations: SelectedAccessoryVariation[];
}

export interface PreviewOutfitProductivity extends OutfitProductivity {
  previewBaseLooks: PreviewBaseLook[];
}

export function calculateOutfitProductivity(
  outfitCount: number,
  items: ProductivityItem[],
): OutfitProductivity {
  const eligibleItems = eligibleProductivityItems(items);
  const denominator = eligibleItems.filter(
    ({ algorithmRole }) =>
      algorithmRole.startsWith("core_") || algorithmRole === "accessory",
  ).length;
  const oprValue = denominator > 0 ? outfitCount / denominator : 0;

  return {
    outfitCount,
    opr: oprValue.toFixed(1),
    oprValue,
    denominator,
    layeringCoverage: calculateLayeringCoverage(eligibleItems),
  };
}

export function calculatePreviewOutfitProductivity(
  items: ProductivityItem[],
): PreviewOutfitProductivity {
  const eligibleItems = eligibleProductivityItems(items);
  const accessories = itemsByRole(eligibleItems, "accessory");
  const previewBaseLooks = buildValidBaseLooks(eligibleItems).map(
    (baseLook): PreviewBaseLook => ({
      itemIds: canonicalItemIds(baseLook),
      selectedAccessoryVariations: selectAccessoryVariations(
        baseLook,
        accessories,
      ).map(({ key, items: selectedItems }) => ({
        key,
        itemIds: canonicalItemIds(selectedItems),
      })),
    }),
  );
  const outfitCount = previewBaseLooks.reduce(
    (count, baseLook) =>
      count + 1 + baseLook.selectedAccessoryVariations.length,
    0,
  );

  return {
    ...calculateOutfitProductivity(outfitCount, items),
    previewBaseLooks,
  };
}

export function formatLayeringCoverage(
  score: number | null,
  unavailableLabel: string,
): string {
  return score === null ? unavailableLabel : `${Math.round(score)}%`;
}

function calculateLayeringCoverage(
  items: Array<ProductivityItem & { algorithmRole: AlgorithmRole }>,
): LayeringCoverage {
  const validBaseLooks = buildValidBaseLooks(items);
  const midLayers = itemsByRole(items, "layering_mid");
  const outerLayers = itemsByRole(items, "layering_outer");
  const baseLookCount = validBaseLooks.length;
  const midCoveredLookCount = coveredLookCount(validBaseLooks, midLayers);
  const outerCoveredLookCount = coveredLookCount(validBaseLooks, outerLayers);

  return {
    score:
      baseLookCount > 0
        ? ((midCoveredLookCount + outerCoveredLookCount) /
            (2 * baseLookCount)) *
          100
        : null,
    baseLookCount,
    midCoveredLookCount,
    outerCoveredLookCount,
  };
}

function eligibleProductivityItems(
  items: ProductivityItem[],
): Array<ProductivityItem & { algorithmRole: AlgorithmRole }> {
  return items.filter(
    (item): item is ProductivityItem & { algorithmRole: AlgorithmRole } =>
      item.algorithmRole !== null,
  );
}

function buildValidBaseLooks(
  items: Array<ProductivityItem & { algorithmRole: AlgorithmRole }>,
): ProductivityItem[][] {
  const tops = itemsByRole(items, "core_top");
  const bottoms = itemsByRole(items, "core_bottom");
  const dresses = itemsByRole(items, "core_dress");
  const shoes = itemsByRole(items, "core_shoes");
  const separates = tops.flatMap((top) =>
    bottoms.flatMap((bottom) => shoes.map((shoe) => [top, bottom, shoe])),
  );
  const dressLooks = dresses.flatMap((dress) =>
    shoes.map((shoe) => [dress, shoe]),
  );

  return [...separates, ...dressLooks].filter(itemsAreMutuallyCompatible);
}

function itemsByRole(
  items: Array<ProductivityItem & { algorithmRole: AlgorithmRole }>,
  role: AlgorithmRole,
): ProductivityItem[] {
  return items.filter((item) => item.algorithmRole === role);
}

function coveredLookCount(
  baseLooks: ProductivityItem[][],
  layers: ProductivityItem[],
): number {
  return baseLooks.filter((look) =>
    layers.some((layer) => itemsAreMutuallyCompatible([...look, layer])),
  ).length;
}
