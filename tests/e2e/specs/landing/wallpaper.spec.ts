import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "../../fixtures/base";

const repoRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../..",
);

type WallpaperFormat = "avif" | "webp";

interface WallpaperReference {
  filename: string;
  format: WallpaperFormat;
  hash: string;
}

/** All wallpaper asset references in a source file (`wall.<hash>.<format>`). */
function wallpaperReferences(relativePath: string): WallpaperReference[] {
  const source = readFileSync(resolve(repoRoot, relativePath), "utf8");
  return [...source.matchAll(/wall\.([0-9a-f]+)\.(avif|webp)/g)].map(
    (match) => {
      const hash = match[1];
      const format = match[2];
      if (!hash || (format !== "avif" && format !== "webp")) {
        throw new Error(`invalid wallpaper reference in ${relativePath}`);
      }
      return { filename: `wall.${hash}.${format}`, format, hash };
    },
  );
}

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
    page,
  }) => {
    const wallpaperResponses: Array<{ pathname: string; status: number }> = [];
    page.on("response", (response) => {
      const pathname = new URL(response.url()).pathname;
      if (/\/wall\.[0-9a-f]+\.(?:avif|webp|png)$/.test(pathname)) {
        wallpaperResponses.push({ pathname, status: response.status() });
      }
    });

    await landing.goto();

    // AC-001 — the wallpaper is preloaded in <head> as a high-priority image so
    // the browser fetches it in parallel with CSS, not after the render tree.
    await expect(landing.wallpaperPreloadLink).toHaveCount(1);
    await expect(landing.wallpaperPreloadLink).toHaveAttribute("as", "image");
    await expect(landing.wallpaperPreloadLink).toHaveAttribute(
      "type",
      "image/avif",
    );
    await expect(landing.wallpaperPreloadLink).toHaveAttribute(
      "fetchpriority",
      "high",
    );
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

    // Current Chromium/WebKit targets support typed image-set, so the AVIF
    // preload is reused as the rendered background: one successful wallpaper
    // response and no WebP/PNG request. Safari 16's bounded AVIF+WebP legacy
    // trade-off is documented in spec 045 and cannot be emulated by current
    // Playwright WebKit.
    await expect.poll(() => wallpaperResponses.length).toBe(1);
    expect(wallpaperResponses).toEqual([
      { pathname: "/wall.b6f0e360.avif", status: 200 },
    ]);
  });

  // CSS and the layout cannot share a source constant. Enforce both halves of
  // the immutable-cache contract: the AVIF preload equals the CSS AVIF URL,
  // and every referenced filename starts with the SHA-256 of its own bytes.
  test("wallpaper references are content-addressed and preload stays in sync", () => {
    const cssReferences = wallpaperReferences("app/src/app/globals.css");
    const layoutReferences = wallpaperReferences(
      "app/src/app/[locale]/layout.tsx",
    );
    const filenames = (
      references: WallpaperReference[],
      format: WallpaperFormat,
    ) =>
      new Set(
        references
          .filter((reference) => reference.format === format)
          .map((reference) => reference.filename),
      );

    expect(filenames(cssReferences, "avif")).toEqual(
      filenames(layoutReferences, "avif"),
    );
    expect(filenames(cssReferences, "avif").size).toBe(1);
    expect(filenames(cssReferences, "webp").size).toBe(1);
    expect(filenames(layoutReferences, "webp").size).toBe(0);

    const uniqueReferences = new Map(
      [...cssReferences, ...layoutReferences].map((reference) => [
        reference.filename,
        reference,
      ]),
    );
    for (const reference of uniqueReferences.values()) {
      const bytes = readFileSync(
        resolve(repoRoot, "app/public", reference.filename),
      );
      const digest = createHash("sha256").update(bytes).digest("hex");
      expect(
        digest.startsWith(reference.hash),
        `${reference.filename} is not prefixed by its SHA-256 (${digest})`,
      ).toBe(true);
    }
  });
});
