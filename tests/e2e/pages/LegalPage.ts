import type { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import type { Locale } from "../fixtures/locales";

/**
 * Slugs of the static legal documents. Mirror the route folders under
 * /app/src/app/[locale]/.
 */
export type LegalSlug =
  | "terms-of-use"
  | "privacy-policy"
  | "community-guidelines"
  | "copyright-policy"
  | "enforcement-policy";

/**
 * Page Object for a static legal document page. These pages are reached by
 * navigation from the landing/auth
 * footer, so specs usually click into them rather than `goto()` directly;
 * `path` is still provided for completeness and direct-load checks.
 */
export class LegalPage extends BasePage {
  readonly path: string;
  readonly root: Locator;
  readonly heading: Locator;
  readonly navigation: Locator;
  readonly backToHome: Locator;

  constructor(
    page: Page,
    slug: LegalSlug = "terms-of-use",
    locale: Locale = "en",
  ) {
    super(page);
    this.path = `/${locale}/${slug}`;
    this.root = page.getByTestId("legal-page");
    this.heading = this.root.getByRole("heading", { level: 1 });
    this.navigation = this.root.locator("header nav");
    this.backToHome = page.getByTestId("legal-back-home");
  }
}
