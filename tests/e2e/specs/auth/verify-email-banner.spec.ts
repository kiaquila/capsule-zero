import { expect, test } from "../../fixtures/base";
import {
  MOCK_ONE_TIME_CODE,
  PASSWORDS,
  uniqueEmail,
} from "../../fixtures/accounts";
import { VerifyEmailBanner } from "../../pages/VerifyEmailBanner";

/**
 * Auth — the verify-email notification banner on the dashboard
 * (provider-agnostic UI mechanics). Sign-up keeps auto-login (founder
 * decision 2026-07-03); the banner stays non-blocking until the emailed code
 * is confirmed. Real emails are covered by verify-email-fullstack.spec.ts.
 */
test.describe("Auth — verify-email banner", () => {
  test("appears after sign-up; a wrong code keeps it, the right code clears it", async ({
    page,
    landing,
  }) => {
    await landing.goto();
    await landing.dismissCookieBannerIfPresent();
    await landing.openAuth();
    await landing.auth.signUp(uniqueEmail("banner"), PASSWORDS.initial);
    await page.waitForURL(/\/(en|ru)\/dashboard/, { timeout: 25_000 });

    const banner = new VerifyEmailBanner(page);
    await expect(banner.container).toBeVisible();

    // Negative scenario 4: a wrong code keeps the address unverified.
    await banner.submitCode("000000");
    await expect(banner.errorMessage).toBeVisible();
    await expect(banner.container).toBeVisible();

    await banner.submitCode(MOCK_ONE_TIME_CODE);
    await expect(banner.container).toBeHidden();
  });
});
