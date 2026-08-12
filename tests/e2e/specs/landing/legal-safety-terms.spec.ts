import { expect, test } from "../../fixtures/base";
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
  });
});
