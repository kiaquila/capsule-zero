import { test, expect } from "../../fixtures/base";
import { GuestPage } from "../../pages/GuestPage";

for (const locale of ["en", "ru"] as const) {
  test(`${locale}: registration saves the selected wardrobe and exact result in the account`, async ({
    page,
  }) => {
    const guest = new GuestPage(page, locale);
    await guest.goto();
    await guest.wardrobe("mixed").click();
    await guest.select(["w-tee-white", "m-trousers-black", "m-sneakers-white"]);
    await guest.next.click();
    await guest.save.click();
    await guest.auth.emailInput.fill(
      `guest-save-${locale}-${Date.now()}@example.test`,
    );
    await guest.auth.passwordInput.fill("CapsuleStrong123!");
    await guest.auth.confirmPasswordInput.fill("CapsuleStrong123!");
    await guest.auth.submit.click();
    await expect(page).toHaveURL(
      new RegExp(`/${locale}/account/guest/[a-f0-9-]+$`),
    );
    await expect(guest.resultCount).toHaveText("1");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(guest.resultCount).toHaveText("1");
  });
}

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
