import { expect, test } from "../../fixtures/base";

const COOKIE_STORAGE_KEY = "capsule_zero_cookie_consent";

test.describe("Landing — cookie banner", () => {
  test("appears on first visit and is dismissed by Accept all", async ({
    landing,
  }) => {
    await landing.goto();

    await expect(landing.cookieBanner).toBeVisible();

    await landing.acceptAllCookies();

    const raw = await landing.readLocalStorage(COOKIE_STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw as string) as {
      decidedAt?: string;
      necessary?: boolean;
    };
    expect(parsed.necessary).toBe(true);
    expect(typeof parsed.decidedAt).toBe("string");
    expect(parsed.decidedAt?.length ?? 0).toBeGreaterThan(0);
  });

  // Negative scenario: the banner must NOT come back once consent is recorded
  // within the same browser context.
  test("does not reappear after reload when consent is recorded", async ({
    landing,
  }) => {
    await landing.goto();
    await landing.acceptAllCookies();

    await landing.reload();

    await expect(landing.cookieBanner).toHaveCount(0);
  });
});
