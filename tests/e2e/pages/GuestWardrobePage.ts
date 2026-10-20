import type { Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class GuestWardrobePage extends BasePage {
  readonly path = "/en/my-items";
  constructor(page: Page) { super(page); }
  async goto() { return this.page.goto(this.path, { waitUntil: "load" }); }
  item(presetId: string) {
    return this.page.locator("article.my-items-card").filter({
      has: this.page.locator(`img[src='/catalog/${presetId}.webp']`),
    });
  }
  favorite(presetId: string) { return this.item(presetId).locator("button[aria-pressed]"); }
  async open(presetId: string) { await this.item(presetId).locator(".my-items-card-main").click(); }
  get moveToSale() { return this.page.getByRole("button", { name: "Move to Sale", exact: true }); }
  get returnToMyItems() { return this.page.getByRole("button", { name: "To My Items", exact: true }); }
  get feedback() { return this.page.getByRole("status"); }
}
