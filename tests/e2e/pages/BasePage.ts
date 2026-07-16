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

  /**
   * Resolve a design token (CSS custom property) as computed on the root
   * element. Trimmed; empty string when the token is not defined.
   */
  async designToken(name: string): Promise<string> {
    return this.page.evaluate(
      (token) =>
        getComputedStyle(document.documentElement)
          .getPropertyValue(token)
          .trim(),
      name,
    );
  }

  /**
   * Resolve a color-valued design token to the browser's canonical
   * `rgb()`/`rgba()` serialization by applying it to a probe element.
   * Immune to build-time value normalization (hex case, rgba spacing).
   * Empty string when the token is not defined: the probe is sampled with
   * two different `var()` defaults — a defined token yields the same color
   * both times, an undefined one yields the two defaults.
   */
  async resolvedTokenColor(name: string): Promise<string> {
    return this.page.evaluate((token) => {
      const sample = (defaultColor: string): string => {
        const probe = document.createElement("span");
        probe.style.color = `var(${token}, ${defaultColor})`;
        document.body.append(probe);
        const value = getComputedStyle(probe).color;
        probe.remove();
        return value;
      };
      const first = sample("rgb(1, 2, 3)");
      const second = sample("rgb(3, 2, 1)");
      return first === second ? first : "";
    }, name);
  }
}
