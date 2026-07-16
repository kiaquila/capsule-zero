import { expect, test } from "../../fixtures/base";
import { legalCopy } from "../../fixtures/locales";
import { LegalPage, type LegalSlug } from "../../pages/LegalPage";

const documents: ReadonlyArray<{
  slug: LegalSlug;
  requiredCopy: readonly string[];
}> = [
  {
    slug: "terms-of-use",
    requiredCopy: [legalCopy.termsMonetizationHold],
  },
  {
    slug: "privacy-policy",
    requiredCopy: [
      legalCopy.privacyMonetizationHold,
      legalCopy.privacyDormantLegacyBalance,
    ],
  },
];

test("live legal documents disclose the monetization hold without retired claims", async ({
  page,
}) => {
  for (const { slug, requiredCopy } of documents) {
    const legal = new LegalPage(page, slug);
    await legal.goto();

    for (const copy of requiredCopy) {
      await expect(legal.root).toContainText(copy);
    }

    // Negative scenario: public legal copy must not bind users to the retired
    // coin/Lava model while monetization is on hold.
    for (const retiredClaim of legalCopy.retiredMonetizationClaims) {
      await expect(legal.root).not.toContainText(retiredClaim);
    }
  }
});
