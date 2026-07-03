import { expect, test } from "../../fixtures/base";
import { ProfilePage } from "../../pages/ProfilePage";

/**
 * Spec 035 — password change from the profile screen (provider-agnostic).
 *
 * The former mock "Change password" button becomes a real form (current + new
 * password). Mock rules (spec 035): the sentinel current password
 * `WrongPass123` is rejected; any other current password succeeds.
 */
test.describe("Auth slice — profile password change (spec 035)", () => {
  test.beforeEach(async ({ page, landing }) => {
    await landing.goto();
    await landing.dismissCookieBannerIfPresent();
    await landing.openAuth();

    const form = landing.auth.container;
    await form
      .locator('input[name="email"]')
      .fill(`e2e+pwd-${Date.now()}@example.com`);
    await form.locator('input[name="password"]').fill("SuperSecret123");
    await form.locator('button[type="submit"]').click();
    await page.waitForURL(/\/(en|ru)\/dashboard/, { timeout: 25_000 });
  });

  test("rejects a wrong current password and succeeds with the right one", async ({
    page,
    appLocale,
  }) => {
    const profile = new ProfilePage(page, appLocale);
    await profile.goto();

    // Negative scenario 2: wrong current password → error, form stays open.
    await profile.changePassword("WrongPass123", "NewSecret456");
    await expect(profile.passwordError).toBeVisible();
    await expect(profile.passwordForm).toBeVisible();

    await profile.currentPasswordInput.fill("SuperSecret123");
    await profile.passwordSubmit.click();
    await expect(profile.toast).toBeVisible();
    await expect(profile.passwordForm).toBeHidden();
  });
});
