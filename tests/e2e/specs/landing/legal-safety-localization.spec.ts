import { expect, test } from "../../fixtures/base";
import { legalNavigationCopy } from "../../fixtures/locales";
import { LegalPage } from "../../pages/LegalPage";

test.describe("Legal policies — localized navigation", () => {
  test("uses the active RU locale for every legal-navigation label", async ({
    page,
  }) => {
    const legal = new LegalPage(page, "community-guidelines", "ru");
    await legal.goto();

    for (const label of legalNavigationCopy.ru) {
      await expect(legal.navigation).toContainText(label);
    }

    for (const label of legalNavigationCopy.en) {
      await expect(legal.navigation).not.toContainText(label);
    }
  });
});
