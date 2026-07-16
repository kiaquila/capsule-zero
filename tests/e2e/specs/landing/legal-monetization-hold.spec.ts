import { expect, test } from "../../fixtures/base";
import { legalCopy } from "../../fixtures/locales";
import { LegalPage, type LegalSlug } from "../../pages/LegalPage";

const documents: ReadonlyArray<{
  slug: LegalSlug;
  holdCopy: string;
}> = [
  {
    slug: "terms-of-use",
    holdCopy: legalCopy.termsMonetizationHold,
  },
  {
    slug: "privacy-policy",
    holdCopy: legalCopy.privacyMonetizationHold,
  },
];

test("live legal documents disclose the monetization hold without retired claims", async ({
  page,
}) => {
  for (const { slug, holdCopy } of documents) {
    const legal = new LegalPage(page, slug);
    await legal.goto();

    await expect(legal.root).toContainText(holdCopy);

    // Negative scenario: public legal copy must not bind users to the retired
    // coin/Lava model while monetization is on hold.
    for (const retiredClaim of legalCopy.retiredMonetizationClaims) {
      await expect(legal.root).not.toContainText(retiredClaim);
    }
  }
});
