import { expect, test } from "../../fixtures/base";
import { legalCopy } from "../../fixtures/locales";
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

  test("keeps the superseded Terms at a permanent archive URL", async ({
    page,
    landing,
  }) => {
    const archivedTerms = new LegalPage(page, "terms-of-use/2026-07-24");
    await archivedTerms.goto();

    await expect(archivedTerms.lastUpdated).toHaveText(
      legalCopy.archivedTermsLastUpdated,
    );
    await expect(archivedTerms.effectiveDate).toHaveText(
      legalCopy.archivedTermsEffectiveDate,
    );
    await expect(archivedTerms.article).not.toContainText(
      legalCopy.incorporationClause,
    );
    await expect(archivedTerms.article).toContainText(
      legalCopy.archivedTermsHistoricalDomain,
    );
    await expect(archivedTerms.article).toContainText(
      legalCopy.archivedTermsHistoricalContact,
    );
    await expect(archivedTerms.article).not.toContainText(
      legalCopy.archivedTermsUnpublishedIntro,
    );
    await expect(archivedTerms.root).toContainText(
      legalCopy.archivedTermsCurrentContact,
    );

    await landing.goto();
    await landing.dismissCookieBannerIfPresent();
    await landing.openAuth();
    await expect(landing.auth.termsLink).toHaveAttribute(
      "href",
      "/en/terms-of-use",
    );
  });

  test("Privacy revision date tracks the public contact change", async ({
    page,
  }) => {
    const privacy = new LegalPage(page, "privacy-policy");
    await privacy.goto();

    await expect(privacy.lastUpdated).toHaveText(legalCopy.privacyLastUpdated);
    await expect(privacy.article).not.toContainText(
      legalCopy.retiredRepresentativeClaim,
    );
  });

  test("publishes the current Privacy revision in Russian", async ({ page }) => {
    const privacy = new LegalPage(page, "privacy-policy", "ru");
    await privacy.goto();

    await expect(privacy.heading).toHaveText(legalCopy.privacyRussianTitle);
    await expect(privacy.article).toContainText(
      legalCopy.privacyRussianRepresentativeStatus,
    );
    await expect(privacy.article).toContainText(legalCopy.contactEmail);
    await expect(privacy.article).not.toContainText(
      "Capsule Zero appoints local representatives",
    );
  });
});
