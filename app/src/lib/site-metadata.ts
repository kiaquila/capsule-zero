import type { Metadata } from "next";

const siteUrl = "https://capsulezero.app";
const title = "Capsule Zero";
const description =
  "A premium wardrobe management platform for capsule wardrobes, slow fashion, and outfit productivity.";
const socialDescription = "A premium wardrobe management platform.";
const socialPreviewPath = "/social/capsule-zero-homepage.png";
const socialPreviewAlt = "Capsule Zero homepage";

export const siteMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  keywords: [
    "capsule wardrobe",
    "capsule zero",
    "wardrobe",
    "capsule",
    "style",
  ],
  openGraph: {
    title,
    description: socialDescription,
    url: siteUrl,
    siteName: title,
    type: "website",
    images: [
      {
        url: socialPreviewPath,
        width: 1200,
        height: 630,
        alt: socialPreviewAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: socialDescription,
    images: [
      {
        url: socialPreviewPath,
        alt: socialPreviewAlt,
      },
    ],
  },
};
