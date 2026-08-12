import { expect, test } from "../../fixtures/base";

test.describe("Landing — safety-policy navigation", () => {
  test("footer links to each safety policy without dead anchors", async ({
    landing,
    page,
  }) => {
    await landing.goto();
    await landing.dismissCookieBannerIfPresent();

    const links = [
      {
        locator: landing.footerCommunityLink,
        slug: "community-guidelines",
      },
      {
        locator: landing.footerCopyrightPolicyLink,
        slug: "copyright-policy",
      },
      {
        locator: landing.footerEnforcementLink,
        slug: "enforcement-policy",
      },
    ] as const;

    for (const link of links) {
      await link.locator.click();
      await expect(page).toHaveURL(new RegExp(`/en/${link.slug}$`));
      await expect(page).not.toHaveURL(/#/);
      await page.goBack();
    }
  });
});
