import Module from "node:module";
import path from "node:path";

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
  genders: string[];
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

type GarderType = "women" | "men" | "mixed";

type SnapshotBuilder = (options: {
  registry: {
    profiles: {
      getProfile(userId: string): Promise<{ displayName: string }>;
    };
    methodology: {
      listJourneyCategories(
        garderType: GarderType,
      ): Promise<Array<{ categoryId: string; count: number }>>;
    };
    catalogSearch: {
      search(userId: string, query: string): Promise<[]>;
    };
  };
  session: { userId: string; email: string; name?: string };
  locale: "en" | "ru";
}) => Promise<{
  categories: Record<GarderType, Array<{ id: string }>>;
}>;

const GENDERS = {
  all: ["women", "men", "mixed"],
  women: ["women", "mixed"],
  men: ["men", "mixed"],
} as const;

const GUIDED_JOURNEY_DATA_MODULE_PATH =
  "../../../../app/src/components/guided-journey/guided-journey-data";

type CommonJsResolver = (
  request: string,
  parent?: unknown,
  isMain?: boolean,
  options?: unknown,
) => string;

async function importAppModule(modulePath: string): Promise<object> {
  const commonJsModule = Module as unknown as {
    _resolveFilename: CommonJsResolver;
  };
  const originalResolver = commonJsModule._resolveFilename;

  commonJsModule._resolveFilename = function resolveAppAlias(
    request,
    parent,
    isMain,
    options,
  ) {
    const resolvedRequest = request.startsWith("@/")
      ? path.resolve(process.cwd(), "../../app/src", request.slice(2))
      : request;
    return originalResolver.call(
      this,
      resolvedRequest,
      parent,
      isMain,
      options,
    );
  };

  try {
    return await import(modulePath);
  } finally {
    commonJsModule._resolveFilename = originalResolver;
  }
}

const EXPECTED_CATEGORY_MATRIX = [
  ["tank-top", GENDERS.all, "core_top", null],
  ["shirt", GENDERS.all, "core_top", null],
  ["turtleneck", GENDERS.all, "core_top", null],
  ["sweater", GENDERS.all, "layering_mid", null],
  ["cardigan", GENDERS.all, "layering_mid", null],
  ["bomber", GENDERS.all, "layering_mid", null],
  ["blazer", GENDERS.all, "layering_mid", null],
  ["tshirt", GENDERS.all, "core_top", null],
  ["polo", GENDERS.all, "core_top", null],
  ["hoodie", GENDERS.all, "core_top", null],
  ["longsleeve", GENDERS.all, "core_top", null],
  ["dress", GENDERS.women, "core_dress", null],
  ["skirt", GENDERS.women, "core_bottom", null],
  ["trousers", GENDERS.all, "core_bottom", null],
  ["leggings", GENDERS.women, "core_bottom", null],
  ["jeans", GENDERS.all, "core_bottom", null],
  ["shorts", GENDERS.all, "core_bottom", null],
  ["chinos", GENDERS.men, "core_bottom", null],
  ["trench", GENDERS.all, "layering_outer", null],
  ["short-coat", GENDERS.all, "layering_outer", null],
  ["vest", GENDERS.all, "layering_outer", null],
  ["coat", GENDERS.all, "layering_outer", null],
  ["puffer", GENDERS.all, "layering_outer", null],
  ["fur-coat", GENDERS.women, "layering_outer", null],
  ["parka", GENDERS.all, "layering_outer", null],
  ["jacket", GENDERS.all, "layering_outer", null],
  ["sandals", GENDERS.all, "core_shoes", null],
  ["flats", GENDERS.women, "core_shoes", null],
  ["heels", GENDERS.all, "core_shoes", null],
  ["heeled-sandals", GENDERS.women, "core_shoes", null],
  ["ankle-boots", GENDERS.all, "core_shoes", null],
  ["boots", GENDERS.all, "core_shoes", null],
  ["sneakers", GENDERS.all, "core_shoes", null],
  ["loafers", GENDERS.all, "core_shoes", null],
  ["knee-high-boots", GENDERS.women, "core_shoes", null],
  ["tote", GENDERS.all, "accessory", "bag"],
  ["crossbody", GENDERS.all, "accessory", "bag"],
  ["clutch", GENDERS.women, "accessory", "bag"],
  ["backpack", GENDERS.all, "accessory", "bag"],
  ["scarf", GENDERS.all, "accessory", "neckwear"],
  ["beanie", GENDERS.all, "accessory", "headwear"],
  ["fedora", GENDERS.all, "accessory", "headwear"],
  ["cap", GENDERS.all, "accessory", "headwear"],
  ["jewelry", GENDERS.all, "accessory", "jewelry"],
  ["belt", GENDERS.all, "accessory", "belt"],
  ["sunglasses", GENDERS.all, "accessory", "eyewear"],
  ["watch", GENDERS.all, "accessory", "jewelry"],
  ["tie", GENDERS.men, "accessory", "neckwear"],
] as const;

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

    const normalizedActual = categories
      ?.map(({ id, genders, algorithmRole, accessorySlot }) => ({
        id,
        genders: [...genders].sort(),
        algorithmRole,
        accessorySlot,
      }))
      .sort((left, right) => left.id.localeCompare(right.id));
    const normalizedExpected = EXPECTED_CATEGORY_MATRIX.map(
      ([id, genders, algorithmRole, accessorySlot]) => ({
        id,
        genders: [...genders].sort(),
        algorithmRole,
        accessorySlot,
      }),
    ).sort((left, right) => left.id.localeCompare(right.id));

    expect(new Set(categories?.map(({ id }) => id)).size).toBe(48);
    expect(normalizedActual).toEqual(normalizedExpected);
  });

  test("builds journey categories from the active provider catalog", async () => {
    const guidedJourneyData = await importAppModule(
      GUIDED_JOURNEY_DATA_MODULE_PATH,
    );
    const buildGuidedJourneySnapshot = Reflect.get(
      guidedJourneyData,
      "buildGuidedJourneySnapshot",
    ) as unknown as SnapshotBuilder | undefined;
    const providerIds: Record<GarderType, string[]> = {
      women: ["dress", "sneakers"],
      men: ["chinos", "sneakers"],
      mixed: ["dress", "chinos", "sneakers"],
    };
    const registry = {
      profiles: {
        async getProfile() {
          return { displayName: "Journey Test" };
        },
      },
      methodology: {
        async listJourneyCategories(garderType: GarderType) {
          return providerIds[garderType].map((categoryId) => ({
            categoryId,
            count: 1,
          }));
        },
      },
      catalogSearch: {
        async search() {
          return [] as [];
        },
      },
    };

    expect(typeof buildGuidedJourneySnapshot).toBe("function");

    const snapshot = await buildGuidedJourneySnapshot?.({
      registry,
      session: { userId: "journey-test", email: "journey@example.com" },
      locale: "en",
    });
    const actualIds = Object.fromEntries(
      Object.entries(snapshot?.categories ?? {}).map(([garderType, entries]) => [
        garderType,
        entries.map(({ id }) => id),
      ]),
    );

    expect(actualIds).toEqual(providerIds);
  });
});
