import { test, expect } from "../../fixtures/base";
import { GuestPage } from "../../pages/GuestPage";
import { GuestWardrobePage } from "../../pages/GuestWardrobePage";

const presetId = "w-tee-white";
async function saveWardrobe(guest: GuestPage) {
  await guest.goto();
  await guest.wardrobe("mixed").click();
  await guest.select([presetId, "m-trousers-black", "m-sneakers-white"]);
  await guest.next.click();
  await guest.save.click();
  await guest.auth.emailInput.fill(
    `guest-wardrobe-${crypto.randomUUID()}@example.test`,
  );
  await guest.auth.passwordInput.fill("CapsuleStrong123!");
  await guest.auth.confirmPasswordInput.fill("CapsuleStrong123!");
  await guest.auth.submit.click();
  await expect(guest.savedConfirmation).toBeVisible({ timeout: 20_000 });
}

test("a saved guest item favorite survives reload and appears in Favorites", async ({
  page,
}) => {
  await saveWardrobe(new GuestPage(page));
  const wardrobe = new GuestWardrobePage(page);
  await wardrobe.goto();
  await wardrobe.favorite(presetId).click();
  await expect(wardrobe.favorite(presetId)).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await wardrobe.reload();
  await expect(wardrobe.favorite(presetId)).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.goto("/en/favorites", { waitUntil: "load" });
  await wardrobe.catalogFavorites.click();
  await expect(wardrobe.item(presetId)).toBeVisible();
  await wardrobe.favorite(presetId).click();
  await expect(wardrobe.item(presetId)).toBeHidden();
  await wardrobe.reload();
  await wardrobe.catalogFavorites.click();
  await expect(wardrobe.item(presetId)).toBeHidden();
});

test("saved guest item sale and return statuses survive reload", async ({
  page,
}) => {
  await saveWardrobe(new GuestPage(page));
  const wardrobe = new GuestWardrobePage(page);
  await wardrobe.goto();
  await wardrobe.open(presetId);
  await wardrobe.moveToSale.click();
  await expect(wardrobe.feedback).toBeVisible();
  await page.goto("/en/for-sale");
  await expect(wardrobe.item(presetId)).toBeVisible();
  await wardrobe.reload();
  await expect(wardrobe.item(presetId)).toBeVisible();
  await wardrobe.open(presetId);
  await wardrobe.returnToMyItems.click();
  await expect(wardrobe.feedback).toBeVisible();
  await wardrobe.reload();
  await expect(wardrobe.item(presetId)).toBeHidden();
  await page.goto("/en/uncapsulated", { waitUntil: "load" });
  await expect(wardrobe.item(presetId)).toBeVisible();
  await wardrobe.reload();
  await expect(wardrobe.item(presetId)).toBeVisible();
});

test("failed saved item mutation preserves the previous favorite state", async ({
  page,
}) => {
  await saveWardrobe(new GuestPage(page));
  const wardrobe = new GuestWardrobePage(page);
  await wardrobe.goto();
  await page.route(
    (url) => url.pathname === "/en/my-items",
    async (route) => {
      if (route.request().method() === "POST") await route.abort("failed");
      else await route.continue();
    },
  );
  await wardrobe.favorite(presetId).click();
  await expect(wardrobe.feedback).toBeVisible();
  await expect(wardrobe.favorite(presetId)).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await wardrobe.reload();
  await expect(wardrobe.favorite(presetId)).toHaveAttribute(
    "aria-pressed",
    "false",
  );
});
