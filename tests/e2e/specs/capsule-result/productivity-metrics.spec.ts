import { expect, test } from "../../fixtures/visual";
import { CapsuleResultPage } from "../../pages/CapsuleResultPage";
import * as categoriesModule from "../../../../app/src/lib/categories";
import * as colorCompatibility from "../../../../app/src/lib/color-compatibility";
import * as outfitProductivity from "../../../../app/src/lib/outfit-productivity";

type DominantCompatibility = (
  itemColors: Array<{
    group: "achromatic" | "bright" | "pastel" | "desaturated" | "dark";
  }>,
  palette: Array<{
    group: "achromatic" | "bright" | "pastel" | "desaturated" | "dark";
  }>,
) => boolean;

interface CategoryRole {
  id: string;
  algorithmRole: string;
  accessorySlot: string | null;
}

type PreviewProductivity = (items: Array<{
  itemId: string;
  algorithmRole: string | null;
  accessorySlot: string | null;
  dominantColor?: {
    id: string;
    hex: string;
    group: "achromatic" | "bright" | "pastel" | "desaturated" | "dark";
  };
}>) => { outfitCount: number; denominator: number };

const NEW_CATEGORY_EXPECTATIONS = {
  puffer: ["layering_outer", null],
  watch: ["accessory", "jewelry"],
  cap: ["accessory", "headwear"],
  clutch: ["accessory", "bag"],
} as const;

test.describe("Live productivity metrics", () => {
  test("recalculates OPR and layering from one valid base", async ({
    page,
    signedIn,
    appLocale,
  }) => {
    await expect(signedIn.oprValue).toHaveText("0.3");
    await expect(signedIn.layeringCoverage).toHaveText("0%");
    await expect(signedIn.layeringDiagnostics).toContainText("1 base look");

    const capsuleResult = new CapsuleResultPage(page, appLocale);
    await capsuleResult.goto();
    await expect(capsuleResult.oprValue).toHaveText("0.3");
    await expect(capsuleResult.layeringCoverage).toHaveText("0%");

    await capsuleResult.addItem("Camel wool blazer");

    // A structural layer changes neither the counted outfits nor the
    // Core+Accessory denominator: the OPR must remain 1 / 3.
    await expect(capsuleResult.oprValue).toHaveText("0.3");
    await expect(capsuleResult.layeringCoverage).toHaveText("50%");
    await expect(capsuleResult.layeringDiagnostics).toContainText(
      "1 base look",
    );

    await capsuleResult.addItem("Stone grey structured tote");

    // One compatible accessory adds one bounded variation: 2 outfits / 4
    // Core+Accessory items. Numerator and denominator move together.
    await expect(capsuleResult.oprValue).toHaveText("0.5");

    await capsuleResult.removeItem("Black leather ankle boots");

    await expect(capsuleResult.oprValue).toHaveText("0.0");
    await expect(capsuleResult.layeringCoverage).toHaveText("N/A");
    await expect(capsuleResult.layeringDiagnostics).toContainText(
      "0 base looks",
    );
  });

  test("uses only the dominant item color for compatibility", () => {
    const isDominantColorCompatibleWithPalette = Reflect.get(
      colorCompatibility,
      "isDominantColorCompatibleWithPalette",
    ) as DominantCompatibility | undefined;

    expect(typeof isDominantColorCompatibleWithPalette).toBe("function");
    expect(
      isDominantColorCompatibleWithPalette?.(
        [{ group: "dark" }, { group: "bright" }],
        [{ group: "dark" }],
      ),
    ).toBe(true);
  });

  test("deduplicates same-slot accessories with the same dominant color", () => {
    const calculatePreviewOutfitProductivity = Reflect.get(
      outfitProductivity,
      "calculatePreviewOutfitProductivity",
    ) as PreviewProductivity | undefined;
    const coreItems = [
      {
        itemId: "top",
        algorithmRole: "core_top" as const,
        accessorySlot: null,
      },
      {
        itemId: "bottom",
        algorithmRole: "core_bottom" as const,
        accessorySlot: null,
      },
      {
        itemId: "shoes",
        algorithmRole: "core_shoes" as const,
        accessorySlot: null,
      },
    ];
    const duplicateScarves = ["scarf-c", "scarf-a", "scarf-b"].map(
      (itemId) => ({
        itemId,
        algorithmRole: "accessory" as const,
        accessorySlot: "neckwear" as const,
        dominantColor: {
          id: "grey",
          hex: "#8c8c8c",
          group: "achromatic" as const,
        },
      }),
    );

    expect(typeof calculatePreviewOutfitProductivity).toBe("function");

    const productivity = calculatePreviewOutfitProductivity?.([
      ...coreItems,
      ...duplicateScarves,
    ]);

    expect(productivity?.outfitCount).toBe(2);
    expect(productivity?.denominator).toBe(6);
  });

  test("maps every documented built-in category to an algorithm role", () => {
    const categories = Reflect.get(
      categoriesModule,
      "CATEGORIES",
    ) as CategoryRole[] | undefined;

    expect(categories).toHaveLength(48);
    expect(categories?.every(({ algorithmRole }) => algorithmRole)).toBe(true);

    for (const [id, [algorithmRole, accessorySlot]] of Object.entries(
      NEW_CATEGORY_EXPECTATIONS,
    )) {
      expect(categories?.find((category) => category.id === id)).toMatchObject({
        algorithmRole,
        accessorySlot,
      });
    }
  });
});
