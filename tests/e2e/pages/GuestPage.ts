import type { Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { AuthPopup } from "./AuthPopup";
import type { Locale } from "../fixtures/locales";

export class GuestPage extends BasePage {
  readonly path: string;
  readonly auth: AuthPopup;
  constructor(page: Page, locale: Locale = "en") {
    super(page);
    this.path = `/${locale}/start`;
    this.auth = new AuthPopup(page);
  }
  get typeStep() {
    return this.page.getByTestId("guest-step-type");
  }
  get itemsStep() {
    return this.page.getByTestId("guest-step-items");
  }
  get resultStep() {
    return this.page.getByTestId("guest-step-result");
  }
  get next() {
    return this.page.getByTestId("guest-next");
  }
  get count() {
    return this.page.getByTestId("guest-count");
  }
  get resultCount() {
    return this.page.getByTestId("guest-result-count");
  }
  get restart() {
    return this.page.getByTestId("guest-restart");
  }
  get back() {
    return this.page.getByTestId("guest-back");
  }
  get paywall() {
    return this.page.getByTestId("guest-paywall");
  }
  get paywallBack() {
    return this.page.getByTestId("guest-paywall-back");
  }
  get ownPhotos() {
    return this.page.getByTestId("guest-own-photos");
  }
  get save() {
    return this.page.getByTestId("guest-save-cta");
  }
  get recommendations() {
    return this.page.getByTestId(/^guest-reco-add-/);
  }
  wardrobe(type: "female" | "male" | "mixed") {
    return this.page.getByTestId(`guest-type-${type}`);
  }
  item(id: string) {
    return this.page.getByTestId(`guest-item-${id}`);
  }
  get items() {
    return this.page.getByTestId(/^guest-item-/);
  }
  async seed(value: unknown) {
    await this.page.addInitScript((data) => {
      localStorage.setItem("cz-guest-v1", JSON.stringify(data));
    }, value);
  }
  async select(ids: string[]) {
    for (const id of ids) await this.item(id).click();
  }
  async brokenImages() {
    return this.items.locator("img").evaluateAll(async (images) => {
      await Promise.all(
        images.map((image) =>
          (image as HTMLImageElement).decode().catch(() => {}),
        ),
      );
      return images.filter((image) => !(image as HTMLImageElement).naturalWidth)
        .length;
    });
  }
}
