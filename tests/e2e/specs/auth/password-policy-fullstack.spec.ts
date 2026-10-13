import { expect, test } from "../../fixtures/base";
import { LOCALES, validationCopy } from "../../fixtures/locales";
import { uniqueEmail } from "../../fixtures/accounts";

// Opt-in like other full-stack specs: the standard CI suite uses mock mode.
// Run with the app's api provider connected to disposable Go/Kratos/Postgres.
for (const locale of LOCALES) {
  test.describe(`Password policy feedback (${locale}, full stack)`, () => {
    test.use({ appLocale: locale });
    test.skip(
      !process.env.E2E_API_VALIDATION,
      "requires the api provider and disposable Kratos/Postgres",
    );

    test("explains identifier similarity and accepts an unrelated underscore password", async ({
      page,
      landing,
    }) => {
      const email = uniqueEmail("similarity");
      const identifierPassword = email.split("@")[0]!;
      await landing.goto();
      await landing.dismissCookieBannerIfPresent();
      await landing.openAuth();
      await landing.auth.signUp(email, identifierPassword);
      await expect(landing.auth.serverMessage).toHaveText(
        validationCopy[locale].auth.errors.PASSWORD_TOO_SIMILAR!,
      );
      await expect(page).not.toHaveURL(/\/dashboard/);
      await expect(landing.auth.serverMessage).not.toContainText(
        identifierPassword,
      );
      await landing.auth.passwordInput.fill("Violet_73!Cedar");
      await landing.auth.confirmPasswordInput.fill("Violet_73!Cedar");
      await landing.auth.submit.click();
      await page.waitForURL(/\/dashboard/, { timeout: 25_000 });
    });
  });
}
