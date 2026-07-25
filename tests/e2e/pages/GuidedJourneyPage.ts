import type { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { journeyCopy, type Locale } from "../fixtures/locales";

/**
 * Page Object for the authenticated guided journey.
 * The `?tab=search` handoff opens Step 3 without coupling tests to Step 1/2.
 */
export class GuidedJourneyPage extends BasePage {
  readonly path: string;
  readonly linkTab: Locator;
  readonly linkInput: Locator;
  readonly searchTab: Locator;

  constructor(page: Page, locale: Locale = "en") {
    super(page);
    this.path = `/${locale}/guided-journey?tab=search`;
    this.linkTab = page.getByRole("tab", {
      name: journeyCopy[locale].linkTab,
    });
    this.linkInput = page.getByPlaceholder(journeyCopy[locale].linkPlaceholder);
    this.searchTab = page.getByRole("tab", {
      name: journeyCopy[locale].searchTab,
    });
  }
}
