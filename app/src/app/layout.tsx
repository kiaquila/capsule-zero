import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Capsule Zero — Система. Стиль. Свобода.",
  description:
    "Создай капсульный гардероб из минимума вещей с максимумом комплектов. AI-стилист по методологии Школы Шоппинга.",
  keywords: ["capsule wardrobe", "capsule zero", "гардероб", "капсула", "стиль"],
  openGraph: {
    title: "Capsule Zero",
    description: "Система. Стиль. Свобода.",
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
