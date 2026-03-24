import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
  display: "swap",
});

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
    <html lang="en" className={inter.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
