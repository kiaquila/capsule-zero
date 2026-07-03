import { expect, test } from "../../fixtures/base";

/**
 * Spec 035 — password recovery on the existing /app UI (provider-agnostic).
 *
 * The flow is: "Forgot password?" → email → emailed one-time code + new
 * password → auto-login → dashboard. The mock provider accepts the
 * deterministic code `123456` (documented in spec 035) so the UI flow runs in
 * CI without a mail sink; the same spec passes against the full docker stack
 * where the code is read from MailHog instead (see recovery-fullstack.spec.ts).
 */
function uniqueEmail(): string {
  return `e2e+rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

test.describe("Auth slice — password recovery (spec 035)", () => {
  test.beforeEach(async ({ landing }) => {
    await landing.goto();
    await landing.dismissCookieBannerIfPresent();
    await landing.openAuth();
  });

  test("recovers with the emailed code and lands on the dashboard", async ({
    page,
    landing,
  }) => {
    await landing.auth.requestRecovery(uniqueEmail());

    await expect(landing.auth.recoveryCodeInput).toBeVisible();
    await landing.auth.completeRecovery("123456", "NewSecret456");

    await page.waitForURL(/\/(en|ru)\/dashboard/, { timeout: 25_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("a wrong code shows an error and never signs the user in", async ({
    page,
    landing,
  }) => {
    await landing.auth.requestRecovery(uniqueEmail());

    await expect(landing.auth.recoveryCodeInput).toBeVisible();
    await landing.auth.completeRecovery("000000", "NewSecret456");

    await expect(landing.auth.serverMessage).toBeVisible();
    await expect(page).not.toHaveURL(/\/dashboard/);
  });
});
