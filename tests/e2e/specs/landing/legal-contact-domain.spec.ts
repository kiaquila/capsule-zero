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

test.describe("Legal policies — solo-founder contact", () => {
  test("publishes one monitored contact for every legal question", async ({ page }) => {
    for (const slug of legalDocuments) {
      const legal = new LegalPage(page, slug);
      await legal.goto();

      await expect(legal.root).toContainText(legalCopy.contactEmail);
      for (const retiredEmail of legalCopy.retiredContactEmails) {
        await expect(legal.root).not.toContainText(retiredEmail);
      }
      await expect(legal.root).not.toContainText("Data Protection Officer");
    }
  });
});
