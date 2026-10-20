import type { Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class GuestWardrobePage extends BasePage {
  readonly path = "/en/my-items";
  constructor(page: Page) {
    super(page);
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
  async open(presetId: string) {
    await this.page.waitForLoadState("load");
    await this.item(presetId).locator(".my-items-card-main").click();
  }
  get catalogFavorites() {
    return this.page.getByRole("tab").nth(1);
  }
  get moveToSale() {
    return this.page.getByRole("button", { name: "Move to Sale", exact: true });
  }
  get returnToMyItems() {
    return this.page.getByRole("button", { name: "To My Items", exact: true });
  }
  get feedback() {
    return this.page.getByRole("status");
  }
}
