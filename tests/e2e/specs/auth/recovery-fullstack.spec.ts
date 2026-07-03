import { expect, test } from "../../fixtures/base";

/**
 * Spec 035 — full-stack recovery against the production-shape docker stack
 * (Go API + Kratos + Postgres + MailHog). Gated by E2E_MAILHOG_URL because it
 * needs the real courier sink; CI runs the provider-agnostic recovery.spec.ts
 * against the mock dev server instead. Run locally with:
 *
 *   E2E_BASE_URL=https://capsulezero.local E2E_MAILHOG_URL=http://127.0.0.1:8025 \
 *     npx playwright test specs/auth/recovery-fullstack.spec.ts --project=chromium
 */
const mailhogUrl = process.env.E2E_MAILHOG_URL;

interface MailhogMessage {
  Content: { Body: string };
}

async function fetchRecoveryCode(email: string): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const response = await fetch(
      `${mailhogUrl}/api/v2/search?kind=to&query=${encodeURIComponent(email)}`,
    );
    const payload = (await response.json()) as { items: MailhogMessage[] };
    for (const item of payload.items ?? []) {
      // Quoted-printable bodies keep the 6-digit code intact on its own line.
      const match = item.Content.Body.match(/\b(\d{6})\b/);
      if (match) {
        return match[1];
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(`no recovery code delivered to ${email}`);
}

test.describe("Auth slice — full-stack recovery via MailHog (spec 035)", () => {
  test.skip(!mailhogUrl, "requires the docker stack (set E2E_MAILHOG_URL)");

  test("resets the password with the emailed code and signs in", async ({
    page,
    landing,
  }) => {
    test.setTimeout(120_000);
    const email = `e2e+fs-${Date.now()}@example.com`;
    const initialPassword = "SuperSecret123";
    const newPassword = `NewSecret${Date.now() % 1000}x`;

    // Create the account through the real registration flow.
    await landing.goto();
    await landing.dismissCookieBannerIfPresent();
    await landing.openAuth();
    await landing.auth.clickModeSwitch();
    const form = landing.auth.container;
    await form.locator('input[name="email"]').fill(email);
    await form.locator('input[name="password"]').fill(initialPassword);
    await form.locator('input[name="confirmPassword"]').fill(initialPassword);
    await form.locator('button[type="submit"]').click();
    await page.waitForURL(/\/(en|ru)\/dashboard/, { timeout: 30_000 });

    // Drop the session and recover.
    await page.context().clearCookies();
    await landing.goto();
    await landing.dismissCookieBannerIfPresent();
    await landing.openAuth();
    await landing.auth.requestRecovery(email);
    await expect(landing.auth.recoveryCodeInput).toBeVisible();

    const code = await fetchRecoveryCode(email);
    await landing.auth.completeRecovery(code, newPassword);
    await page.waitForURL(/\/(en|ru)\/dashboard/, { timeout: 30_000 });

    // The new password signs in; recovery really replaced the credential.
    await page.context().clearCookies();
    await landing.goto();
    await landing.dismissCookieBannerIfPresent();
    await landing.openAuth();
    await form.locator('input[name="email"]').fill(email);
    await form.locator('input[name="password"]').fill(newPassword);
    await form.locator('button[type="submit"]').click();
    await page.waitForURL(/\/(en|ru)\/dashboard/, { timeout: 30_000 });
  });
});
