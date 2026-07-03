import { expect, test } from "../../fixtures/base";
import { VerifyEmailBanner } from "../../pages/VerifyEmailBanner";

/**
 * Spec 035 — email verification banner (provider-agnostic).
 *
 * Sign-up keeps auto-login (founder decision 2026-07-03); the dashboard shows
 * a non-blocking verify-email banner until the emailed code is confirmed. The
 * mock provider accepts the deterministic code `123456`.
 */
function uniqueEmail(): string {
  return `e2e+ver-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

test.describe("Auth slice — email verification banner (spec 035)", () => {
  test("sign-up shows the banner; a wrong code keeps it, the right code clears it", async ({
    page,
    landing,
  }) => {
    await landing.goto();
    await landing.dismissCookieBannerIfPresent();
    await landing.openAuth();
    await landing.auth.clickModeSwitch();

    const form = landing.auth.container;
    const password = "SuperSecret123";
    await form.locator('input[name="email"]').fill(uniqueEmail());
    await form.locator('input[name="password"]').fill(password);
    await form.locator('input[name="confirmPassword"]').fill(password);
    await form.locator('button[type="submit"]').click();
    await page.waitForURL(/\/(en|ru)\/dashboard/, { timeout: 25_000 });

    const banner = new VerifyEmailBanner(page);
    await expect(banner.container).toBeVisible();

    // Negative scenario 4: a wrong code keeps the address unverified.
    await banner.submitCode("000000");
    await expect(banner.errorMessage).toBeVisible();
    await expect(banner.container).toBeVisible();

    await banner.submitCode("123456");
    await expect(banner.container).toBeHidden();
  });
});
