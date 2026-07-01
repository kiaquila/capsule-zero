import type { Page, Response } from "@playwright/test";

/**
 * Common base class for every Page Object.
 *
 * Subclasses MUST set `path` to the route segment (relative to baseURL) that
 * `goto()` should navigate to, and MUST expose any locators through named
 * `Locator` properties so that specs never touch `page.locator()` directly.
 */
export abstract class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  abstract readonly path: string;

  /**
   * Navigate to this page's canonical URL. Returns the navigation response
   * so callers can assert on status codes when needed.
   */
  async goto(): Promise<Response | null> {
    return this.page.goto(this.path, { waitUntil: "domcontentloaded" });
  }

  /**
   * Reload in the same browser context — important for cookie/localStorage
   * persistence assertions.
   */
  async reload(): Promise<Response | null> {
    return this.page.reload({ waitUntil: "domcontentloaded" });
  }

  /**
   * Read a localStorage value. Returned as a raw string (or null) — parsing
   * is the caller's responsibility.
   */
  async readLocalStorage(key: string): Promise<string | null> {
    return this.page.evaluate((k) => window.localStorage.getItem(k), key);
  }
}
