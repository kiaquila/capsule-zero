import type { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for the standalone /auth route (AuthPanel with
 * variant="standalone") and its Google sign-in affordances (spec 037).
 * The popup variant that opens from the landing page is owned by AuthPopup.
 */
export class AuthStandalonePage extends BasePage {
  readonly path: string;
  readonly container: Locator;
  /** "Continue with Google" social button (spec 037). */
  readonly googleButton: Locator;
  /** Server-reported message area shared by every auth mode. */
  readonly serverMessage: Locator;

  constructor(page: Page, locale: string = "en") {
    super(page);
    this.path = `/${locale}/auth`;
    this.container = page.locator(".auth-panel-standalone");
    this.googleButton = page.getByTestId("auth-google-button");
    this.serverMessage = page.locator(".auth-server-message");
  }
}
