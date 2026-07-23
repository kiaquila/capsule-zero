import { expect, test } from "../../fixtures/base";
import { PASSWORDS, uniqueEmail } from "../../fixtures/accounts";

/**
 * Auth — registration through the /auth popup (spec 024 Phase 2). The flow is
 * provider-agnostic: it passes against both the mock dev server (CI) and the
 * production-shape stack (Go API + Kratos + Postgres via the `api` provider).
 *
 * A successful sign-up issues a session (in `api` mode via the Kratos
 * registration `session` hook) and the app redirects to the dashboard —
 * landing on /dashboard rather than being bounced back to auth proves the
 * session round-trip works.
 */
test.describe("Auth — registration", () => {
  test("sign-up creates a session and lands on the dashboard", async ({
    page,
    landing,
  }) => {
    await landing.goto();
    await landing.dismissCookieBannerIfPresent();
    await landing.openAuth();

    await landing.auth.signUp(uniqueEmail("reg"), PASSWORDS.initial);

    await page.waitForURL(/\/(en|ru)\/dashboard/, { timeout: 25_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
