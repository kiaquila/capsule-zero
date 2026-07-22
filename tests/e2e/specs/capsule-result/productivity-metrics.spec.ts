import { expect, test } from "../../fixtures/visual";
import { CapsuleResultPage } from "../../pages/CapsuleResultPage";

test.describe("Live productivity metrics", () => {
  test("keeps structural layers outside OPR and reports zero-base coverage", async ({
    page,
    signedIn,
    appLocale,
  }) => {
    await expect(signedIn.oprValue).toHaveText("9.0");
    await expect(signedIn.layeringCoverage).toHaveText("N/A");
    await expect(signedIn.layeringDiagnostics).toContainText("0 base looks");

    const capsuleResult = new CapsuleResultPage(page, appLocale);
    await capsuleResult.goto();
    await expect(capsuleResult.oprValue).toHaveText("9.0");
    await expect(capsuleResult.layeringCoverage).toHaveText("N/A");

    await capsuleResult.addItem("Camel wool blazer");

    // A structural layer changes neither the counted outfits nor the
    // Core+Accessory denominator: the OPR must remain 18 / 2.
    await expect(capsuleResult.oprValue).toHaveText("9.0");
    await expect(capsuleResult.layeringCoverage).toHaveText("N/A");
    await expect(capsuleResult.layeringDiagnostics).toContainText(
      "0 base looks",
    );
  });
});
