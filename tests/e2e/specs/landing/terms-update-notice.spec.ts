import { expect, test } from "../../fixtures/base";
import { PASSWORDS, uniqueEmail } from "../../fixtures/accounts";
import { termsUpdateCopy } from "../../fixtures/locales";
import { DashboardPage } from "../../pages/DashboardPage";

test.describe("Landing — Terms update notice", () => {
  test("an existing signed-in user receives advance rollout notice", async ({
    page,
    landing,
  }) => {
    const dashboard = new DashboardPage(page);
    await landing.goto();
    await landing.dismissCookieBannerIfPresent();
    await landing.openAuth();
    await landing.auth.signIn(uniqueEmail("terms-notice"), PASSWORDS.initial);
    await page.waitForURL(/\/en\/dashboard/, { timeout: 25_000 });

    await expect(dashboard.termsUpdateNotice).toContainText(
      termsUpdateCopy.en.title,
    );
    await expect(dashboard.termsUpdateNotice).toContainText(
      termsUpdateCopy.en.description,
    );
    await expect(dashboard.topbarActions).toBeVisible();

    const noticeBounds = await dashboard.termsUpdateNotice.boundingBox();
    const actionBounds = await dashboard.topbarActions.boundingBox();
    expect(noticeBounds).not.toBeNull();
    expect(actionBounds).not.toBeNull();
    expect(noticeBounds!.y + noticeBounds!.height).toBeLessThanOrEqual(
      actionBounds!.y,
    );

    await expect(dashboard.termsUpdateLink).toHaveText(
      termsUpdateCopy.en.action,
    );
    await expect(dashboard.termsUpdateLink).toHaveAttribute(
      "href",
      "/en/terms-of-use/2026-09-15",
    );
  });

  test("expires the notice while the protected layout stays mounted", async ({
    page,
    landing,
  }) => {
    const dashboard = new DashboardPage(page);
    await page.clock.install({
      time: new Date("2026-08-13T20:00:00.000Z"),
    });

    await landing.goto();
    await landing.dismissCookieBannerIfPresent();
    await landing.openAuth();
    await landing.auth.signIn(uniqueEmail("terms-live-cutoff"), PASSWORDS.initial);
    await page.waitForURL(/\/en\/dashboard/, { timeout: 25_000 });
    await expect(dashboard.termsUpdateNotice).toBeVisible();

    for (let step = 0; step < 3; step += 1) {
      await page.clock.fastForward(20 * 24 * 60 * 60 * 1_000);
    }

    await expect(dashboard.termsUpdateNotice).toBeHidden();
    await expect(page).toHaveURL(/\/en\/dashboard/);
  });

  test("rechecks authoritative server time when a suspended tab resumes", async ({
    page,
    landing,
  }) => {
    const dashboard = new DashboardPage(page);
    await landing.goto();
    await landing.dismissCookieBannerIfPresent();
    await landing.openAuth();
    await landing.auth.signIn(uniqueEmail("terms-resume-cutoff"), PASSWORDS.initial);
    await page.waitForURL(/\/en\/dashboard/, { timeout: 25_000 });
    await expect(dashboard.termsUpdateNotice).toBeVisible();

    await page.route("**/en/dashboard", async (route) => {
      if (route.request().method() === "HEAD") {
        await route.fulfill({
          status: 204,
          headers: {
            date: "Tue, 15 Sep 2026 00:00:01 GMT",
          },
        });
        return;
      }
      await route.fallback();
    });

    await page.evaluate(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    await expect(dashboard.termsUpdateNotice).toBeHidden();
    await expect(page).toHaveURL(/\/en\/dashboard/);
  });

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
