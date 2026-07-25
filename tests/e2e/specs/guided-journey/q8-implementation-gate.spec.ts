import { PASSWORDS, uniqueEmail } from "../../fixtures/accounts";
import { expect, test } from "../../fixtures/base";
import { GuidedJourneyPage } from "../../pages/GuidedJourneyPage";

test.describe("Guided journey — Q8 implementation gate", () => {
  test("keeps merchant link import visible but non-operational", async ({
    appLocale,
    landing,
    page,
  }) => {
    await landing.goto();
    await landing.dismissCookieBannerIfPresent();
    await landing.openAuth();
    await landing.auth.signIn(uniqueEmail("q8-gate"), PASSWORDS.initial);
    await page.waitForURL(/\/(en|ru)\/dashboard/, { timeout: 25_000 });

    const journey = new GuidedJourneyPage(page, appLocale);
    await journey.goto();

    await expect(journey.searchTab).toHaveAttribute("aria-selected", "true");
    await expect(journey.linkTab).toBeDisabled();
    await expect(journey.linkInput).toHaveCount(0);
  });
});
