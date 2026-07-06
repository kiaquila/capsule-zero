import { expect, test } from "../../fixtures/base";
import {
  MOCK_ONE_TIME_CODE,
  PASSWORDS,
  uniqueEmail,
} from "../../fixtures/accounts";

/**
 * Auth — "Forgot password?" on the sign-in form (provider-agnostic UI
 * mechanics; the real credential rotation is covered by
 * forgot-password-fullstack.spec.ts against Kratos + MailHog).
 */
test.describe("Auth — forgot password", () => {
  test.beforeEach(async ({ landing }) => {
    await landing.goto();
    await landing.dismissCookieBannerIfPresent();
    await landing.openAuth();
  });

  test("prefills the sign-in email, resets with the code, and signs in", async ({
    page,
    landing,
  }) => {
    const email = uniqueEmail("forgot");

    // The email already typed on the sign-in form must carry over — the user
    // is never asked to type it twice.
    await landing.auth.container.locator('input[name="email"]').fill(email);
    await landing.auth.forgotPasswordLink.click();
    await expect(landing.auth.recoveryEmailInput).toHaveValue(email);

    await landing.auth.recoverySubmit.click();
    await expect(landing.auth.recoveryCodeInput).toBeVisible();
    await landing.auth.completeRecovery(MOCK_ONE_TIME_CODE, PASSWORDS.changed);

    await page.waitForURL(/\/(en|ru)\/dashboard/, { timeout: 25_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("a wrong code shows an error and never signs the user in", async ({
    page,
    landing,
  }) => {
    await landing.auth.requestRecovery(uniqueEmail("forgot-neg"));

    await expect(landing.auth.recoveryCodeInput).toBeVisible();
    await landing.auth.completeRecovery("000000", PASSWORDS.changed);

    await expect(landing.auth.serverMessage).toBeVisible();
    await expect(page).not.toHaveURL(/\/dashboard/);
  });
});
