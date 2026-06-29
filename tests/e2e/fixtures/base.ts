import { test as base } from "@playwright/test";
import { LandingPage } from "../pages/LandingPage";
import type { Locale } from "./locales";

interface Fixtures {
  /**
   * Locale segment used by the Page Objects (defaults to "en"). Override in
   * a spec via `test.use({ locale: "ru" })` to run the same scenarios in RU.
   */
  locale: Locale;
  /**
   * The landing page POM, pre-bound to the active locale.
   */
  landing: LandingPage;
}

export const test = base.extend<Fixtures>({
  locale: ["en", { option: true }],
  landing: async ({ page, locale }, use) => {
    const landing = new LandingPage(page, locale);
    await use(landing);
  },
});

export { expect } from "@playwright/test";
export type { Locale } from "./locales";
