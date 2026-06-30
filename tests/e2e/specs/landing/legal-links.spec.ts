import { expect, test } from "../../fixtures/base";
import { LegalPage } from "../../pages/LegalPage";

test.describe("Landing — legal document links", () => {
  test("footer Terms link opens the Terms page and Back returns home", async ({
    landing,
    page,
  }) => {
    await landing.goto();
    await landing.dismissCookieBannerIfPresent();

    await landing.footerTermsLink.click();

    const terms = new LegalPage(page, "terms-of-use");
    await expect(page).toHaveURL(/\/en\/terms-of-use$/);
    await expect(terms.root).toBeVisible();
    await expect(terms.heading).toBeVisible();

    await terms.backToHome.click();

    await expect(page).toHaveURL(/\/en$/);
    await expect(landing.authTrigger).toBeVisible();
  });

  test("footer Privacy link opens the Privacy page", async ({
    landing,
    page,
  }) => {
    await landing.goto();
    await landing.dismissCookieBannerIfPresent();

    await landing.footerPrivacyLink.click();

    const privacy = new LegalPage(page, "privacy-policy");
    await expect(page).toHaveURL(/\/en\/privacy-policy$/);
    await expect(privacy.root).toBeVisible();
    await expect(privacy.heading).toBeVisible();
  });

  // Negative scenario: the footer Terms link must NOT be a dead in-page
  // anchor (the `#terms` regression) — it must route to the static page.
  test("footer Terms link is not a dead in-page anchor", async ({
    landing,
    page,
  }) => {
    await landing.goto();
    await landing.dismissCookieBannerIfPresent();

    await landing.footerTermsLink.click();

    await expect(page).not.toHaveURL(/#terms$/);
    await expect(page).toHaveURL(/\/terms-of-use$/);
  });
});
