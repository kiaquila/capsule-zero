import type { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import type { Locale } from "../fixtures/locales";

/**
 * Page Object for the profile screen (`/[locale]/profile`). Owns the
 * change-password selectors introduced by spec 035 so specs never reach into
 * the profile DOM directly.
 */
export class ProfilePage extends BasePage {
  readonly path: string;
  readonly changePasswordButton: Locator;
  readonly passwordForm: Locator;
  readonly currentPasswordInput: Locator;
  readonly newPasswordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly passwordSubmit: Locator;
  readonly passwordError: Locator;
  /** Transient status toast shared by every profile action. */
  readonly toast: Locator;

  constructor(page: Page, locale: Locale = "en") {
    super(page);
    this.path = `/${locale}/profile`;
    this.changePasswordButton = page.getByTestId(
      "profile-change-password-button",
    );
    this.passwordForm = page.getByTestId("profile-password-form");
    this.currentPasswordInput = page.getByTestId("profile-current-password");
    this.newPasswordInput = page.getByTestId("profile-new-password");
    this.confirmPasswordInput = page.getByTestId("profile-confirm-password");
    this.passwordSubmit = page.getByTestId("profile-password-submit");
    this.passwordError = page.getByTestId("profile-password-error");
    this.toast = page.locator(".profile-toast");
  }

  /** Open the form and submit a password change. */
  async changePassword(current: string, next: string): Promise<void> {
    // Match the existing cookie-banner POM retry: Next dev can expose SSR
    // markup a moment before React attaches the click handler in WebKit.
    for (let attempt = 0; attempt < 2; attempt += 1) {
      await this.changePasswordButton.click();

      try {
        await this.passwordForm.waitFor({ state: "visible", timeout: 5_000 });
        break;
      } catch (error) {
        if (attempt === 1) {
          throw error;
        }
      }
    }

    await this.currentPasswordInput.fill(current);
    await this.newPasswordInput.fill(next);
    await this.confirmPasswordInput.fill(next);
    await this.passwordSubmit.click();
  }

  async submitPasswordWithEnter(): Promise<void> {
    await this.confirmPasswordInput.press("Enter");
  }
}
