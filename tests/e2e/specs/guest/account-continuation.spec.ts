import { test, expect } from "../../fixtures/base";
import { GuestPage } from "../../pages/GuestPage";
import { AuthStandalonePage } from "../../pages/AuthStandalonePage";

const picked = ["w-tee-white", "m-trousers-black", "m-sneakers-white"];

test("existing-account login continues the explicitly requested guest save", async ({
  page,
}) => {
  const guest = new GuestPage(page);
  await guest.goto();
  await guest.wardrobe("mixed").click();
  await guest.select(picked);
  await guest.next.click();
  await guest.save.click();
  await guest.auth.clickModeSwitch();
  await guest.auth.signIn(
    `guest-existing-${Date.now()}@example.test`,
    "CapsuleStrong123!",
  );
  await expect(page).toHaveURL(/\/en\/account\/guest\/[a-f0-9-]+$/, {
    timeout: 20_000,
  });
  await expect(guest.resultCount).toHaveText("1");
});

test("Google login carries explicit guest save across its external redirect", async ({
  page,
}) => {
  const guest = new GuestPage(page);
  await guest.goto();
  await guest.wardrobe("mixed").click();
  await guest.select(picked);
  await guest.next.click();
  await guest.save.click();
  await guest.auth.googleButton.click();
  await expect(page).toHaveURL(/\/en\/account\/guest\/[a-f0-9-]+$/, {
    timeout: 20_000,
  });
  await expect(guest.resultCount).toHaveText("1");
});

test("normal login after closing guest registration does not transfer an abandoned draft", async ({
  page,
  landing,
}) => {
  const guest = new GuestPage(page);
  await guest.goto();
  await guest.wardrobe("mixed").click();
  await guest.select(picked);
  await guest.next.click();
  await guest.save.click();
  await guest.auth.close();
  const auth = new AuthStandalonePage(page);
  await auth.goto();
  await landing.dismissCookieBannerIfPresent();
  await auth.signIn(
    `guest-abandoned-${Date.now()}@example.test`,
    "CapsuleStrong123!",
  );
  await expect(page).toHaveURL(/\/en\/dashboard$/);
});
