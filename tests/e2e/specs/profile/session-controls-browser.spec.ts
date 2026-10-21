import { createServer, type Server } from "node:http";
import path from "node:path";
import { createJiti } from "jiti";
import { expect, test } from "../../fixtures/base";
import { ProfilePage } from "../../pages/ProfilePage";

// Dedicated local API-provider browser smoke; never targets a real account.
// E2E_SESSION_REVOCATION=1 CAPSULE_PROVIDER_MODE=api
// CAPSULE_API_BASE_URL=http://127.0.0.1:34488 ... --workers=1
const enabled = process.env.E2E_SESSION_REVOCATION === "1";
test.skip(!enabled, "requires the isolated local session API fixture");
test.describe.configure({ mode: "serial" });
const ids = [
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
  "33333333-3333-4333-8333-333333333333",
];
const session = {
  userId: "browser-session-owner",
  email: "browser@example.invalid",
  name: "Browser Owner",
  accessToken: "local-browser-token",
  expiresAt: "2099-01-01T00:00:00Z",
};
let server: Server;
let active: string[];
let failNext: boolean;
let release: (() => void) | undefined;
let received: number;
let profileWrites: number;

function releaseWrite() {
  release?.();
}

test.beforeAll(async () => {
  server = createServer(async (req, res) => {
    const pathname = new URL(req.url!, "http://localhost").pathname;
    const json = (body: unknown, status = 200) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(body));
    };
    if (req.headers.authorization !== `Bearer ${session.accessToken}`) {
      json({ error: { code: "UNAUTHENTICATED" } }, 401);
      return;
    }
    if (pathname === "/api/auth/whoami") {
      json({
        session: { token: session.accessToken, expiresAt: session.expiresAt },
        user: { id: session.userId, email: session.email, name: session.name },
      });
      return;
    }
    if (pathname === "/api/profile") {
      if (req.method === "PATCH") profileWrites++;
      json({
        userId: session.userId,
        email: session.email,
        displayName: session.name,
        locale: "en",
        coinBalance: 0,
        createdAt: "",
        updatedAt: "",
      });
      return;
    }
    if (pathname === "/api/guest-progress/items") {
      json([]);
      return;
    }
    if (pathname === "/api/auth/sessions" && req.method === "GET") {
      json(
        active.map((id) => ({
          id,
          current: id === ids[0],
          expiresAt: session.expiresAt,
        })),
      );
      return;
    }
    if (pathname.startsWith("/api/auth/sessions") && req.method === "DELETE") {
      received++;
      if (failNext) {
        await new Promise<void>((resolve) => {
          release = resolve;
        });
        failNext = false;
        json({ error: { code: "INTERNAL_ERROR" } }, 502);
        return;
      }
      const target = pathname.slice("/api/auth/sessions/".length);
      active =
        pathname === "/api/auth/sessions"
          ? active.filter((id) => id === ids[0])
          : active.filter((id) => id !== target || id === ids[0]);
      res.writeHead(204);
      res.end();
      return;
    }
    json({}, 404);
  });
  await new Promise<void>((resolve) =>
    server.listen(34488, "127.0.0.1", resolve),
  );
});

test.afterAll(async () => {
  releaseWrite();
  server?.closeAllConnections();
  if (server)
    await new Promise<void>((resolve) => server.close(() => resolve()));
});

for (const locale of ["en", "ru"] as const) {
  test(`${locale}: pending and failed writes retain rows; single and bulk preserve current and edits`, async ({
    page,
  }, testInfo) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    active = [...ids];
    failNext = true;
    received = 0;
    profileWrites = 0;
    release = undefined;
    const appRoot = path.resolve(process.cwd(), "../../app");
    const loader = createJiti(import.meta.url);
    const { serializeSignedSession } = (await loader.import(
      path.join(appRoot, "src/features/auth/session-codec.ts"),
    )) as { serializeSignedSession(value: typeof session): Promise<string> };
    const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
    await page.context().addCookies([
      {
        name: "capsule_zero_session",
        value: await serializeSignedSession(session),
        url: baseURL,
      },
    ]);
    const profile = new ProfilePage(page, locale);
    await profile.goto();
    await expect(profile.revokeSession).toHaveCount(2);
    await profile.openPasswordForm();
    expect(pageErrors).toEqual([]);
    await testInfo.attach("session-controls", {
      body: await profile.sessionPanel.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await profile.firstName.fill("Unsaved");
    try {
      await profile.revokeSession.first().click();
      await expect.poll(() => received).toBe(1);
      await expect(profile.revokeSession.first()).toBeDisabled();
      await expect(profile.revokeSession.last()).toBeDisabled();
      await expect(profile.revokeOthers).toBeDisabled();
      await expect(profile.sessionRows).toHaveCount(3);
    } finally {
      releaseWrite();
    }
    await expect(profile.sessionFeedback).toHaveAttribute("role", "alert");
    await expect(profile.sessionRows).toHaveCount(3);
    await profile.revokeSession.first().click();
    await expect(profile.sessionRows).toHaveCount(2);
    await expect(profile.sessionFeedback).toHaveAttribute("role", "status");
    await profile.revokeOthers.click();
    await expect(profile.sessionRows).toHaveCount(1);
    await expect(profile.currentSessionBadge).toHaveCount(1);
    await expect(profile.revokeSession).toHaveCount(0);
    await expect(profile.revokeOthers).toHaveCount(0);
    await expect(profile.firstName).toHaveValue("Unsaved");
    expect(profileWrites).toBe(0);
    await page.reload();
    await expect(profile.sessionRows).toHaveCount(1);
    await expect(profile.currentSessionBadge).toHaveCount(1);
    expect(pageErrors).toEqual([]);
  });
}
