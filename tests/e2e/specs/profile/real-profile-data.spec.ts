import path from "node:path";
import { createJiti } from "jiti";
import type {
  Profile,
  ProviderRegistry,
} from "../../../../app/src/lib/providers/contracts";
import type { ProfileFormInput } from "../../../../app/src/features/profile/schemas";
interface ProfileSnapshot {
  profile: ProfileFormInput;
  preferences: Pick<
    ProfileFormInput,
    | "emailNotifications"
    | "pushNotifications"
    | "googleAuthenticator"
    | "pushSecondFactor"
  >;
  account: { sessions: unknown[]; sessionsStatus: string };
}
import { expect, test } from "../../fixtures/base";
import { guestCatalogCopy, type Locale } from "../../fixtures/locales";

const appRoot = path.resolve(process.cwd(), "../../app");
const loader = createJiti(import.meta.url, {
  alias: {
    "@": path.join(appRoot, "src"),
    "next/headers": path.resolve("support/empty-next-headers.ts"),
    "server-only": path.join(appRoot, "node_modules/server-only/empty.js"),
  },
});
const optionalFields = [
  "phone",
  "dateOfBirth",
  "country",
  "city",
  "shoeSize",
  "topSize",
  "bottomSize",
] as const;
const session = {
  userId: "profile-user",
  email: "person@example.com",
  name: "Real Person",
  accessToken: "test-token",
  expiresAt: "2099-01-01T00:00:00Z",
};
let cookieValues: Map<string, string>;
let registry: ProviderRegistry;
let stored: Profile;
let patches: Record<string, unknown>[];
let rejectPatch = false;
const originalFetch = globalThis.fetch;
let buildSnapshot: (options: {
  registry: ProviderRegistry;
  session: typeof session;
  locale: "en";
}) => Promise<ProfileSnapshot>;
let save: (input: ProfileFormInput) => Promise<{ ok: boolean }>;

function form(snapshot: ProfileSnapshot): ProfileFormInput {
  return { ...snapshot.profile, ...snapshot.preferences };
}

async function snapshot() {
  return buildSnapshot({ registry, session, locale: "en" });
}

test.beforeEach(async () => {
  process.env.CAPSULE_PROVIDER_MODE = "api";
  ({ cookieValues } = (await loader.import(
    "../../support/empty-next-headers.ts",
  )) as { cookieValues: Map<string, string> });
  cookieValues.clear();
  const codec = (await loader.import(
    "../../../../app/src/features/auth/session-codec.ts",
  )) as { serializeSignedSession(value: typeof session): Promise<string> };
  cookieValues.set(
    "capsule_zero_session",
    await codec.serializeSignedSession(session),
  );
  stored = {
    userId: session.userId,
    email: session.email,
    displayName: session.name,
    locale: "en",
    coinBalance: 0,
    createdAt: "",
    updatedAt: "",
  };
  patches = [];
  rejectPatch = false;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url.endsWith("/api/auth/sessions")) return Response.json([]);
    if (url.endsWith("/api/guest-progress/items")) return Response.json([]);
    if (url.endsWith("/api/auth/whoami")) {
      return Response.json({
        session: { token: session.accessToken, expiresAt: session.expiresAt },
        user: { id: session.userId, email: session.email, name: session.name },
      });
    }
    if (!url.endsWith("/api/profile"))
      throw new Error(`Unexpected endpoint: ${url}`);
    if (init?.method === "PATCH") {
      const patch = JSON.parse(String(init.body)) as Record<string, unknown>;
      patches.push(patch);
      if (rejectPatch) return Response.json({}, { status: 503 });
      stored = { ...stored, ...patch };
    }
    return Response.json(stored);
  };
  const providers = (await loader.import(
    "../../../../app/src/lib/providers/index.ts",
  )) as { createProviderRegistry(): ProviderRegistry };
  registry = providers.createProviderRegistry();
  ({ buildProfileSnapshot: buildSnapshot } = (await loader.import(
    "../../../../app/src/components/profile/profile-data.ts",
  )) as { buildProfileSnapshot: typeof buildSnapshot });
  ({ saveProfileAction: save } = (await loader.import(
    "../../../../app/src/features/profile/actions.ts",
  )) as { saveProfileAction: typeof save });
});

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.CAPSULE_PROVIDER_MODE;
  cookieValues?.clear();
});

test("new profile and unrelated save never invent optional data or sessions", async () => {
  const initial = await snapshot();
  for (const field of optionalFields)
    expect(initial.profile[field], field).toBe("");
  expect(initial.account.sessions).toEqual([]);
  expect(initial.account.sessionsStatus).toBe("available");
  const normalFetch = globalThis.fetch;
  const inventory = [
    {
      id: "real-current",
      current: true,
      authenticatedAt: "2026-10-21T10:00:00Z",
      expiresAt: session.expiresAt,
    },
  ];
  globalThis.fetch = async (input, init) => {
    if (!String(input).endsWith("/api/auth/sessions"))
      return normalFetch(input, init);
    expect(new Headers(init?.headers).get("Authorization")).toBe(
      `Bearer ${session.accessToken}`,
    );
    expect(init?.cache).toBe("no-store");
    return Response.json(inventory);
  };
  expect((await snapshot()).account).toMatchObject({
    sessions: inventory,
    sessionsStatus: "available",
  });
  globalThis.fetch = async (input, init) =>
    String(input).endsWith("/api/auth/sessions")
      ? Response.json({}, { status: 502 })
      : normalFetch(input, init);
  expect((await snapshot()).account).toMatchObject({
    sessions: [],
    sessionsStatus: "unavailable",
  });
  globalThis.fetch = normalFetch;
  expect(await save(form(initial))).toMatchObject({ ok: true });
  expect(patches).toEqual([
    { displayName: session.name, country: "", city: "" },
  ]);
  const saved = JSON.parse(
    decodeURIComponent(cookieValues.get("capsule_zero_mock_profile")!),
  ) as Record<string, unknown>;
  for (const field of optionalFields) expect(saved[field], field).toBe("");
});

test("explicit values equal to former defaults survive save and reload", async () => {
  const values = {
    dateOfBirth: "1992-06-15",
    country: "AR",
    city: "Buenos Aires",
    shoeSize: "37",
    topSize: "S",
    bottomSize: "S",
    phone: "+123456789",
  };
  expect(await save({ ...form(await snapshot()), ...values })).toMatchObject({
    ok: true,
  });
  expect((await snapshot()).profile).toMatchObject(values);
  // A cookie belongs to one user, even if copied into another session.
  const raw = JSON.parse(
    decodeURIComponent(cookieValues.get("capsule_zero_mock_profile")!),
  ) as Record<string, unknown>;
  cookieValues.set(
    "capsule_zero_mock_profile",
    encodeURIComponent(JSON.stringify({ ...raw, userId: "someone-else" })),
  );
  expect((await snapshot()).profile.dateOfBirth).toBe("");
  expect((await snapshot()).profile.country).toBe("AR");
});

test("cleared optional values reach the API and survive a cookie-free location reload", async () => {
  stored = { ...stored, country: "DE", city: "Berlin" };
  const input = form(await snapshot());
  for (const field of optionalFields) input[field] = "";
  expect(await save(input)).toMatchObject({ ok: true });
  expect(patches[0]).toMatchObject({ country: "", city: "" });
  expect(stored).toMatchObject({ country: "", city: "" });
  for (const field of optionalFields)
    expect((await snapshot()).profile[field], field).toBe("");
  cookieValues.delete("capsule_zero_mock_profile");
  expect((await snapshot()).profile).toMatchObject({ country: "", city: "" });
});

test("provider rejection never persists the edited cookie", async () => {
  expect(await save(form(await snapshot()))).toMatchObject({ ok: true });
  const previous = cookieValues.get("capsule_zero_mock_profile");
  rejectPatch = true;
  expect(
    await save({ ...form(await snapshot()), city: "Unsaved" }),
  ).toMatchObject({ ok: false });
  expect(cookieValues.get("capsule_zero_mock_profile")).toBe(previous);
});

test("saved guest snapshots localize dashboard and stay outside legacy capsule candidates", async () => {
  const preset = guestCatalogCopy.find((item) => item.id === "w-tee-white")!;
  const fetchEmpty = globalThis.fetch;
  globalThis.fetch = async (input, init) =>
    String(input).endsWith("/api/guest-progress/items")
      ? Response.json([
          {
            id: "saved-guest-item",
            userId: session.userId,
            preset: {
              ...preset,
              wardrobe: "female",
              role: "top",
              categoryId: "t-shirt",
              colorId: "A3",
            },
            status: "uncapsulated",
            favorite: false,
            createdAt: "2026-10-20T00:00:00Z",
            updatedAt: "2026-10-20T00:00:00Z",
          },
        ])
      : fetchEmpty(input, init);
  type Options = {
    registry: ProviderRegistry;
    session: typeof session;
    locale: Locale;
  };
  type NamedItem = { id: string; name: string };
  const { buildDashboardSnapshot } = (await loader.import(
    "../../../../app/src/components/dashboard/dashboard-data.ts",
  )) as {
    buildDashboardSnapshot(
      options: Options,
    ): Promise<{ recentItems: NamedItem[] }>;
  };
  const { buildCapsuleResultSnapshot } = (await loader.import(
    "../../../../app/src/components/capsule-result/capsule-result-data.ts",
  )) as {
    buildCapsuleResultSnapshot(
      options: Options,
    ): Promise<{ availableItems: NamedItem[] }>;
  };
  for (const locale of ["ru", "en"] as const) {
    const options = { registry, session, locale };
    const capsule = await buildCapsuleResultSnapshot(options);
    expect(
      capsule.availableItems.find((item) => item.id === "saved-guest-item"),
    ).toBeUndefined();
    const dashboard = await buildDashboardSnapshot(options);
    expect(
      dashboard.recentItems.find((item) => item.id === "saved-guest-item")
        ?.name,
    ).toBe(preset.name[locale]);
  }
});
