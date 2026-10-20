import { test, expect } from "../../fixtures/base";
import { GuestPage } from "../../pages/GuestPage";
import { GuestWardrobePage } from "../../pages/GuestWardrobePage";
import { guestCatalogCopy } from "../../fixtures/locales";
import { DashboardPage } from "../../pages/DashboardPage";

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

test("saved guest items never offer unsupported capsule membership", async ({
  page,
}) => {
  await saveWardrobe(new GuestPage(page));
  const wardrobe = new GuestWardrobePage(page);
  await page.goto("/en/uncapsulated", { waitUntil: "load" });
  await wardrobe.favorite(presetId).click();
  await expect(wardrobe.favorite(presetId)).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await wardrobe.open(presetId);
  await expect(wardrobe.detail).toBeVisible();
  await expect(wardrobe.addToCapsule).toBeHidden();
  await expect(wardrobe.moveToSale).toBeVisible();

  await page.goto("/en/favorites", { waitUntil: "load" });
  await wardrobe.catalogFavorites.click();
  await wardrobe.open(presetId);
  await expect(wardrobe.detail).toBeVisible();
  await expect(wardrobe.addToCapsule).toBeHidden();
  await wardrobe.moveToSale.click();
  await expect(wardrobe.feedback).toBeVisible();
  await page.goto("/en/for-sale", { waitUntil: "load" });
  await wardrobe.open(presetId);
  await expect(wardrobe.detail).toBeVisible();
  await expect(wardrobe.addToCapsule).toBeHidden();
  await expect(wardrobe.returnToMyItems).toBeVisible();
});

test("RU saved guest preset names and durable actions agree across wardrobe pages", async ({
  page,
}) => {
  await saveWardrobe(new GuestPage(page, "ru"));
  const wardrobe = new GuestWardrobePage(page, "ru");
  const expectedName = guestCatalogCopy.find((item) => item.id === presetId)!
    .name.ru;
  const dashboard = new DashboardPage(page, "ru");
  await dashboard.goto();
  await expect(dashboard.recentItemNames).toContainText([expectedName]);
  await dashboard.allRecentItems.click();
  await wardrobe.open(presetId);
  await expect(wardrobe.nameInput).toHaveValue(expectedName);
  for (const path of ["/ru/my-items", "/ru/uncapsulated"]) {
    await page.goto(path, { waitUntil: "load" });
    await expect(wardrobe.itemName(presetId)).toHaveText(expectedName);
    await wardrobe.open(presetId);
    await expect(wardrobe.detail).toBeVisible();
    await expect(wardrobe.nameInput).not.toBeEditable();
    await expect(wardrobe.nameInput).toHaveValue(expectedName);
    await expect(wardrobe.categoryInput).toBeDisabled();
    await expect(wardrobe.saveMetadata).toBeHidden();
    await expect(wardrobe.deleteItem).toBeHidden();
    await expect(wardrobe.changePhoto).toBeHidden();
    await expect(wardrobe.addColor).toBeHidden();
    await expect(wardrobe.moveToRepair).toBeVisible();
  }
  await page.goto("/ru/uncapsulated", { waitUntil: "load" });
  await wardrobe.favorite(presetId).click();
  await expect(wardrobe.favorite(presetId)).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.goto("/ru/favorites", { waitUntil: "load" });
  await wardrobe.catalogFavorites.click();
  await expect(wardrobe.itemName(presetId)).toHaveText(expectedName);
  await wardrobe.open(presetId);
  await expect(wardrobe.nameInput).toHaveValue(expectedName);
  await wardrobe.moveToSale.click();
  await expect(wardrobe.feedback).toBeVisible();
  await page.goto("/ru/for-sale", { waitUntil: "load" });
  await expect(wardrobe.itemName(presetId)).toHaveText(expectedName);
  await wardrobe.open(presetId);
  await expect(wardrobe.nameInput).toHaveValue(expectedName);
  await wardrobe.returnToMyItems.click();
  await expect(wardrobe.feedback).toBeVisible();
  await page.goto("/ru/uncapsulated", { waitUntil: "load" });
  await wardrobe.open(presetId);
  await wardrobe.moveToRepair.click();
  await expect(wardrobe.feedback).toBeVisible();
  await page.goto("/ru/for-repair", { waitUntil: "load" });
  await expect(wardrobe.itemName(presetId)).toHaveText(expectedName);
  await wardrobe.open(presetId);
  await expect(wardrobe.nameInput).not.toBeEditable();
  await expect(wardrobe.nameInput).toHaveValue(expectedName);
  await expect(wardrobe.saveMetadata).toBeHidden();
  await expect(wardrobe.deleteItem).toBeHidden();
  await expect(wardrobe.markFixed).toBeVisible();
});
