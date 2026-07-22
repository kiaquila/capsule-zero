import path from "node:path";

import { createJiti } from "jiti";

import { expect, test } from "../../fixtures/visual";
import { CapsuleResultPage } from "../../pages/CapsuleResultPage";

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

type PreviewProductivity = (
  items: Array<{
    itemId: string;
    algorithmRole: string | null;
    accessorySlot: string | null;
    dominantColor?: {
      id: string;
      hex: string;
      group: "achromatic" | "bright" | "pastel" | "desaturated" | "dark";
    };
  }>,
) => {
  outfitCount: number;
  denominator: number;
  previewBaseLooks: Array<{
    itemIds: string[];
    selectedAccessoryVariations: Array<{ key: string; itemIds: string[] }>;
  }>;
};

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

type MockProviderRegistry = {
  wardrobe: {
    listItems(
      userId: string,
    ): Promise<Array<{ id: string; categoryId: string }>>;
  };
  capsules: {
    createCapsule(
      userId: string,
      draft: {
        name: string;
        garderType: GarderType;
        palette: { achromaticColors: []; selectedColors: [] };
        categories: Array<{ categoryId: string; count: number }>;
        itemIds: string[];
      },
    ): Promise<{ outfitCount: number; itemIds: string[] }>;
  };
};

type MockProviderFactory = () => MockProviderRegistry;

const GENDERS = {
  all: ["women", "men", "mixed"],
  women: ["women", "mixed"],
  men: ["men", "mixed"],
} as const;

const GUIDED_JOURNEY_DATA_MODULE_PATH =
  "../../../../app/src/components/guided-journey/guided-journey-data";
const MOCK_PROVIDER_MODULE_PATH = "../../../../app/src/lib/providers/mock";
const CATEGORIES_MODULE_PATH = "../../../../app/src/lib/categories";
const COLOR_COMPATIBILITY_MODULE_PATH =
  "../../../../app/src/lib/color-compatibility";
const OUTFIT_PRODUCTIVITY_MODULE_PATH =
  "../../../../app/src/lib/outfit-productivity";
const CORE_PRODUCTIVITY_ITEMS = [
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

const appRoot = path.resolve(process.cwd(), "../../app");
const appModuleLoader = createJiti(import.meta.url, {
  alias: {
    "@": path.resolve(appRoot, "src"),
    "server-only": path.resolve(appRoot, "node_modules/server-only/empty.js"),
  },
});

async function importAppModule(modulePath: string): Promise<object> {
  return (await appModuleLoader.import(modulePath)) as object;
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

  test("uses only the dominant item color for compatibility", async () => {
    const colorCompatibility = await importAppModule(
      COLOR_COMPATIBILITY_MODULE_PATH,
    );
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

  test("deduplicates same-slot accessories with the same dominant color", async () => {
    const outfitProductivity = await importAppModule(
      OUTFIT_PRODUCTIVITY_MODULE_PATH,
    );
    const calculatePreviewOutfitProductivity = Reflect.get(
      outfitProductivity,
      "calculatePreviewOutfitProductivity",
    ) as PreviewProductivity | undefined;
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
      ...CORE_PRODUCTIVITY_ITEMS,
      ...duplicateScarves,
    ]);

    expect(productivity?.outfitCount).toBe(2);
    expect(productivity?.denominator).toBe(6);
    expect(
      productivity?.previewBaseLooks[0]?.selectedAccessoryVariations,
    ).toEqual([
      {
        key: '["neckwear","grey"]',
        itemIds: ["scarf-a"],
      },
    ]);
  });

  test("selects deterministic farthest-first representatives across slot colors", async () => {
    const outfitProductivity = await importAppModule(
      OUTFIT_PRODUCTIVITY_MODULE_PATH,
    );
    const calculatePreviewOutfitProductivity = Reflect.get(
      outfitProductivity,
      "calculatePreviewOutfitProductivity",
    ) as PreviewProductivity | undefined;
    const accessory = (
      itemId: string,
      accessorySlot: string,
      colorId: string,
    ) => ({
      itemId,
      algorithmRole: "accessory" as const,
      accessorySlot,
      dominantColor: {
        id: colorId,
        hex: "#8c8c8c",
        group: "achromatic" as const,
      },
    });

    const productivity = calculatePreviewOutfitProductivity?.([
      ...CORE_PRODUCTIVITY_ITEMS,
      accessory("bag-black", "bag", "black"),
      accessory("bag-white", "bag", "white"),
      accessory("scarf-black", "neckwear", "black"),
      accessory("scarf-white", "neckwear", "white"),
      accessory("beanie-black", "headwear", "black"),
      accessory("beanie-white", "headwear", "white"),
    ]);

    expect(productivity?.outfitCount).toBe(4);
    expect(
      productivity?.previewBaseLooks[0]?.selectedAccessoryVariations.map(
        ({ itemIds }) => itemIds,
      ),
    ).toEqual([
      ["bag-black", "beanie-black", "scarf-black"],
      ["bag-white"],
      ["beanie-white", "scarf-white"],
    ]);
  });

  test("maps every documented built-in category to an algorithm role", async () => {
    const categoriesModule = await importAppModule(CATEGORIES_MODULE_PATH);
    const categories = Reflect.get(categoriesModule, "CATEGORIES") as
      | CategoryRole[]
      | undefined;

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
      Object.entries(snapshot?.categories ?? {}).map(
        ([garderType, entries]) => [garderType, entries.map(({ id }) => id)],
      ),
    );

    expect(actualIds).toEqual(providerIds);
  });

  test("persists the preview numerator when creating a capsule", async () => {
    const mockProviderModule = await importAppModule(MOCK_PROVIDER_MODULE_PATH);
    const createMockProviderRegistry = Reflect.get(
      mockProviderModule,
      "createMockProviderRegistry",
    ) as unknown as MockProviderFactory | undefined;

    expect(typeof createMockProviderRegistry).toBe("function");

    const registry = createMockProviderRegistry?.();
    const userId = "11111111-1111-4111-8111-111111111111";
    const items = await registry?.wardrobe.listItems(userId);
    const itemId = (categoryId: string) => {
      const item = items?.find(
        (candidate) => candidate.categoryId === categoryId,
      );
      expect(item, `missing ${categoryId} fixture`).toBeDefined();
      return item?.id ?? "";
    };
    const draft = {
      garderType: "women" as const,
      palette: { achromaticColors: [] as [], selectedColors: [] as [] },
      categories: [
        { categoryId: "shirt", count: 1 },
        { categoryId: "trousers", count: 1 },
      ],
      itemIds: [itemId("shirt"), itemId("trousers")],
    };
    const shoesId = itemId("ankle-boots");

    const invalidCapsule = await registry?.capsules.createCapsule(userId, {
      ...draft,
      name: "Missing shoes",
    });
    const validCapsule = await registry?.capsules.createCapsule(userId, {
      ...draft,
      name: "Valid base",
      categories: [
        ...draft.categories,
        { categoryId: "ankle-boots", count: 1 },
      ],
      itemIds: [...draft.itemIds, shoesId, draft.itemIds[0] ?? "", shoesId],
    });

    expect(invalidCapsule?.outfitCount).toBe(0);
    expect(validCapsule?.outfitCount).toBe(1);
    expect(validCapsule?.itemIds).toEqual([...draft.itemIds, shoesId]);
  });
});
