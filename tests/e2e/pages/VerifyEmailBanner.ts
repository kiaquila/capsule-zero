import type { Locator, Page } from "@playwright/test";

/**
 * Component-level Page Object for the verify-email banner shown to signed-in
 * users whose address is not verified yet (spec 035). Rendered on the
 * dashboard; owns its selectors like AuthPopup does for the auth popup.
 */
export class VerifyEmailBanner {
  readonly container: Locator;
  readonly codeInput: Locator;
  readonly submitButton: Locator;
  readonly resendButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.container = page.getByTestId("verify-email-banner");
    this.codeInput = this.container.getByTestId("verify-email-code-input");
    this.submitButton = this.container.getByTestId("verify-email-submit");
    this.resendButton = this.container.getByTestId("verify-email-resend");
    this.errorMessage = this.container.getByTestId("verify-email-error");
  }

  async submitCode(code: string): Promise<void> {
    await this.codeInput.fill(code);
    await this.submitButton.click();
  }
}
