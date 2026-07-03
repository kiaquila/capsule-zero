import { expect, test } from "../../fixtures/base";
import {
  MOCK_WRONG_CURRENT_PASSWORD,
  PASSWORDS,
  uniqueEmail,
} from "../../fixtures/accounts";
import { ProfilePage } from "../../pages/ProfilePage";

/**
 * Profile — the "Change Password" form in Login & Security (provider-agnostic
 * UI mechanics; the mock rejects the sentinel current password). The real
 * credential rotation — old password stops working — is covered by
 * profile-change-password-fullstack.spec.ts.
 */
test.describe("Profile — change password", () => {
  test.beforeEach(async ({ page, landing }) => {
    await landing.goto();
    await landing.dismissCookieBannerIfPresent();
    await landing.openAuth();
    await landing.auth.signIn(uniqueEmail("pwd"), PASSWORDS.initial);
    await page.waitForURL(/\/(en|ru)\/dashboard/, { timeout: 25_000 });
  });

  test("rejects a wrong current password and succeeds with the right one", async ({
    page,
    appLocale,
  }) => {
    const profile = new ProfilePage(page, appLocale);
    await profile.goto();

    // Negative scenario 2: wrong current password → error, form stays open.
    await profile.changePassword(
      MOCK_WRONG_CURRENT_PASSWORD,
      PASSWORDS.changed,
    );
    await expect(profile.passwordError).toBeVisible();
    await expect(profile.passwordForm).toBeVisible();

    await profile.currentPasswordInput.fill(PASSWORDS.initial);
    await profile.passwordSubmit.click();
    await expect(profile.toast).toBeVisible();
    await expect(profile.passwordForm).toBeHidden();
  });
});
