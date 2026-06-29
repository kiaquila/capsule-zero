import type { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { AuthPopup } from "./AuthPopup";
import type { Locale } from "../fixtures/locales";

/**
 * Page Object for the landing page (/{locale}) of the legacy Next.js /app.
 * When /app is replaced by /web, only the data-testid attributes need to
 * be re-added on the new components — this POM does not change.
 */
export class LandingPage extends BasePage {
  readonly path: string;
  readonly cookieBanner: Locator;
  readonly cookieAcceptAll: Locator;
  readonly cookieRejectAll: Locator;
  readonly authTrigger: Locator;
  readonly authPopover: Locator;
  readonly auth: AuthPopup;

  constructor(page: Page, locale: Locale = "en") {
    super(page);
    this.path = `/${locale}`;
    this.cookieBanner = page.getByTestId("cookie-banner");
    this.cookieAcceptAll = page.getByTestId("cookie-accept-all");
    this.cookieRejectAll = page.getByTestId("cookie-reject-all");
    this.authTrigger = page.getByTestId("auth-trigger");
    this.authPopover = page.getByTestId("auth-popover");
    this.auth = new AuthPopup(page);
  }

  /**
   * Open the landing auth popup by clicking the header CTA.
   */
  async openAuth(): Promise<void> {
    await this.authTrigger.click();
  }

  /**
   * Accept all cookie categories. Retries once to survive the Next dev-server
   * hydration window where static HTML is visible before React handlers attach.
   */
  async acceptAllCookies(): Promise<void> {
    await this.cookieBanner.waitFor({ state: "visible" });

    for (let attempt = 0; attempt < 2; attempt += 1) {
      await this.cookieAcceptAll.click();

      try {
        await this.cookieBanner.waitFor({ state: "detached", timeout: 5_000 });
        return;
      } catch (error) {
        if (attempt === 1) {
          throw error;
        }
      }
    }
  }

  /**
   * If the cookie banner is currently visible, accept all and wait for
   * it to be removed from DOM. Safe no-op if the banner is already gone.
   */
  async dismissCookieBannerIfPresent(): Promise<void> {
    if (await this.cookieBanner.isVisible()) {
      await this.acceptAllCookies();
    }
  }
}
