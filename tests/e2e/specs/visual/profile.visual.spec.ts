import { expect, test } from "../../fixtures/visual";
import { ProfilePage } from "../../pages/ProfilePage";

/**
 * Visual baseline — profile (spec 039 T004). Same-machine no-diff
 * reference; see landing.visual.spec.ts for the workflow.
 */
test.describe("Visual baseline — profile", () => {
  test("profile renders per baseline", async ({ page, signedIn, appLocale }) => {
    void signedIn;
    const profile = new ProfilePage(page, appLocale);
    await profile.goto();
    await expect(profile.changePasswordButton).toBeVisible();
    await expect(page).toHaveScreenshot("profile.png", { fullPage: true });
  });
});
