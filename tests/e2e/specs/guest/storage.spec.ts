import { expect, test } from "../../fixtures/base";
import { GuestPage } from "../../pages/GuestPage";

test("invalid persisted guest state recovers without crashing", async ({
  page,
}) => {
  const guest = new GuestPage(page);
  await guest.seed({ step: "result", wardrobe: "bogus", picked: "bad" });
  await guest.goto();
  await expect(guest.typeStep).toBeVisible();
});

test("unknown and cross-wardrobe selections cannot create a result", async ({
  page,
}) => {
  const guest = new GuestPage(page);
  await guest.seed({
    step: "result",
    wardrobe: "male",
    picked: [
      "unknown",
      "w-dress-black",
      "m-sneakers-white",
      "m-sneakers-white",
    ],
  });
  await guest.goto();
  await expect(guest.itemsStep).toBeVisible();
  await expect(guest.count).toHaveText("0");
  await expect(guest.next).toHaveCount(0);
});

test("fresh query clears saved guest progress", async ({ page }) => {
  const guest = new GuestPage(page);
  await guest.seed({
    step: "items",
    wardrobe: "male",
    picked: ["m-tee-white"],
  });
  await page.goto("/en/start?fresh=1");
  await expect(guest.typeStep).toBeVisible();
  await guest.wardrobe("male").click();
  await expect(guest.item("m-tee-white")).toHaveAttribute(
    "aria-pressed",
    "false",
  );
});
