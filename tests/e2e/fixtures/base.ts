import { test as base } from "@playwright/test";
import { LandingPage } from "../pages/LandingPage";
import type { Locale } from "./locales";

interface Fixtures {
  /**
   * The landing page POM, pre-bound to the active app route locale.
   */
  landing: LandingPage;
}

interface Options {
  /**
   * App route locale segment used by the Page Objects (defaults to "en").
   * Override via `test.use({ appLocale: "ru" })` to run scenarios in RU.
   */
  appLocale: Locale;
}

export const test = base.extend<Fixtures & Options>({
  appLocale: ["en", { option: true }],
  landing: async ({ page, appLocale }, use) => {
    const landing = new LandingPage(page, appLocale);
    await use(landing);
  },
});

export { expect } from "@playwright/test";
export type { Locale } from "./locales";
