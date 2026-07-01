import { expect, test } from "../../fixtures/base";

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
});
