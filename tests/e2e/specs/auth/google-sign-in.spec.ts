import { expect, test } from "../../fixtures/base";
import { AuthStandalonePage } from "../../pages/AuthStandalonePage";

/**
 * Auth — Google sign-in (spec 037, provider-agnostic UI mechanics).
 * The mock provider drives the full native-flow loop deterministically:
 * start returns a redirect straight back to the app's callback route with a
 * mock return code, and complete issues the standard mock session. The real
 * Google consent dance is a post-rollout operator smoke (plan.md row 9).
 */
test.describe("Auth — Google sign-in", () => {
  test("signs in via Google and lands on the dashboard; the session survives a reload", async ({
    page,
    landing,
    appLocale,
  }) => {
    const auth = new AuthStandalonePage(page, appLocale);
    await auth.goto();
    // On mobile viewports the cookie banner overlaps the auth panel.
    await landing.dismissCookieBannerIfPresent();

    await expect(auth.googleButton).toBeVisible();
    await auth.googleButton.click();

    await page.waitForURL(/\/(en|ru)\/dashboard/, { timeout: 25_000 });

    await auth.reload();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("callback without a code creates no session and shows the localized error", async ({
    page,
    appLocale,
  }) => {
    // Negative scenario 1: canceled consent, a duplicate-email rejection, or
    // direct navigation all land on the callback without a return code.
    await page.goto(`/${appLocale}/auth/google/callback`);

    await page.waitForURL(/\/(en|ru)\/auth\?googleError=1/, {
      timeout: 25_000,
    });
    const auth = new AuthStandalonePage(page, appLocale);
    await expect(auth.serverMessage).toBeVisible();

    // No session was created: the dashboard stays locked behind /auth.
    await page.goto(`/${appLocale}/dashboard`);
    await page.waitForURL(/\/(en|ru)\/auth/, { timeout: 25_000 });
  });
});
