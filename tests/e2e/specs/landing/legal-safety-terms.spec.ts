import { expect, test } from "../../fixtures/base";
import { legalCopy } from "../../fixtures/locales";
import { LegalPage } from "../../pages/LegalPage";
import {
  resolveApplicableTermsVersion,
  shouldShowTermsUpdateNotice,
} from "../../../../app/src/lib/legal/terms-boundary.mjs";

test.describe("Landing — Terms safety-policy contract", () => {
  test("Terms incorporates the complete community safety policy stack", async ({
    page,
  }) => {
    const terms = new LegalPage(page, "terms-of-use/2026-09-15");
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

  test("keeps the governing Terms accessible until the future version takes effect", async ({
    page,
    landing,
  }) => {
    const currentTerms = new LegalPage(page, "terms-of-use");
    await currentTerms.goto();

    await expect(currentTerms.lastUpdated).toHaveText(
      legalCopy.currentTermsLastUpdated,
    );
    await expect(currentTerms.effectiveDate).toHaveText(
      legalCopy.currentTermsEffectiveDate,
    );
    await expect(currentTerms.article).not.toContainText(
      legalCopy.incorporationClause,
    );

    await landing.goto();
    await landing.dismissCookieBannerIfPresent();
    await landing.openAuth();
    await expect(landing.auth.termsLink).toHaveAttribute(
      "href",
      "/en/terms-of-use",
    );
  });

  test("switches the applicable version and retires the notice at effectiveness", () => {
    const justBefore = new Date("2026-09-14T23:59:59.999Z");
    const effectiveAt = new Date("2026-09-15T00:00:00.000Z");

    expect(resolveApplicableTermsVersion(justBefore)).toBe("2026-07-24");
    expect(resolveApplicableTermsVersion(effectiveAt)).toBe("2026-09-15");
    expect(shouldShowTermsUpdateNotice(justBefore)).toBe(true);
    expect(shouldShowTermsUpdateNotice(effectiveAt)).toBe(false);
  });

  test("Privacy revision date tracks the public contact change", async ({
    page,
  }) => {
    const privacy = new LegalPage(page, "privacy-policy");
    await privacy.goto();

    await expect(privacy.lastUpdated).toHaveText(legalCopy.privacyLastUpdated);
  });

});
