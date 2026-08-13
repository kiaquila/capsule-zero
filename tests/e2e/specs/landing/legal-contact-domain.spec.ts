import { expect, test } from "../../fixtures/base";
import { legalCopy } from "../../fixtures/locales";
import { LegalPage, type LegalSlug } from "../../pages/LegalPage";

const legalDocuments: readonly LegalSlug[] = [
  "terms-of-use",
  "privacy-policy",
  "community-guidelines",
  "copyright-policy",
  "enforcement-policy",
];

test.describe("Legal policies — public contact domain", () => {
  test("publishes only the production-domain mailboxes", async ({ page }) => {
    for (const slug of legalDocuments) {
      const legal = new LegalPage(page, slug);
      await legal.goto();

      await expect(legal.root).toContainText(legalCopy.contactDomain);
      await expect(legal.root).not.toContainText(legalCopy.retiredContactDomain);
    }
  });
});
