import { expect, test } from "../../fixtures/base";
import { legalNavigationItems } from "@/lib/legal/navigation";

test.describe("Landing — safety-policy navigation", () => {
  test("shares one navigation definition across public legal surfaces", () => {
    expect(legalNavigationItems).toEqual([
      { href: "/terms-of-use", labelKey: "terms", slug: "terms-of-use" },
      {
        href: "/privacy-policy",
        labelKey: "privacy",
        slug: "privacy-policy",
      },
      {
        href: "/community-guidelines",
        labelKey: "community",
        slug: "community-guidelines",
      },
      {
        href: "/copyright-policy",
        labelKey: "copyrightPolicy",
        slug: "copyright-policy",
      },
      {
        href: "/enforcement-policy",
        labelKey: "enforcement",
        slug: "enforcement-policy",
      },
    ]);
  });

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
