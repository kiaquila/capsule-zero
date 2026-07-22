import { expect, test } from "../../fixtures/visual";
import { CapsuleResultPage } from "../../pages/CapsuleResultPage";
import * as colorCompatibility from "../../../../app/src/lib/color-compatibility";
import { calculatePreviewOutfitProductivity } from "../../../../app/src/lib/outfit-productivity";

type DominantCompatibility = (
  itemColors: Array<{
    group: "achromatic" | "bright" | "pastel" | "desaturated" | "dark";
  }>,
  palette: Array<{
    group: "achromatic" | "bright" | "pastel" | "desaturated" | "dark";
  }>,
) => boolean;

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

    await capsuleResult.removeItem("Black leather sneakers");

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

    const productivity = calculatePreviewOutfitProductivity([
      ...coreItems,
      ...duplicateScarves,
    ]);

    expect(productivity.outfitCount).toBe(2);
    expect(productivity.denominator).toBe(6);
  });
});
