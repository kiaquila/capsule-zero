import { expect, test } from "../../fixtures/base";
import { LOCALES, validationCopy } from "../../fixtures/locales";
import { PASSWORDS, uniqueEmail } from "../../fixtures/accounts";
import { ProfilePage } from "../../pages/ProfilePage";

for (const locale of LOCALES) {
  test.describe(`Short personal names (${locale})`, () => {
    test.use({ appLocale: locale });

    test("saves Ян and a one-character surname, rejects blank names", async ({
      page,
      landing,
    }) => {
      const copy = validationCopy[locale].profile;
      await landing.goto();
      await landing.dismissCookieBannerIfPresent();
      await landing.openAuth();
      await landing.auth.signUp(uniqueEmail("short-name"), PASSWORDS.initial);
      await page.waitForURL(/\/dashboard/, { timeout: 25_000 });
      const profile = new ProfilePage(page, locale);
      await profile.goto();
      // A client interaction confirms hydration before editing SSR inputs.
      await profile.openPasswordForm();
      await profile.firstName.fill(" Ян ");
      await profile.lastName.fill(" Л ");
      await profile.save.click();
      await expect(profile.toast).toHaveText(copy.notice.saved);
      await expect(profile.displayName).toHaveText("Ян Л");
      await profile.firstName.fill("   ");
      await profile.lastName.fill("");
      await profile.save.click();
      await expect(profile.nameErrors).toContainText([
        copy.validation.firstName,
        copy.validation.lastName,
      ]);
    });
  });
}
