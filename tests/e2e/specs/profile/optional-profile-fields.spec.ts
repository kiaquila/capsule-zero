import { expect, test } from "../../fixtures/base";
import { LOCALES, validationCopy } from "../../fixtures/locales";
import { PASSWORDS, uniqueEmail } from "../../fixtures/accounts";
import { ProfilePage } from "../../pages/ProfilePage";

for (const locale of LOCALES) {
  test.describe(`Optional profile fields (${locale})`, () => {
    test.use({ appLocale: locale });
    test("starts empty, preserves explicit values and supports clearing", async ({
      page,
      landing,
    }) => {
      await landing.goto();
      await landing.dismissCookieBannerIfPresent();
      await landing.openAuth();
      await landing.auth.signUp(
        uniqueEmail("empty-profile"),
        PASSWORDS.initial,
      );
      await page.waitForURL(/\/dashboard/, { timeout: 25_000 });
      const profile = new ProfilePage(page, locale);
      await profile.goto();
      await profile.openPasswordForm();
      for (const field of Object.values(profile.optionalFields))
        await expect(field).toHaveValue("");
      await expect(profile.sessionRows).toHaveCount(0);
      await expect(profile.currentSessionBadge).toHaveCount(0);
      await expect(profile.sessionsUnavailable).toBeVisible();
      await profile.firstName.fill("Real");
      await profile.lastName.fill("Person");
      await profile.save.click();
      await expect(profile.toast).toHaveText(
        validationCopy[locale].profile.notice.saved,
      );
      await page.reload();
      for (const field of Object.values(profile.optionalFields))
        await expect(field).toHaveValue("");
      await profile.openPasswordForm();
      await profile.optionalFields.dateOfBirth.fill("1992-06-15");
      await profile.optionalFields.country.selectOption("AR");
      await profile.optionalFields.city.fill("Buenos Aires");
      await profile.optionalFields.shoeSize.selectOption("37");
      await profile.optionalFields.topSize.selectOption("S");
      await profile.optionalFields.bottomSize.selectOption("S");
      await profile.save.click();
      await expect(profile.toast).toHaveText(
        validationCopy[locale].profile.notice.saved,
      );
      await page.reload();
      await expect(profile.optionalFields.dateOfBirth).toHaveValue(
        "1992-06-15",
      );
      await expect(profile.optionalFields.country).toHaveValue("AR");
      await expect(profile.optionalFields.city).toHaveValue("Buenos Aires");
      await expect(profile.optionalFields.shoeSize).toHaveValue("37");
      await expect(profile.optionalFields.topSize).toHaveValue("S");
      await expect(profile.optionalFields.bottomSize).toHaveValue("S");
      await profile.openPasswordForm();
      for (const name of ["phone", "dateOfBirth", "city"] as const)
        await profile.optionalFields[name].fill("");
      for (const name of [
        "country",
        "shoeSize",
        "topSize",
        "bottomSize",
      ] as const)
        await profile.optionalFields[name].selectOption("");
      await profile.save.click();
      await expect(profile.toast).toHaveText(
        validationCopy[locale].profile.notice.saved,
      );
      await page.reload();
      for (const field of Object.values(profile.optionalFields))
        await expect(field).toHaveValue("");
    });
  });
}
