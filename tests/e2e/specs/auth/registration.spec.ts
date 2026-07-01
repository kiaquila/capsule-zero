import { expect, test } from "../../fixtures/base";

/**
 * Auth slice (spec 024 Phase 2) — registration works end-to-end on the existing
 * /app UI. The flow is provider-agnostic, so this passes against both the mock
 * dev server (CI) and the production-shape stack (Go API + Kratos + Postgres via
 * the `api` provider), which is how the slice was verified locally.
 *
 * A successful sign-up issues a session (in `api` mode via the Kratos
 * registration `session` hook) and the app redirects to the dashboard — landing
 * on /dashboard rather than being bounced back to auth proves the session
 * round-trip works. Sign-in is covered at the Go-API level (login smoke) and was
 * exercised against the live api-mode stack during development.
 */
function uniqueEmail(): string {
  return `e2e+${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

test.describe("Auth slice — registration (existing /app UI)", () => {
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
});
