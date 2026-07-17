import { expect, test } from "../../fixtures/base";

/**
 * Spec 044 — Landing Hero Live. Contract: html-prototypes/landing-v2/v1c-final.html
 * + design-system.md §9.11(d). The hero CTA opens the existing auth popup in
 * sign-up mode (interim route until the guest tool ships); the ghost login
 * keeps the sign-in popup covered by auth-popup.spec.ts.
 */
test.describe("Landing — hero", () => {
  test.beforeEach(async ({ landing }) => {
    await landing.goto();
    await landing.dismissCookieBannerIfPresent();
  });

  test("renders the approved hero structure with the gold CTA", async ({
    landing,
  }) => {
    await expect(landing.heroTitle).toBeVisible();
    await expect(landing.heroSubtitle).toBeVisible();
    await expect(landing.heroCta).toBeVisible();

    const background = await landing.heroCtaBackgroundImage();
    expect(background).toContain("linear-gradient");
    expect(background).toContain("rgb(239, 191, 4)");
  });

  test("hero CTA opens the auth popup in sign-up mode", async ({ landing }) => {
    // Negative pre-condition: popup must not be rendered before the click.
    await expect(landing.authPopover).toHaveCount(0);

    await landing.openHeroCta();

    await expect(landing.authPopover).toBeVisible();
    await expect(landing.auth.signUpForm).toBeVisible();
    // Negative: the sign-in form must not be in DOM when opened from the hero CTA.
    await expect(landing.auth.signInForm).toHaveCount(0);
  });

  test("slides stub stays strictly below the first viewport", async ({
    landing,
  }) => {
    await expect(landing.slidesStub).toHaveCount(1);
    // Negative: the stub must not intersect the first viewport (§9.11(d):
    // the first screen is exactly one viewport).
    expect(await landing.isSlidesStubBelowFirstViewport()).toBe(true);
  });
});
