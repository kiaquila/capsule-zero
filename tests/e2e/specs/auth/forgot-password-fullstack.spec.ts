import { expect, test } from "../../fixtures/base";
import { PASSWORDS, uniqueEmail } from "../../fixtures/accounts";
import {
  fetchOneTimeCode,
  fetchRecoveryLink,
  mailhogUrl,
} from "../../fixtures/mailhog";

/**
 * Auth — forgot password against the production-shape docker stack (Go API +
 * Kratos + Postgres + MailHog): real code emails, resend, credential
 * rotation, localized wrong-password error. Gated by E2E_MAILHOG_URL:
 *
 *   E2E_BASE_URL=https://capsulezero.local E2E_MAILHOG_URL=http://127.0.0.1:8025 \
 *     npx playwright test specs/auth/forgot-password-fullstack.spec.ts --project=chromium
 */
test.describe("Auth — forgot password (full stack)", () => {
  test.skip(!mailhogUrl, "requires the docker stack (set E2E_MAILHOG_URL)");

  test("resend invalidates the first code; the resent code rotates the password", async ({
    page,
    landing,
  }) => {
    test.setTimeout(120_000);
    const email = uniqueEmail("fs-forgot");

    // Create the account through the real registration flow.
    await landing.goto();
    await landing.dismissCookieBannerIfPresent();
    await landing.openAuth();
    await landing.auth.signUp(email, PASSWORDS.initial);
    await page.waitForURL(/\/(en|ru)\/dashboard/, { timeout: 30_000 });

    // Drop the session and start recovery.
    await page.context().clearCookies();
    await landing.goto();
    await landing.dismissCookieBannerIfPresent();
    await landing.openAuth();
    await landing.auth.requestRecovery(email);
    await expect(landing.auth.recoveryCodeInput).toBeVisible();
    const firstCode = await fetchOneTimeCode(email, /recover/i);
    const firstLink = new URL(await fetchRecoveryLink(email));
    expect(firstLink.pathname).toBe("/en/auth");
    expect(firstLink.searchParams.get("code")).toBe(firstCode);
    expect(firstLink.searchParams.get("flow")).toBeTruthy();

    // Resend: a fresh code arrives and the flow is replaced.
    await landing.auth.recoveryResend.click();
    let resentCode = firstCode;
    await expect(async () => {
      resentCode = await fetchOneTimeCode(email, /recover/i);
      expect(resentCode).not.toBe(firstCode);
    }).toPass({ timeout: 20_000 });

    // The first (superseded) code must no longer work.
    await landing.auth.completeRecovery(firstCode, PASSWORDS.changed);
    await expect(landing.auth.serverMessage).toBeVisible();
    await expect(page).not.toHaveURL(/\/dashboard/);

    // The resent code rotates the password and signs in.
    await landing.auth.completeRecovery(resentCode, PASSWORDS.changed);
    await page.waitForURL(/\/(en|ru)\/dashboard/, { timeout: 30_000 });

    // The old password is dead, the new one works.
    await page.context().clearCookies();
    await landing.goto();
    await landing.dismissCookieBannerIfPresent();
    await landing.openAuth();
    await landing.auth.signIn(email, PASSWORDS.initial);
    await expect(landing.auth.serverMessage).toBeVisible();
    await expect(page).not.toHaveURL(/\/dashboard/);

    await landing.auth.signIn(email, PASSWORDS.changed);
    await page.waitForURL(/\/(en|ru)\/dashboard/, { timeout: 30_000 });
  });
});
