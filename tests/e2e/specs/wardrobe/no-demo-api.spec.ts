import path from "node:path";
import { createJiti } from "jiti";
import type {
  ProviderRegistry,
  SavedGuestItem,
} from "../../../../app/src/lib/providers/contracts";
import { expect, test } from "../../fixtures/base";

const appRoot = path.resolve(process.cwd(), "../../app");
interface DashboardSnapshot {
  activeCapsule: unknown;
  stats: { totalItems: number; totalOutfits: number; uncapsulated: number };
  recentItems: unknown[];
  shoppingPreview: unknown[];
  navigation: Record<string, number>;
}
const loader = createJiti(import.meta.url, {
  alias: {
    "@": path.join(appRoot, "src"),
    "next/headers": path.resolve("support/empty-next-headers.ts"),
    "server-only": path.join(appRoot, "node_modules/server-only/empty.js"),
  },
});
const session = {
  userId: "22222222-2222-4222-8222-222222222222",
  email: "empty-account@example.com",
  name: "Empty Account",
  accessToken: "test-token",
  expiresAt: "2099-01-01T00:00:00Z",
};
let registry: ProviderRegistry;
let createRegistry: () => ProviderRegistry;
let snapshot: (options: {
  registry: ProviderRegistry;
  session: typeof session;
  locale: "en";
}) => Promise<DashboardSnapshot>;
let cookieValues: Map<string, string>;
let saved: SavedGuestItem[];
let unavailable = false;
const originalFetch = globalThis.fetch;
let demoId: string;
let mockRegistry: ProviderRegistry;
let mockUserId: string;

test.beforeEach(async () => {
  ({ cookieValues } = await loader.import(
    "../../support/empty-next-headers.ts",
  ));
  cookieValues.clear();
  const { serializeSignedSession } = (await loader.import(
    "../../../../app/src/features/auth/session-codec.ts",
  )) as { serializeSignedSession(value: typeof session): Promise<string> };
  cookieValues.set(
    "capsule_zero_session",
    await serializeSignedSession(session),
  );
  saved = [];
  unavailable = false;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    expect(new Headers(init?.headers).get("Authorization")).toBe(
      `Bearer ${session.accessToken}`,
    );
    if (url.endsWith("/api/guest-progress/items"))
      return Response.json(unavailable ? {} : saved, {
        status: unavailable ? 503 : 200,
      });
    if (url.includes("/api/guest-progress/items/")) {
      const item = saved.find((item) => url.endsWith(`/${item.id}`));
      if (!item) return Response.json({}, { status: 404 });
      Object.assign(item, JSON.parse(String(init?.body)));
      return Response.json(item);
    }
    if (url.endsWith("/api/profile"))
      return Response.json({
        userId: session.userId,
        email: session.email,
        displayName: session.name,
        locale: "en",
        coinBalance: 0,
        createdAt: "",
        updatedAt: "",
      });
    throw new Error(`Unexpected endpoint: ${url}`);
  };
  const { createApiProviderRegistry } = (await loader.import(
    "../../../../app/src/lib/providers/api/index.ts",
  )) as { createApiProviderRegistry(): ProviderRegistry };
  createRegistry = createApiProviderRegistry;
  registry = createRegistry();
  ({ buildDashboardSnapshot: snapshot } = await loader.import(
    "../../../../app/src/components/dashboard/dashboard-data.ts",
  ));
  const { createMockProviderRegistry } = (await loader.import(
    "../../../../app/src/lib/providers/mock/index.ts",
  )) as {
    createMockProviderRegistry(options: {
      guestProgress: boolean;
    }): ProviderRegistry;
  };
  const { MOCK_USER, MOCK_WARDROBE_ITEMS } = (await loader.import(
    "../../../../app/src/lib/providers/mock/fixtures.ts",
  )) as { MOCK_USER: { id: string }; MOCK_WARDROBE_ITEMS: { id: string }[] };
  mockRegistry = createMockProviderRegistry({ guestProgress: false });
  mockUserId = MOCK_USER.id;
  demoId = MOCK_WARDROBE_ITEMS[0]!.id;
});

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  cookieValues.clear();
});

test("a new API account has no demo wardrobe, capsule, statistics or suggestions", async () => {
  expect(await registry.wardrobe.listItems(session.userId)).toEqual([]);
  expect(await registry.capsules.getCurrentCapsule(session.userId)).toBeNull();
  const dashboard = await snapshot({ registry, session, locale: "en" });
  expect(dashboard.activeCapsule).toBeNull();
  expect(dashboard.stats).toEqual({
    totalItems: 0,
    totalOutfits: 0,
    uncapsulated: 0,
  });
  expect(dashboard.recentItems).toEqual([]);
  expect(dashboard.shoppingPreview).toEqual([]);
  for (const count of Object.values(dashboard.navigation))
    expect(count).toBe(0);
});

test("guessed fixture IDs cannot read or mutate another owner's item", async () => {
  expect(await registry.wardrobe.getItem(session.userId, demoId)).toBeNull();
  await expect(
    registry.wardrobe.setFavorite(session.userId, demoId, true),
  ).rejects.toThrow();
  await expect(
    registry.wardrobe.updateItemStatus(session.userId, demoId, "for_sale"),
  ).rejects.toThrow();
  for (const filters of [
    { favorite: true },
    { status: "uncapsulated" as const },
    { query: "white" },
  ])
    expect(await registry.wardrobe.listItems(session.userId, filters)).toEqual(
      [],
    );
  expect(await registry.wardrobe.listItems("another-account")).toEqual([]);
});

test("saved guest items remain exact and mutable across provider reconstruction", async () => {
  saved = [
    {
      id: "saved-item",
      userId: session.userId,
      preset: {
        id: "w-tee-white",
        wardrobe: "female",
        role: "top",
        categoryId: "tshirt",
        colorId: "A3",
        name: { en: "White T-shirt", ru: "Белая футболка" },
      },
      status: "uncapsulated",
      favorite: false,
      createdAt: "2026-10-21T00:00:00Z",
      updatedAt: "2026-10-21T00:00:00Z",
    },
  ];
  expect(
    (await registry.wardrobe.listItems(session.userId)).map((item) => item.id),
  ).toEqual(["saved-item"]);
  await registry.wardrobe.setFavorite(session.userId, "saved-item", true);
  await registry.wardrobe.updateItemStatus(
    session.userId,
    "saved-item",
    "for_sale",
  );
  registry = createRegistry();
  expect(
    await registry.wardrobe.getItem(session.userId, "saved-item"),
  ).toMatchObject({
    guestPresetId: "w-tee-white",
    favorite: true,
    status: "for_sale",
    userId: session.userId,
  });
  expect(
    (
      await registry.wardrobe.listItems(session.userId, {
        favorite: true,
        status: "for_sale",
        query: "white",
      })
    ).map((item) => item.id),
  ).toEqual(["saved-item"]);
  expect(
    await registry.wardrobe.listItems(session.userId, {
      status: "uncapsulated",
    }),
  ).toEqual([]);
  expect(await registry.capsules.getCurrentCapsule(session.userId)).toBeNull();
});

test("API outages never become demo success, while explicit mock mode keeps fixtures", async () => {
  unavailable = true;
  await expect(registry.wardrobe.listItems(session.userId)).rejects.toThrow();
  expect(
    (await mockRegistry.wardrobe.listItems(mockUserId)).length,
  ).toBeGreaterThan(0);
  expect(
    await mockRegistry.capsules.getCurrentCapsule(mockUserId),
  ).not.toBeNull();
  expect(
    await mockRegistry.wardrobe.getItem(session.userId, demoId),
  ).toBeNull();
});
