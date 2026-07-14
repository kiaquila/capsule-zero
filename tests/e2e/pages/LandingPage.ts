import type { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { AuthPopup } from "./AuthPopup";
import type { Locale } from "../fixtures/locales";

/**
 * Page Object for the landing page (/{locale}) of the canonical Next.js /app.
 * Keep data-testid attributes stable as components are rewritten; specs should
 * not know about component markup or copy.
 */
export class LandingPage extends BasePage {
  readonly path: string;
  readonly cookieBanner: Locator;
  readonly cookieAcceptAll: Locator;
  readonly cookieRejectAll: Locator;
  readonly authTrigger: Locator;
  readonly authPopover: Locator;
  readonly footerTermsLink: Locator;
  readonly footerPrivacyLink: Locator;
  readonly auth: AuthPopup;
  private readonly openGraphImage: Locator;
  private readonly openGraphImageWidth: Locator;
  private readonly openGraphImageHeight: Locator;
  private readonly openGraphImageAlt: Locator;
  private readonly twitterCard: Locator;
  private readonly twitterImage: Locator;

  constructor(page: Page, locale: Locale = "en") {
    super(page);
    this.path = `/${locale}`;
    this.cookieBanner = page.getByTestId("cookie-banner");
    this.cookieAcceptAll = page.getByTestId("cookie-accept-all");
    this.cookieRejectAll = page.getByTestId("cookie-reject-all");
    this.authTrigger = page.getByTestId("auth-trigger");
    this.authPopover = page.getByTestId("auth-popover");
    this.footerTermsLink = page.getByTestId("footer-terms-link");
    this.footerPrivacyLink = page.getByTestId("footer-privacy-link");
    this.auth = new AuthPopup(page);
    this.openGraphImage = page.locator('meta[property="og:image"]');
    this.openGraphImageWidth = page.locator('meta[property="og:image:width"]');
    this.openGraphImageHeight = page.locator(
      'meta[property="og:image:height"]',
    );
    this.openGraphImageAlt = page.locator('meta[property="og:image:alt"]');
    this.twitterCard = page.locator('meta[name="twitter:card"]');
    this.twitterImage = page.locator('meta[name="twitter:image"]');
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

  async socialPreviewMetadata() {
    return {
      openGraphImage: await this.openGraphImage.getAttribute("content", {
        timeout: 5_000,
      }),
      openGraphImageWidth: await this.openGraphImageWidth.getAttribute(
        "content",
        {
          timeout: 5_000,
        },
      ),
      openGraphImageHeight: await this.openGraphImageHeight.getAttribute(
        "content",
        {
          timeout: 5_000,
        },
      ),
      openGraphImageAlt: await this.openGraphImageAlt.getAttribute("content", {
        timeout: 5_000,
      }),
      twitterCard: await this.twitterCard.getAttribute("content", {
        timeout: 5_000,
      }),
      twitterImage: await this.twitterImage.getAttribute("content", {
        timeout: 5_000,
      }),
    };
  }
}
