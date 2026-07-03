import { expect, test } from "../../fixtures/base";
import { PASSWORDS, uniqueEmail } from "../../fixtures/accounts";
import { mailhogUrl } from "../../fixtures/mailhog";
import { ProfilePage } from "../../pages/ProfilePage";

/**
 * Profile — change password against the docker stack: the real credential
 * rotation. After the change the old password must stop working and the new
 * one must sign in. Gated like the other full-stack specs.
 */
test.describe("Profile — change password (full stack)", () => {
  test.skip(!mailhogUrl, "requires the docker stack (set E2E_MAILHOG_URL)");

  test("changes the password; the old one stops working, the new one signs in", async ({
    page,
    landing,
    appLocale,
  }) => {
    test.setTimeout(120_000);
    const email = uniqueEmail("fs-pwd");

    await landing.goto();
    await landing.dismissCookieBannerIfPresent();
    await landing.openAuth();
    await landing.auth.signUp(email, PASSWORDS.initial);
    await page.waitForURL(/\/(en|ru)\/dashboard/, { timeout: 30_000 });

    // Negative scenario 2: a wrong current password is rejected in place.
    const profile = new ProfilePage(page, appLocale);
    await profile.goto();
    await profile.changePassword("NotMyPassword1", PASSWORDS.changed);
    await expect(profile.passwordError).toBeVisible();

    // The real current password goes through.
    await profile.currentPasswordInput.fill(PASSWORDS.initial);
    await profile.passwordSubmit.click();
    await expect(profile.toast).toBeVisible();

    // Old password dead, new one works.
    await page.context().clearCookies();
    await landing.goto();
    await landing.dismissCookieBannerIfPresent();
    await landing.openAuth();
    await landing.auth.signIn(email, PASSWORDS.initial);
    await expect(landing.auth.serverMessage).toBeVisible();
    await expect(page).not.toHaveURL(/\/dashboard/);

    await landing.auth.signIn(email, PASSWORDS.changed);
    await page.waitForURL(/\/(en|ru)\/dashboard/, { timeout: 30_000 });
  });
});
