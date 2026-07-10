import { test as base, expect } from "./base";
import { MOCK_SEEDED_EMAIL, PASSWORDS } from "./accounts";
import { DashboardPage } from "../pages/DashboardPage";

interface VisualFixtures {
  /**
   * A signed-in session on the mock provider's SEEDED account (owns the
   * fixture capsule + wardrobe → populated screens), parked on the dashboard.
   * Shared precondition of every signed-in visual-baseline spec (spec 039
   * T004) — the same landing→auth→dashboard dance the auth specs perform
   * inline.
   */
  signedIn: DashboardPage;
}

export const test = base.extend<VisualFixtures>({
  signedIn: async ({ page, landing, appLocale }, use) => {
    await landing.goto();
    await landing.dismissCookieBannerIfPresent();
    await landing.openAuth();
    await landing.auth.signIn(MOCK_SEEDED_EMAIL, PASSWORDS.initial);
    await page.waitForURL(/\/(en|ru)\/dashboard/, { timeout: 25_000 });
    await use(new DashboardPage(page, appLocale));
  },
});

export { expect };
