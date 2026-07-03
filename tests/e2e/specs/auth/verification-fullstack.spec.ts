import { expect, test } from "../../fixtures/base";
import { VerifyEmailBanner } from "../../pages/VerifyEmailBanner";

/**
 * Spec 035 — full-stack email verification against the docker stack (Go API +
 * Kratos + MailHog). Sign-up sends a real code email; the dashboard banner
 * rejects a wrong code and clears on the real one. Gated like
 * recovery-fullstack.spec.ts:
 *
 *   E2E_BASE_URL=https://capsulezero.local E2E_MAILHOG_URL=http://127.0.0.1:8025 \
 *     npx playwright test specs/auth/verification-fullstack.spec.ts --project=chromium
 */
const mailhogUrl = process.env.E2E_MAILHOG_URL;

interface MailhogMessage {
  Content: { Body: string; Headers: Record<string, string[]> };
}

async function fetchVerificationCode(email: string): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const response = await fetch(
      `${mailhogUrl}/api/v2/search?kind=to&query=${encodeURIComponent(email)}`,
    );
    const payload = (await response.json()) as { items: MailhogMessage[] };
    for (const item of payload.items ?? []) {
      const subject = (item.Content.Headers.Subject ?? []).join(" ");
      if (!/verif/i.test(subject)) {
        continue;
      }
      const match = item.Content.Body.match(/\b(\d{6})\b/);
      if (match) {
        return match[1];
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(`no verification code delivered to ${email}`);
}

test.describe("Auth slice — full-stack email verification (spec 035)", () => {
  test.skip(!mailhogUrl, "requires the docker stack (set E2E_MAILHOG_URL)");

  test("banner rejects a wrong code and clears with the emailed one", async ({
    page,
    landing,
  }) => {
    test.setTimeout(120_000);
    const email = `e2e+vfs-${Date.now()}@example.com`;
    const password = "SuperSecret123";

    await landing.goto();
    await landing.dismissCookieBannerIfPresent();
    await landing.openAuth();
    await landing.auth.clickModeSwitch();
    const form = landing.auth.container;
    await form.locator('input[name="email"]').fill(email);
    await form.locator('input[name="password"]').fill(password);
    await form.locator('input[name="confirmPassword"]').fill(password);
    await form.locator('button[type="submit"]').click();
    await page.waitForURL(/\/(en|ru)\/dashboard/, { timeout: 30_000 });

    const banner = new VerifyEmailBanner(page);
    await expect(banner.container).toBeVisible();

    // Negative scenario 4: a wrong code keeps the address unverified.
    await banner.submitCode("000000");
    await expect(banner.errorMessage).toBeVisible();

    const code = await fetchVerificationCode(email);
    await banner.submitCode(code);
    await expect(banner.container).toBeHidden();

    // The verified state survives a reload (cookie + live whoami agree).
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(banner.container).toBeHidden();
  });
});
