import { expect, test } from "@playwright/test";
import { LandingPage } from "../../pages/LandingPage";

// Spec 043 (Q4 closed 2026-07-16): gold (#EFBF04 → #FFDD00) is the single
// signal accent reserved for the primary CTA and logo accent; errors move to
// signal red #FF5449. The retired yellow must not survive in any error-family
// token — a regression that re-introduces yellow errors recreates the
// CTA/error semantic collision recorded in PRODUCT-PLAN D3.

const RETIRED_YELLOW = "rgb(255, 214, 0)";

const ERROR_FAMILY_TOKENS = [
  "--color-error",
  "--color-error-border",
  "--color-error-border-soft",
  "--color-error-bg",
];

test.describe("design tokens — Q4 accent decisions", () => {
  test("error family is signal red and the gold accent family is minted", async ({
    page,
  }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    expect(await landing.resolvedTokenColor("--color-error")).toBe(
      "rgb(255, 84, 73)",
    );
    expect(await landing.resolvedTokenColor("--color-error-border")).toBe(
      "rgba(255, 84, 73, 0.78)",
    );
    expect(await landing.resolvedTokenColor("--color-error-border-soft")).toBe(
      "rgba(255, 84, 73, 0.44)",
    );
    expect(await landing.resolvedTokenColor("--color-error-bg")).toBe(
      "rgba(255, 84, 73, 0.1)",
    );
    expect(await landing.resolvedTokenColor("--color-error-text")).toBe(
      "rgb(255, 122, 112)",
    );

    expect(await landing.resolvedTokenColor("--color-gold-500")).toBe(
      "rgb(239, 191, 4)",
    );
    expect(await landing.resolvedTokenColor("--color-gold-450")).toBe(
      "rgb(255, 221, 0)",
    );
    expect(await landing.resolvedTokenColor("--btn-cta-text")).toBe(
      "rgb(10, 10, 10)",
    );
    expect(await landing.designToken("--btn-cta-bg")).toContain(
      "linear-gradient",
    );
  });

  test("negative: the retired yellow is absent from every error-family token", async ({
    page,
  }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    for (const token of ERROR_FAMILY_TOKENS) {
      const resolved = await landing.resolvedTokenColor(token);
      expect(resolved, token).not.toBe("");
      expect(resolved, token).not.toContain("255, 214, 0");
      expect(resolved, token).not.toBe(RETIRED_YELLOW);
    }
  });
});
