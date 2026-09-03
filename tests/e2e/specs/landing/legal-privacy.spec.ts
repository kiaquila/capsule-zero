import { expect, test } from "../../fixtures/base";
import { legalCopy } from "../../fixtures/locales";
import { LegalPage } from "../../pages/LegalPage";
import { privacyRevisionDates } from "@/lib/legal/policy-shared";

test.describe("Landing — current Privacy policy", () => {
  test("keeps RU Privacy dates coupled to the Privacy revision", () => {
    expect(privacyRevisionDates("ru")).toEqual({
      effectiveDate: "3 сентября 2026 г.",
      lastUpdated: "3 сентября 2026 г.",
    });
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
