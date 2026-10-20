import type { Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { validationCopy, type Locale } from "../fixtures/locales";

export class GuestWardrobePage extends BasePage {
  readonly path: string;
  constructor(
    page: Page,
    private readonly locale: Locale = "en",
  ) {
    super(page);
    this.path = `/${locale}/my-items`;
  }
  async goto() {
    return this.page.goto(this.path, { waitUntil: "load" });
  }
  async reload() {
    return this.page.reload({ waitUntil: "load" });
  }
  item(presetId: string) {
    return this.page.locator(`article[data-guest-preset="${presetId}"]`);
  }
  favorite(presetId: string) {
    return this.item(presetId).locator("button[aria-pressed]");
  }
  itemName(presetId: string) {
    return this.item(presetId).locator(".my-items-card-name");
  }
  async open(presetId: string) {
    await this.page.waitForLoadState("load");
    await this.item(presetId).locator(".my-items-card-main").click();
  }
  get catalogFavorites() {
    return this.page.getByRole("tab").nth(1);
  }
  get moveToSale() {
    return this.page.getByRole("button", {
      name: validationCopy[this.locale].myItems.detail.moveSale,
      exact: true,
    });
  }
  get returnToMyItems() {
    return this.page.getByRole("button", {
      name: validationCopy[this.locale].forSale.detail.returnToMyItems,
      exact: true,
    });
  }
  get feedback() {
    return this.page.getByRole("status");
  }
  get detail() {
    return this.page.getByRole("dialog");
  }
  get addToCapsule() {
    return this.detail.getByRole("button", {
      name: validationCopy[this.locale].uncapsulated.actions.addToCapsule,
      exact: true,
    });
  }
  get saveMetadata() {
    return this.detail.getByRole("button", {
      name: validationCopy[this.locale].myItems.detail.save,
      exact: true,
    });
  }
  get deleteItem() {
    return this.detail.getByRole("button", {
      name: validationCopy[this.locale].myItems.detail.delete,
      exact: true,
    });
  }
  get nameInput() {
    return this.detail.getByRole("textbox", {
      name: validationCopy[this.locale].myItems.detail.name,
      exact: true,
    });
  }
  get categoryInput() {
    return this.detail.getByRole("combobox");
  }
  get changePhoto() {
    return this.detail.getByRole("button", {
      name: new RegExp(
        validationCopy[this.locale].myItems.detail.changePhoto,
        "i",
      ),
    });
  }
  get addColor() {
    return this.detail.getByRole("button", {
      name: validationCopy[this.locale].myItems.detail.addColor,
      exact: true,
    });
  }
  get moveToRepair() {
    return this.detail.getByRole("button", {
      name: validationCopy[this.locale].myItems.detail.moveRepair,
      exact: true,
    });
  }
  get markFixed() {
    return this.detail.getByRole("button", {
      name: validationCopy[this.locale].forRepair.detail.markFixed,
      exact: true,
    });
  }
}
