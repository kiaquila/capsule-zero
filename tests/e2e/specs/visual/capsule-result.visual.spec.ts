import { expect, test } from "../../fixtures/visual";
import {
  CapsuleResultPage,
  type CapsuleResultTab,
} from "../../pages/CapsuleResultPage";

/**
 * Visual baseline — capsule result, all four tabs (spec 039 T004).
 * Same-machine no-diff reference; see landing.visual.spec.ts for the
 * workflow.
 */
test.describe("Visual baseline — capsule result", () => {
  const TABS: CapsuleResultTab[] = ["items", "outfits", "gaps", "shopping"];

  for (const tab of TABS) {
    test(`capsule-result ${tab} tab renders per baseline`, async ({
      page,
      signedIn,
      appLocale,
    }) => {
      void signedIn;
      const capsuleResult = new CapsuleResultPage(page, appLocale);
      await capsuleResult.goto();
      await expect(capsuleResult.tabs).toBeVisible();
      await capsuleResult.openTab(tab);
      await expect(capsuleResult.panel).toBeVisible();
      await expect(page).toHaveScreenshot(`capsule-result-${tab}.png`, {
        fullPage: true,
      });
    });
  }
});
