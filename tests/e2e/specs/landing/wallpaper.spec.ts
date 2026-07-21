import { expect, test } from "../../fixtures/base";

// Spec 045 — wallpaper load optimization.
//
// The editorial wallpaper used to be a 1.9 MB colour PNG loaded as a CSS
// background with a runtime `grayscale()` filter, no `<head>` preload, and
// (in prod) `Cache-Control: max-age=0`. It was therefore discovered late
// (only after the render-blocking CSS parsed), fetched at low priority, and
// visibly "popped in" over a light flash on first paint — reported on
// https://capsulezero.app/en.
//
// This slice bakes the grayscale into a pre-encoded, content-hashed AVIF/WebP
// asset, preloads it at high priority, and gives the layer a dark fallback so
// the first paint is already dark. The wallpaper renders on every screen, so
// the landing page is a representative surface for the contract.
test.describe("landing wallpaper — load optimization (spec 045)", () => {
  test("wallpaper is preloaded, pre-encoded, filter-free, with a dark fallback", async ({
    landing,
  }) => {
    await landing.goto();

    // AC-001 — the wallpaper is preloaded in <head> as a high-priority image so
    // the browser fetches it in parallel with CSS, not after the render tree.
    await expect(landing.wallpaperPreloadLink).toHaveCount(1);
    await expect(landing.wallpaperPreloadLink).toHaveAttribute("as", "image");
    expect(await landing.wallpaperPreloadLink.getAttribute("href")).toMatch(
      /\/wall\.[0-9a-f]+\.avif$/,
    );

    // AC-002 — the layer paints a dark fallback immediately (no light flash)
    // and no longer pays for a runtime grayscale() filter (baked into the
    // asset). `--color-black` (#0A0A0A) resolves to rgb(10, 10, 10).
    expect(await landing.wallpaperFilter()).toBe("none");
    expect(await landing.wallpaperBackgroundColor()).toBe("rgb(10, 10, 10)");

    // AC-003 — the layer renders the pre-encoded asset, and the negative
    // scenario: the retired 1.9 MB colour PNG must never come back.
    const backgroundImage = await landing.wallpaperBackgroundImage();
    expect(backgroundImage).toContain("wall.");
    expect(backgroundImage).toMatch(/\.(avif|webp)/);
    expect(backgroundImage).not.toContain("/wall.png");
  });
});
