import { expect, test } from "../../fixtures/visual";

/**
 * Visual baseline — landing (spec 039 T004).
 *
 * The no-diff reference for the behavior-preserving slices (US1 Lane A /
 * US4). Snapshots are platform-specific: generate and compare on the SAME
 * machine (`E2E_VISUAL=1 ... --update-snapshots`, then plain run). Not a CI
 * gate — CI drift protection is the stylelint guardrail.
 */
test.describe("Visual baseline — landing", () => {
  test("landing renders per baseline", async ({ page, landing }) => {
    await landing.goto();
    await landing.dismissCookieBannerIfPresent();
    await expect(landing.authTrigger).toBeVisible();
    await expect(page).toHaveScreenshot("landing.png", { fullPage: true });
  });
});
