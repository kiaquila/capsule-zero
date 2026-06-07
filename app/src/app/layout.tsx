import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Capsule Zero",
  description:
    "A premium wardrobe management platform for capsule wardrobes, slow fashion, and outfit productivity.",
  keywords: ["capsule wardrobe", "capsule zero", "wardrobe", "capsule", "style"],
  openGraph: {
    title: "Capsule Zero",
    description: "A premium wardrobe management platform.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
