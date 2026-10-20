import { expect, test } from "../../fixtures/base";
import { GuestPage } from "../../pages/GuestPage";

for (const locale of ["en", "ru"] as const) {
  test(`${locale}: mixed wardrobe combines both catalogs and keeps progress`, async ({
    page,
  }) => {
    const guest = new GuestPage(page, locale);
    await guest.goto();
    await guest.wardrobe("mixed").click();
    await expect(guest.items).toHaveCount(32);
    await expect(guest.next).toHaveCount(0);
    await expect(guest.item("w-skirt-beige")).toBeVisible();
    await expect(guest.item("m-chinos-sand")).toBeVisible();
    expect(await guest.brokenImages()).toBe(0);
    await guest.select(["w-tee-white", "m-trousers-black", "m-sneakers-white"]);
    await expect(guest.count).toHaveText("1");
    await guest.next.click();
    await expect(guest.resultCount).toHaveText("1");
    await expect(guest.recommendations).toHaveCount(3);
    await guest.reload();
    await expect(guest.resultStep).toBeVisible();
    await expect(guest.resultCount).toHaveText("1");
    await guest.save.click();
    await expect(guest.auth.signUpForm).toBeVisible();
    await expect(guest.auth.signInForm).toHaveCount(0);
    await guest.auth.closeButton.click();
    await guest.restart.click();
    await expect(guest.typeStep).toBeVisible();
    await guest.wardrobe("male").click();
    await expect(guest.count).toHaveText("0");
    await expect(guest.item("w-dress-black")).toHaveCount(0);
  });
}

test("reference women and men pools retain counts and the photo-interest sheet", async ({
  page,
}) => {
  const guest = new GuestPage(page);
  await guest.goto();
  await guest.wardrobe("female").click();
  await expect(guest.items).toHaveCount(19);
  await guest.select(["w-dress-black", "w-loafers-black", "w-bag-black"]);
  await expect(guest.count).toHaveText("2");
  await guest.ownPhotos.click();
  await expect(guest.paywall).toBeVisible();
  await guest.paywallBack.click();
  await expect(guest.count).toHaveText("2");
  await guest.back.click();
  await guest.wardrobe("male").click();
  await expect(guest.items).toHaveCount(13);
  await expect(guest.count).toHaveText("0");
  await expect(guest.next).toHaveCount(0);
  await guest.select(["m-tee-white", "m-trousers-black", "m-sneakers-white"]);
  await expect(guest.count).toHaveText("1");
});

for (const locale of ["en", "ru"] as const) {
  test(`${locale}: incompatible colors explain a replacement without unlocking results`, async ({
    page,
  }) => {
    const guest = new GuestPage(page, locale);
    await guest.goto();
    await guest.wardrobe("female").click();
    await guest.select(["w-blouse-blush", "w-jeans-blue", "w-sneakers-white"]);
    await expect(guest.count).toHaveText("0");
    await expect(guest.next).toHaveCount(0);
    await expect(guest.hint).toHaveText(
      locale === "en"
        ? "These colors don't form an outfit yet. Try a black, white or grey alternative."
        : "Эти цвета пока не складываются в образ. Попробуй заменить одну вещь на чёрную, белую или серую.",
    );
    await guest.item("w-blouse-blush").click();
    await guest.item("w-tee-white").click();
    await expect(guest.count).toHaveText("1");
    await expect(guest.next).toBeVisible();
  });
}
