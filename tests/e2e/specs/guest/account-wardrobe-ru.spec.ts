import { test, expect } from "../../fixtures/base";
import { GuestPage } from "../../pages/GuestPage";
import { GuestWardrobePage } from "../../pages/GuestWardrobePage";
import { guestCatalogCopy } from "../../fixtures/locales";
import { DashboardPage } from "../../pages/DashboardPage";
import { presetId, saveWardrobe } from "../../fixtures/guest-wardrobe";

test("RU saved guest names and readonly details agree on dashboard and wardrobe", async ({
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
});

test("RU saved guest names remain consistent through favorites, sale and repair", async ({
  page,
}) => {
  await saveWardrobe(new GuestPage(page, "ru"));
  const wardrobe = new GuestWardrobePage(page, "ru");
  const expectedName = guestCatalogCopy.find((item) => item.id === presetId)!
    .name.ru;
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
