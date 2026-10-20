import { test, expect } from "../../fixtures/base";
import { GuestPage } from "../../pages/GuestPage";
import { AuthStandalonePage } from "../../pages/AuthStandalonePage";

const picked = ["w-tee-white", "m-trousers-black", "m-sneakers-white"];
async function prepare(guest: GuestPage) {
  await guest.goto();
  await guest.wardrobe("mixed").click();
  await guest.select(picked);
  await guest.next.click();
}

test("save transport failure keeps the immutable selection and can be retried", async ({
  page,
}) => {
  const guest = new GuestPage(page);
  await prepare(guest);
  let failed = false;
  await page.route(
    (url) => url.pathname === "/en/account/guest/continue",
    async (route) => {
      if (
        !failed &&
        route.request().method() === "POST" &&
        route.request().headers()["next-action"]
      ) {
        failed = true;
        await route.abort("failed");
        return;
      }
      await route.continue();
    },
  );
  await guest.save.click();
  await guest.auth.emailInput.fill(`guest-retry-${Date.now()}@example.test`);
  await guest.auth.passwordInput.fill("CapsuleStrong123!");
  await guest.auth.confirmPasswordInput.fill("CapsuleStrong123!");
  await guest.auth.submit.click();
  await expect(guest.saveRetry).toBeVisible();
  const intent = await guest.readLocalStorage("cz-guest-save-v1");
  expect(JSON.parse(intent!).picked).toEqual(picked);
  await guest.saveRetry.click();
  await expect(page).toHaveURL(/\/en\/account\/guest\/[a-f0-9-]+$/, {
    timeout: 20_000,
  });
  await expect(guest.resultCount).toHaveText("1");
});

test("blocked browser storage reports an error before opening registration", async ({
  page,
}) => {
  const guest = new GuestPage(page);
  await prepare(guest);
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new Error("Storage unavailable");
    };
  });
  await guest.save.click();
  await expect(guest.saveError).toBeVisible();
  await expect(guest.auth.container).toBeHidden();
  await expect(guest.resultCount).toHaveText("1");
});

test("an authenticated visitor saves directly without another registration", async ({
  page,
  landing,
}) => {
  const auth = new AuthStandalonePage(page);
  await auth.goto();
  await landing.dismissCookieBannerIfPresent();
  await auth.signIn(
    `guest-direct-${Date.now()}@example.test`,
    "CapsuleStrong123!",
  );
  await expect(page).toHaveURL(/\/dashboard$/);
  const guest = new GuestPage(page);
  await prepare(guest);
  await guest.save.click();
  await expect(page).toHaveURL(/\/en\/account\/guest\/[a-f0-9-]+$/, {
    timeout: 20_000,
  });
  await expect(guest.resultCount).toHaveText("1");
});

test("a pending retry bound to another account never transfers the selection", async ({
  page,
  landing,
}) => {
  const auth = new AuthStandalonePage(page);
  await auth.goto();
  await landing.dismissCookieBannerIfPresent();
  await auth.signIn(
    `guest-isolation-${Date.now()}@example.test`,
    "CapsuleStrong123!",
  );
  await expect(page).toHaveURL(/\/dashboard$/);
  const transferId = await page.evaluate((picked) => {
    const transferId = crypto.randomUUID();
    localStorage.setItem(
      "cz-guest-save-v1",
      JSON.stringify({
        transferId,
        wardrobe: "mixed",
        picked,
        ownerUserId: "11111111-1111-4111-8111-111111111111",
      }),
    );
    return transferId;
  }, picked);
  await page.goto(`/en/account/guest/continue?transferId=${transferId}`);
  const guest = new GuestPage(page);
  await expect(guest.continuation).toBeVisible();
  await expect(guest.ownerMismatch).toBeVisible();
  await expect(guest.saveRetry).toBeHidden();
  expect(await guest.readLocalStorage("cz-guest-save-v1")).not.toBeNull();
});

test("a different tab replacing the draft cannot change the Google save request", async ({
  page,
}) => {
  const guest = new GuestPage(page);
  await prepare(guest);
  await guest.save.click();
  const replacedId = await page.evaluate(() => {
    const transferId = crypto.randomUUID();
    localStorage.setItem(
      "cz-guest-save-v1",
      JSON.stringify({
        transferId,
        wardrobe: "mixed",
        picked: ["w-dress-black", "m-sneakers-white"],
      }),
    );
    return transferId;
  });
  await guest.auth.googleButton.click();
  await expect(guest.saveRetry).toBeVisible({ timeout: 20_000 });
  await expect(guest.savedConfirmation).toBeHidden();
  expect(
    JSON.parse((await guest.readLocalStorage("cz-guest-save-v1"))!).transferId,
  ).toBe(replacedId);
});
