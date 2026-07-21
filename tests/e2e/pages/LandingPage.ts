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
  /** Hero H1 of the approved v1c hero (spec 044). */
  readonly heroTitle: Locator;
  readonly heroSubtitle: Locator;
  /** Gold primary CTA — opens the auth popup in sign-up mode (interim, spec 044). */
  readonly heroCta: Locator;
  /** "How it works" placeholder section — must sit strictly below the fold. */
  readonly slidesStub: Locator;
  /** Decorative scroll cue — static when reduced motion is requested. */
  readonly scrollCue: Locator;
  readonly footerTermsLink: Locator;
  readonly footerPrivacyLink: Locator;
  /** Fixed wallpaper layer behind every screen (spec 045). */
  readonly wallpaperBg: Locator;
  /** High-priority `<head>` preload for the wallpaper asset (spec 045). */
  readonly wallpaperPreloadLink: Locator;
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
    this.heroTitle = page.getByTestId("hero-title");
    this.heroSubtitle = page.getByTestId("hero-subtitle");
    this.heroCta = page.getByTestId("hero-cta");
    this.slidesStub = page.getByTestId("slides-stub");
    this.scrollCue = page.getByTestId("scroll-cue");
    this.footerTermsLink = page.getByTestId("footer-terms-link");
    this.footerPrivacyLink = page.getByTestId("footer-privacy-link");
    this.wallpaperBg = page.locator(".wallpaper-bg");
    // Scoped to the wallpaper asset so an unrelated future image preload does
    // not make this assertion ambiguous (spec 045 review).
    this.wallpaperPreloadLink = page.locator(
      'link[rel="preload"][as="image"][href*="wall."]',
    );
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
   * Open the auth popup in sign-up mode by clicking the hero CTA (spec 044).
   */
  async openHeroCta(): Promise<void> {
    await this.heroCta.click();
  }

  /**
   * Computed `background-image` of the hero CTA — the gold gradient contract
   * (`--btn-cta-bg`) serialized by the browser as `linear-gradient(... rgb())`.
   */
  async heroCtaBackgroundImage(): Promise<string> {
    return this.heroCta.evaluate(
      (element) => getComputedStyle(element).backgroundImage,
    );
  }

  /**
   * True when the slides stub starts strictly below the first viewport with
   * the page scrolled to the top — the "first screen is exactly one viewport"
   * contract of design-system.md §9.11(d).
   */
  async isSlidesStubBelowFirstViewport(): Promise<boolean> {
    await this.page.evaluate(() => window.scrollTo(0, 0));
    const viewport = this.page.viewportSize();
    const box = await this.slidesStub.boundingBox();
    if (!viewport || !box) {
      return false;
    }
    return box.y >= viewport.height;
  }

  /**
   * Emulate the visitor's OS/browser reduced-motion preference.
   */
  async emulateReducedMotion(): Promise<void> {
    await this.page.emulateMedia({ reducedMotion: "reduce" });
  }

  /**
   * Computed animation name for the decorative scroll cue.
   */
  async scrollCueAnimationName(): Promise<string> {
    return this.scrollCue.evaluate(
      (element) => getComputedStyle(element).animationName,
    );
  }

  /**
   * Computed `filter` of the wallpaper layer — must be `none` once the
   * grayscale is baked into the pre-encoded asset (spec 045).
   */
  async wallpaperFilter(): Promise<string> {
    return this.wallpaperBg.evaluate(
      (element) => getComputedStyle(element).filter,
    );
  }

  /**
   * Computed `background-color` of the wallpaper layer — the dark fallback tone
   * painted before the image arrives so the first paint is never a light flash.
   */
  async wallpaperBackgroundColor(): Promise<string> {
    return this.wallpaperBg.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    );
  }

  /**
   * Computed `background-image` of the wallpaper layer — the pre-encoded
   * `image-set()` (AVIF/WebP), never the retired colour PNG.
   */
  async wallpaperBackgroundImage(): Promise<string> {
    return this.wallpaperBg.evaluate(
      (element) => getComputedStyle(element).backgroundImage,
    );
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
