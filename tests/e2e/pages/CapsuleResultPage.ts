import type { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import type { Locale } from "../fixtures/locales";

/** The four capsule-result tabs; "What's missing" is keyed `gaps`. */
export type CapsuleResultTab = "items" | "outfits" | "gaps" | "shopping";

/**
 * Page Object for the capsule result screen (`/[locale]/capsule-result`).
 * Owns the tab strip selectors (spec 039) so specs never reach into the
 * tab DOM directly. Tab state is URL-driven (`?tab=`).
 */
export class CapsuleResultPage extends BasePage {
  readonly path: string;
  readonly tabs: Locator;
  /** The active content panel below the tab strip (CSS class — no testid yet). */
  readonly panel: Locator;
  readonly oprValue: Locator;
  readonly layeringCoverage: Locator;
  readonly layeringDiagnostics: Locator;
  readonly addItemButton: Locator;

  constructor(page: Page, locale: Locale = "en") {
    super(page);
    this.path = `/${locale}/capsule-result`;
    this.tabs = page.getByTestId("capsule-result-tabs");
    this.panel = page.locator(".capsule-result-panel");
    this.oprValue = page.getByTestId("capsule-result-opr-value");
    this.layeringCoverage = page.getByTestId(
      "capsule-result-layering-coverage",
    );
    this.layeringDiagnostics = page.getByTestId(
      "capsule-result-layering-diagnostics",
    );
    this.addItemButton = page.getByRole("button", { name: "Add item" });
  }

  /** Locator for a single tab button. */
  tab(name: CapsuleResultTab): Locator {
    return this.page.getByTestId(`capsule-result-tab-${name}`);
  }

  /**
   * Click a tab and wait for the URL to reflect it (`items` is the default
   * tab and keeps a query-less URL). Retries to survive the Next dev-server
   * hydration window where the button is visible before React handlers
   * attach — same pattern as LandingPage.acceptAllCookies.
   */
  async openTab(name: CapsuleResultTab): Promise<void> {
    if (name === "items") {
      await this.tab(name).click();
      return;
    }

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await this.tab(name).click();

      try {
        await this.page.waitForURL(new RegExp(`tab=${name}`), {
          timeout: 5_000,
        });
        return;
      } catch (error) {
        if (attempt === 2) {
          throw error;
        }
      }
    }
  }

  /** Add a compatible candidate through the capsule item picker. */
  async addItem(candidateName: string): Promise<void> {
    await this.addItemButton.click();
    await this.page
      .getByRole("button", { name: new RegExp(candidateName, "i") })
      .click();
  }
}
