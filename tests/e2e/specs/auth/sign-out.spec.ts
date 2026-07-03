import { expect, test } from "../../fixtures/base";
import { PASSWORDS, uniqueEmail } from "../../fixtures/accounts";
import { DashboardPage } from "../../pages/DashboardPage";

/**
 * Auth — sign-out from the dashboard navigation, and the state after it:
 * the session cookie is gone and the dashboard is locked behind /auth again.
 */
test.describe("Auth — sign out", () => {
  test("ends the session and locks the dashboard behind /auth", async ({
    page,
    landing,
    appLocale,
  }) => {
    await landing.goto();
    await landing.dismissCookieBannerIfPresent();
    await landing.openAuth();
    await landing.auth.signIn(uniqueEmail("signout"), PASSWORDS.initial);
    await page.waitForURL(/\/(en|ru)\/dashboard/, { timeout: 25_000 });

    const dashboard = new DashboardPage(page, appLocale);
    await dashboard.signOut();
    await page.waitForURL(/\/(en|ru)\/?$/, { timeout: 25_000 });

    // A direct visit after sign-out must bounce back to /auth.
    await dashboard.goto();
    await page.waitForURL(/\/(en|ru)\/auth/, { timeout: 25_000 });
    await expect(page).toHaveURL(/\/auth/);
  });
});
