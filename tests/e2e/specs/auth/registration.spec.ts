import { expect, test } from "../../fixtures/base";

/**
 * Auth slice (spec 024 Phase 2) — registration + login work end-to-end on the
 * existing /app UI against the real backend (Go API + Kratos + Postgres) via
 * the `api` provider. Requires the production-shape stack running behind the
 * base URL (E2E_BASE_URL), with CAPSULE_PROVIDER_MODE=api.
 *
 * A successful sign-up issues a Kratos session (registration `session` hook)
 * and the app redirects to the dashboard — landing on /dashboard (rather than
 * being bounced back to auth) proves the session round-trip works.
 */
function uniqueEmail(): string {
  return `e2e+${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

test.describe("Auth slice — registration & login (api provider)", () => {
  test.beforeEach(async ({ landing }) => {
    await landing.goto();
    await landing.dismissCookieBannerIfPresent();
  });

  test("sign-up creates a session and lands on the dashboard", async ({
    page,
    landing,
  }) => {
    const email = uniqueEmail();
    const password = "SuperSecret123";

    await landing.openAuth();
    await landing.auth.clickModeSwitch();
    await expect(landing.auth.signUpForm).toBeVisible();

    const form = landing.auth.container;
    await form.locator('input[name="email"]').fill(email);
    await form.locator('input[name="password"]').fill(password);
    await form.locator('input[name="confirmPassword"]').fill(password);
    await form.locator('input[name="name"]').fill("E2E");
    await form.locator('button[type="submit"]').click();

    await page.waitForURL(/\/(en|ru)\/dashboard/, { timeout: 25_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("sign-in with the same credentials reaches the dashboard", async ({
    page,
    landing,
  }) => {
    const email = uniqueEmail();
    const password = "SuperSecret123";

    // Register first (fresh identity), then sign out via a clean context by
    // re-opening the auth popup in sign-in mode.
    await landing.openAuth();
    await landing.auth.clickModeSwitch();
    const signUp = landing.auth.container;
    await signUp.locator('input[name="email"]').fill(email);
    await signUp.locator('input[name="password"]').fill(password);
    await signUp.locator('input[name="confirmPassword"]').fill(password);
    await signUp.locator('button[type="submit"]').click();
    await page.waitForURL(/\/(en|ru)\/dashboard/, { timeout: 25_000 });

    // Clear the app session cookie to force a fresh sign-in.
    await page.context().clearCookies();
    await landing.goto();
    await landing.dismissCookieBannerIfPresent();
    await landing.openAuth();

    const signIn = landing.auth.container;
    await signIn.locator('input[name="email"]').fill(email);
    await signIn.locator('input[name="password"]').fill(password);
    await signIn.locator('button[type="submit"]').click();

    await page.waitForURL(/\/(en|ru)\/dashboard/, { timeout: 25_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
