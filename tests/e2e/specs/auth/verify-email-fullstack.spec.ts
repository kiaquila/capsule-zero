import { expect, test } from "../../fixtures/base";
import { PASSWORDS, uniqueEmail } from "../../fixtures/accounts";
import {
  fetchOneTimeCode,
  fetchVerificationLink,
  mailhogUrl,
} from "../../fixtures/mailhog";
import { VerifyEmailBanner } from "../../pages/VerifyEmailBanner";

/**
 * Auth — email verification against the docker stack (real code emails).
 * Covers both ways to confirm: typing the code into the dashboard banner and
 * clicking the emailed link, which verifies WITHOUT any extra screen
 * (spec 035 review round 2). Gated like the other full-stack specs.
 */
test.describe("Auth — verify email (full stack)", () => {
  test.skip(!mailhogUrl, "requires the docker stack (set E2E_MAILHOG_URL)");

  test("banner rejects a wrong code and clears with the emailed one", async ({
    page,
    landing,
  }) => {
    test.setTimeout(120_000);
    const email = uniqueEmail("fs-banner");

    await landing.goto();
    await landing.dismissCookieBannerIfPresent();
    await landing.openAuth();
    await landing.auth.signUp(email, PASSWORDS.initial);
    await page.waitForURL(/\/(en|ru)\/dashboard/, { timeout: 30_000 });

    const banner = new VerifyEmailBanner(page);
    await expect(banner.container).toBeVisible();

    // Negative scenario 4: a wrong code keeps the address unverified.
    await banner.submitCode("000000");
    await expect(banner.errorMessage).toBeVisible();

    const code = await fetchOneTimeCode(email, /verif/i);
    await banner.submitCode(code);
    await expect(banner.container).toBeHidden();

    // The verified state survives a reload (cookie + live whoami agree).
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(banner.container).toBeHidden();
  });

  test("the emailed link verifies immediately — no extra screens", async ({
    page,
    landing,
  }) => {
    test.setTimeout(120_000);
    const email = uniqueEmail("fs-link");

    await landing.goto();
    await landing.dismissCookieBannerIfPresent();
    await landing.openAuth();
    await landing.auth.signUp(email, PASSWORDS.initial);
    await page.waitForURL(/\/(en|ru)\/dashboard/, { timeout: 30_000 });

    const banner = new VerifyEmailBanner(page);
    await expect(banner.container).toBeVisible();

    // Clicking the emailed link runs through Kratos's public GET (the single
    // exposed /self-service path) and lands on the dashboard already
    // verified — the user never sees a code-entry screen.
    const link = await fetchVerificationLink(email);
    await page.goto(link, { waitUntil: "domcontentloaded" });
    await page.waitForURL(/\/(en|ru)\/dashboard/, { timeout: 30_000 });
    await expect(banner.container).toBeHidden();
  });
});
