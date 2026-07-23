import { expect, test } from "../../fixtures/base";
import { authCopy } from "../../fixtures/locales";

test.describe("Landing — auth popup", () => {
  test.beforeEach(async ({ landing }) => {
    await landing.goto();
    await landing.dismissCookieBannerIfPresent();
  });

  test("opens on auth CTA click with sign-in mode active", async ({
    landing,
  }) => {
    // Negative pre-condition: popup must not be rendered before the click.
    await expect(landing.authPopover).toHaveCount(0);

    await landing.openAuth();

    await expect(landing.authPopover).toBeVisible();
    await expect(landing.auth.container).toBeVisible();
    await expect(landing.auth.signInForm).toBeVisible();
    // Sign-up form must not be in DOM in default sign-in mode.
    await expect(landing.auth.signUpForm).toHaveCount(0);
  });

  test("close button hides the popup", async ({ landing }) => {
    await landing.openAuth();
    await expect(landing.authPopover).toBeVisible();

    await landing.auth.close();

    await expect(landing.authPopover).toHaveCount(0);
  });

  test("sign-up form is not rendered until the user switches mode", async ({
    landing,
  }) => {
    await landing.openAuth();
    // Negative: sign-up form is not present in sign-in mode.
    await expect(landing.auth.signUpForm).toHaveCount(0);

    await landing.auth.clickModeSwitch();

    await expect(landing.auth.signUpForm).toBeVisible();
  });

  // Spec 047: the header titles the active mode; the Google button leads the
  // form so the primary path stays above the mobile fold.
  test("panel is titled per mode and the Google button sits above the email field", async ({
    landing,
    appLocale,
  }) => {
    await landing.openAuth();

    await expect(landing.auth.panelTitle).toHaveText(
      authCopy[appLocale].signInTitle,
    );

    await expect(landing.auth.googleButton).toBeVisible();
    const emailInput = landing.auth.container.locator('input[name="email"]');
    const googleBox = await landing.auth.googleButton.boundingBox();
    const emailBox = await emailInput.boundingBox();
    expect(googleBox).not.toBeNull();
    expect(emailBox).not.toBeNull();
    expect(googleBox!.y + googleBox!.height).toBeLessThanOrEqual(emailBox!.y);

    await landing.auth.clickModeSwitch();
    await expect(landing.auth.panelTitle).toHaveText(
      authCopy[appLocale].signUpTitle,
    );

    // Sign-up asks for credentials only (profile details move to the profile
    // screen): email, password, confirm — no name/country/city inputs.
    await expect(landing.auth.container.locator("form input")).toHaveCount(3);
  });
});
