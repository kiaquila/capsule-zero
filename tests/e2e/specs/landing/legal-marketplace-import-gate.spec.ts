import { expect, test } from "../../fixtures/base";
import { legalCopy, LOCALES } from "../../fixtures/locales";
import { LegalPage, type LegalSlug } from "../../pages/LegalPage";

const documents: ReadonlyArray<{
  slug: LegalSlug;
  requiredCopy: (locale: (typeof LOCALES)[number]) => string;
}> = [
  {
    slug: "terms-of-use",
    requiredCopy: (locale) => legalCopy.termsMarketplaceImportGate[locale],
  },
  {
    slug: "privacy-policy",
    requiredCopy: () => legalCopy.privacyMarketplaceImportGate,
  },
];

test("live legal documents disclose the Q8 implementation gate", async ({
  page,
}) => {
  for (const locale of LOCALES) {
    for (const { slug, requiredCopy } of documents) {
      const legal = new LegalPage(page, slug, locale);
      await legal.goto();

      await expect(legal.root).toContainText(requiredCopy(locale));

      // Negative scenario: neither active locale may represent the disabled
      // import path or its dormant adapters as an operating service.
      for (const activeClaim of legalCopy.activeMarketplaceImportClaims) {
        await expect(legal.root).not.toContainText(activeClaim);
      }
    }
  }
});
