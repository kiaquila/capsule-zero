import { test, expect } from "../../fixtures/base";
import { GuestPage } from "../../pages/GuestPage";
import { AuthStandalonePage } from "../../pages/AuthStandalonePage";
import { DashboardPage } from "../../pages/DashboardPage";

const picked = ["w-tee-white", "m-trousers-black", "m-sneakers-white"];
async function registerAndSave(guest: GuestPage, email: string) {
  await guest.goto();
  await guest.wardrobe("mixed").click();
  await guest.select(picked);
  await guest.next.click();
  await guest.save.click();
  await guest.auth.emailInput.fill(email);
  await guest.auth.passwordInput.fill("CapsuleStrong123!");
  await guest.auth.confirmPasswordInput.fill("CapsuleStrong123!");
  await guest.auth.submit.click();
  await expect(guest.savedConfirmation).toBeVisible({ timeout: 20_000 });
}

for (const locale of ["en", "ru"] as const) {
  test(`${locale}: registration saves the selected wardrobe and exact result in the account`, async ({
    page,
  }) => {
    const guest = new GuestPage(page, locale);
    await registerAndSave(
      guest,
      `guest-save-${locale}-${Date.now()}@example.test`,
    );
    await expect(page).toHaveURL(
      new RegExp(`/${locale}/account/guest/[a-f0-9-]+$`),
    );
    await expect(guest.resultCount).toHaveText("1");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(guest.resultCount).toHaveText("1");
    for (const id of picked) await expect(guest.resultImage(id)).toBeVisible();
  });
}

test("a new login session reopens the exact saved result from the dashboard", async ({
  page,
  context,
  landing,
}) => {
  const guest = new GuestPage(page);
  const email = `guest-return-${Date.now()}@example.test`;
  await registerAndSave(guest, email);
  const savedUrl = page.url();
  await page.evaluate(() => localStorage.clear());
  await context.clearCookies();
  const auth = new AuthStandalonePage(page);
  await auth.goto();
  await landing.dismissCookieBannerIfPresent();
  await auth.signIn(email, "CapsuleStrong123!");
  await expect(page).toHaveURL(/\/dashboard$/);
  const dashboard = new DashboardPage(page);
  await dashboard.savedGuestLinks.first().click();
  await expect(page).toHaveURL(savedUrl);
  await expect(guest.resultCount).toHaveText("1");
  for (const id of picked) await expect(guest.resultImage(id)).toBeVisible();
});

test("closing registration keeps the guest result without saving it", async ({
  page,
}) => {
  const guest = new GuestPage(page);
  await guest.goto();
  await guest.wardrobe("male").click();
  await guest.select(["m-tee-white", "m-trousers-black", "m-sneakers-white"]);
  await guest.next.click();
  await guest.save.click();
  await guest.auth.close();
  await expect(guest.resultCount).toHaveText("1");
  await expect(page).toHaveURL(/\/en\/start$/);
});
