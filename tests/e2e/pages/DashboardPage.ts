import type { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import type { Locale } from "../fixtures/locales";

/**
 * Page Object for the dashboard (`/[locale]/dashboard`) — the signed-in
 * landing surface. Owns the sign-out control so the sign-out specs never
 * reach into the navigation DOM directly.
 */
export class DashboardPage extends BasePage {
  readonly path: string;
  readonly signOutButton: Locator;
  readonly mobileMoreToggle: Locator;
  readonly mobileSignOutButton: Locator;
  /** Stats row below the hero — readiness signal for visual snapshots (CSS class — no testid yet). */
  readonly statsRow: Locator;

  constructor(page: Page, locale: Locale = "en") {
    super(page);
    this.path = `/${locale}/dashboard`;
    this.signOutButton = page.getByTestId("nav-sign-out");
    this.mobileMoreToggle = page.getByTestId("nav-more-toggle");
    this.mobileSignOutButton = page.getByTestId("nav-sign-out-mobile");
    this.statsRow = page.locator(".dashboard-stats-row");
  }

  /**
   * Sign out through whichever navigation the viewport shows: the desktop
   * sidebar button, or the mobile "More" sheet.
   */
  async signOut(): Promise<void> {
    if (await this.signOutButton.isVisible()) {
      await this.signOutButton.click();
      return;
    }
    await this.mobileMoreToggle.click();
    await this.mobileSignOutButton.click();
  }
}
