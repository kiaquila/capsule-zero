import { expect, test } from "../../fixtures/visual";

/**
 * Visual baseline — dashboard (spec 039 T004). Same-machine no-diff
 * reference; see landing.visual.spec.ts for the workflow.
 */
test.describe("Visual baseline — dashboard", () => {
  test("dashboard renders per baseline", async ({ page, signedIn }) => {
    await expect(signedIn.statsRow).toBeVisible();
    await expect(page).toHaveScreenshot("dashboard.png", { fullPage: true });
  });
});
