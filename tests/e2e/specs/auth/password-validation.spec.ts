import { expect, test } from "../../fixtures/base";
import { LOCALES, validationCopy } from "../../fixtures/locales";
import { uniqueEmail } from "../../fixtures/accounts";
import { authErrorMessageKey } from "../../../../app/src/features/auth/error-codes";

for (const locale of LOCALES) {
  test.describe(`Auth password validation (${locale})`, () => {
    test.use({ appLocale: locale });

    test("explains requirements, rejects invalid fields and accepts underscore", async ({ page, landing }) => {
      const copy = validationCopy[locale].auth;
      await landing.goto();
      await landing.dismissCookieBannerIfPresent();
      await landing.openAuth();
      await landing.auth.clickModeSwitch();
      await expect(landing.auth.passwordHint).toBeVisible();
      await expect(landing.auth.passwordHint).toContainText("8");
      await expect(landing.auth.passwordHint).toContainText("_");
      await landing.auth.emailInput.fill("invalid");
      await landing.auth.passwordInput.fill("short_");
      await landing.auth.confirmPasswordInput.fill("different_");
      await landing.auth.submit.click();
      await expect(landing.auth.fieldErrors).toContainText([copy.invalidEmail, copy.weakPassword, copy.passwordsMismatch]);
      await expect(page).not.toHaveURL(/\/dashboard/);
      expect(authErrorMessageKey("PASSWORD_TOO_SIMILAR")).toBe("errors.PASSWORD_TOO_SIMILAR");
      expect(authErrorMessageKey("UNKNOWN_UPSTREAM")).toBe("errors.default");
      await landing.auth.emailInput.fill(uniqueEmail("underscore"));
      await landing.auth.passwordInput.fill("Violet_73!Cedar");
      await landing.auth.confirmPasswordInput.fill("Violet_73!Cedar");
      await landing.auth.submit.click();
      await page.waitForURL(/\/dashboard/, { timeout: 25_000 });
    });
  });
}
