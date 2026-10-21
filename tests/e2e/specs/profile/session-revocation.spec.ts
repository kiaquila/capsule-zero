import path from "node:path";
import { createJiti } from "jiti";
import { expect, test } from "../../fixtures/base";

const appRoot = path.resolve(process.cwd(), "../../app");
const loader = createJiti(import.meta.url, {
  alias: {
    "@": path.join(appRoot, "src"),
    "next/headers": path.resolve("support/empty-next-headers.ts"),
    "server-only": path.join(appRoot, "node_modules/server-only/empty.js"),
  },
});
const other = "22222222-2222-4222-8222-222222222222";
const session = {
  userId: "owner",
  email: "owner@example.invalid",
  accessToken: "signed-token",
  expiresAt: "2099-01-01T00:00:00Z",
};
const originalFetch = globalThis.fetch;
let cookies: Map<string, string>;
let revoke: (id: string | null) => Promise<{ ok: boolean; code?: string }>;
let calls: string[];
let upstreamStatus: number;

test.beforeEach(async () => {
  process.env.CAPSULE_PROVIDER_MODE = "api";
  ({ cookieValues: cookies } = (await loader.import(
    "../../support/empty-next-headers.ts",
  )) as { cookieValues: Map<string, string> });
  cookies.clear();
  const { serializeSignedSession } = (await loader.import(
    "../../../../app/src/features/auth/session-codec.ts",
  )) as {
    serializeSignedSession(value: typeof session): Promise<string>;
  };
  cookies.set("capsule_zero_session", await serializeSignedSession(session));
  calls = [];
  upstreamStatus = 204;
  globalThis.fetch = async (input, init) => {
    expect(init?.method).toBe("DELETE");
    expect(init?.cache).toBe("no-store");
    expect(new Headers(init?.headers).get("Authorization")).toBe(
      "Bearer signed-token",
    );
    calls.push(new URL(String(input)).pathname);
    return upstreamStatus === 204
      ? new Response(null, { status: 204 })
      : Response.json(
          { error: { code: "UNAUTHENTICATED", message: "private error" } },
          { status: upstreamStatus },
        );
  };
  ({ revokeSessionAction: revoke } = (await loader.import(
    "../../../../app/src/features/profile/actions.ts",
  )) as { revokeSessionAction: typeof revoke });
});
test.afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.CAPSULE_PROVIDER_MODE;
  cookies?.clear();
});

test("signed-token single and bulk actions use only their intended endpoints", async () => {
  expect(await revoke(other)).toEqual({ ok: true });
  expect(await revoke(null)).toEqual({ ok: true });
  expect(calls).toEqual([`/api/auth/sessions/${other}`, "/api/auth/sessions"]);
});
test("invalid input, missing session and unsupported provider never mutate", async () => {
  expect(await revoke("../sessions")).toMatchObject({ ok: false });
  expect(calls).toEqual([]);
  cookies.clear();
  expect(await revoke(other)).toMatchObject({
    ok: false,
    code: "UNAUTHENTICATED",
  });
  expect(calls).toEqual([]);
  process.env.CAPSULE_PROVIDER_MODE = "mock";
  expect(await revoke(null)).toMatchObject({ ok: false });
  expect(calls).toEqual([]);
});
test("upstream rejection or network failure never becomes successful revocation", async () => {
  upstreamStatus = 401;
  expect(await revoke(other)).toMatchObject({
    ok: false,
    code: "UNAUTHENTICATED",
  });
  upstreamStatus = 502;
  expect(await revoke(null)).toMatchObject({ ok: false });
  globalThis.fetch = async () => {
    throw new Error("network failed");
  };
  expect(await revoke(other)).toMatchObject({ ok: false });
});
