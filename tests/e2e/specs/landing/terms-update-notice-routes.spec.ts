import { expect, test } from "../../fixtures/base";
import { PASSWORDS, uniqueEmail } from "../../fixtures/accounts";
import { DashboardPage } from "../../pages/DashboardPage";

test.describe("Landing — Terms update notice authenticated routes", () => {
  test("uses server time and covers direct authenticated entry routes", async ({
    page,
    landing,
  }) => {
    const dashboard = new DashboardPage(page);

    await page.addInitScript(() => {
      const browserNow = Date.parse("2026-10-01T00:00:00.000Z");
      const BrowserDate = new Proxy(Date, {
        construct(target, args) {
          return Reflect.construct(
            target,
            args.length === 0 ? [browserNow] : args,
          );
        },
      });
      BrowserDate.now = () => browserNow;
      window.Date = BrowserDate;
    });

    await landing.goto();
    await landing.dismissCookieBannerIfPresent();
    await landing.openAuth();
    await landing.auth.signIn(uniqueEmail("terms-server-time"), PASSWORDS.initial);
    await page.waitForURL(/\/en\/dashboard/, { timeout: 25_000 });

    await expect(dashboard.termsUpdateNotice).toBeVisible();

    for (const path of ["/en/my-items", "/en/profile", "/en/capsule-result"]) {
      await page.goto(path);
      await expect(dashboard.termsUpdateNotice).toBeVisible();
    }

    for (const path of ["/en/guided-journey", "/en/capsule-result"]) {
      await page.goto(path);
      const { scrollHeight, viewportHeight } =
        await dashboard.documentRoot.evaluate((root) => ({
          scrollHeight: root.scrollHeight,
          viewportHeight: window.innerHeight,
        }));
      expect(scrollHeight).toBeLessThanOrEqual(viewportHeight + 1);
    }
  });
});
