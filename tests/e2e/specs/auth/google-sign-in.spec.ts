import { expect, test } from "../../fixtures/base";

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
  }) => {
    await page.goto("/en/auth");
    // On mobile viewports the cookie banner overlaps the auth panel.
    await landing.dismissCookieBannerIfPresent();

    const googleButton = page.getByTestId("auth-google-button");
    await expect(googleButton).toBeVisible();
    await googleButton.click();

    await page.waitForURL(/\/(en|ru)\/dashboard/, { timeout: 25_000 });

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("callback without a code creates no session and shows the localized error", async ({
    page,
  }) => {
    // Negative scenario 1: canceled consent, a duplicate-email rejection, or
    // direct navigation all land on the callback without a return code.
    await page.goto("/en/auth/google/callback");

    await page.waitForURL(/\/(en|ru)\/auth\?googleError=1/, {
      timeout: 25_000,
    });
    await expect(page.locator(".auth-server-message")).toBeVisible();

    // No session was created: the dashboard stays locked behind /auth.
    await page.goto("/en/dashboard");
    await page.waitForURL(/\/(en|ru)\/auth/, { timeout: 25_000 });
  });
});
