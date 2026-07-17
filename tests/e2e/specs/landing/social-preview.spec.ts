import { createHash } from "node:crypto";

import { expect, test } from "../../fixtures/base";

const productionOrigin = "https://capsulezero.app";
const previewPath = "/social/capsule-zero-homepage.png";
const previewUrl = `${productionOrigin}${previewPath}`;
const previewSha256 = "refresh-required";

test.describe("Landing — social link preview", () => {
  test("publishes a production-ready large image card", async ({
    landing,
    request,
  }) => {
    await landing.goto();

    const metadata = await landing.socialPreviewMetadata();

    expect(metadata).toEqual({
      openGraphImage: previewUrl,
      openGraphImageWidth: "1200",
      openGraphImageHeight: "630",
      openGraphImageAlt: "Capsule Zero homepage",
      twitterCard: "summary_large_image",
      twitterImage: previewUrl,
    });

    // Negative scenario: local rendering must not leak localhost or a relative
    // URL into crawler-facing metadata, and the advertised path must not 404.
    expect(
      new URL(metadata.openGraphImage ?? "", productionOrigin).origin,
    ).toBe(productionOrigin);

    const image = await request.get(previewPath);
    expect(image.ok()).toBeTruthy();
    expect(image.headers()["content-type"]).toContain("image/png");
    expect(createHash("sha256").update(await image.body()).digest("hex")).toBe(
      previewSha256,
    );
  });
});
