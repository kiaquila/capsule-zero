import { expect, test } from "../../fixtures/base";
import { PASSWORDS, uniqueEmail } from "../../fixtures/accounts";
import { legalCopy, termsUpdateCopy } from "../../fixtures/locales";
import { DashboardPage } from "../../pages/DashboardPage";
import { LegalPage } from "../../pages/LegalPage";

test.describe("Landing — Terms safety-policy contract", () => {
  test("Terms incorporates the complete community safety policy stack", async ({
    page,
  }) => {
    const terms = new LegalPage(page, "terms-of-use");
    await terms.goto();

    await expect(terms.root).toContainText("Community Guidelines");
    await expect(terms.root).toContainText(
      "Copyright & Intellectual Property Policy",
    );
    await expect(terms.root).toContainText("Enforcement & Appeals Policy");
    await expect(terms.root).toContainText("neutral intermediary");
    await expect(terms.root).toContainText("good faith");
    await expect(terms.root).toContainText("User Content posted by other users");
    await expect(terms.article).toContainText(legalCopy.incorporationClause);
    await expect(terms.lastUpdated).toHaveText(legalCopy.termsLastUpdated);
    await expect(terms.effectiveDate).toHaveText(legalCopy.termsEffectiveDate);
  });

  test("Privacy revision date tracks the public contact change", async ({
    page,
  }) => {
    const privacy = new LegalPage(page, "privacy-policy");
    await privacy.goto();

    await expect(privacy.lastUpdated).toHaveText(legalCopy.privacyLastUpdated);
  });

  test("an existing signed-in user receives advance rollout notice", async ({
    page,
    landing,
  }) => {
    const dashboard = new DashboardPage(page);
    await landing.goto();
    await landing.dismissCookieBannerIfPresent();
    await landing.openAuth();
    await landing.auth.signIn(uniqueEmail("terms-notice"), PASSWORDS.initial);
    await page.waitForURL(/\/en\/dashboard/, { timeout: 25_000 });

    await expect(dashboard.termsUpdateNotice).toContainText(
      termsUpdateCopy.en.title,
    );
    await expect(dashboard.termsUpdateNotice).toContainText(
      termsUpdateCopy.en.description,
    );
    await expect(dashboard.termsUpdateLink).toHaveText(
      termsUpdateCopy.en.action,
    );
    await expect(dashboard.termsUpdateLink).toHaveAttribute(
      "href",
      "/en/terms-of-use",
    );
  });
});
