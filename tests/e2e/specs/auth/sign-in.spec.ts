import { expect, test } from "../../fixtures/base";
import { PASSWORDS, uniqueEmail } from "../../fixtures/accounts";

/**
 * Auth — sign-in through the /auth popup (provider-agnostic UI mechanics).
 * Credential truth (wrong password rejected, etc.) lives in the full-stack
 * specs; the mock provider accepts any password by design.
 */
test.describe("Auth — sign in", () => {
  test("signs in and lands on the dashboard; the session survives a reload", async ({
    page,
    landing,
  }) => {
    await landing.goto();
    await landing.dismissCookieBannerIfPresent();
    await landing.openAuth();
    await landing.auth.signIn(uniqueEmail("signin"), PASSWORDS.initial);

    await page.waitForURL(/\/(en|ru)\/dashboard/, { timeout: 25_000 });

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
