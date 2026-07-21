import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import ReactDOM from "react-dom";
import type { ReactNode } from "react";
import { routing } from "@/i18n/routing";
import { siteMetadata } from "@/lib/site-metadata";
import "../globals.css";

export const metadata = siteMetadata;

// Spec 045: preload the wallpaper AVIF at high priority so the browser fetches
// it in parallel with the render-blocking CSS instead of discovering it late
// via `.wallpaper-bg { background-image }`. `type` lets engines without AVIF
// skip this preload and fall to the WebP entry of the CSS `image-set()`. The
// wallpaper renders on every screen, so preloading it in the locale root layout
// is correct for all routes. Keep this hash in sync with `globals.css`
// `.wallpaper-bg` — regenerating the asset mints a new content hash that must be
// updated in BOTH places (see spec 045 tasks.md).
const WALLPAPER_PRELOAD_HREF = "/wall.b6f0e360.avif";

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  ReactDOM.preload(WALLPAPER_PRELOAD_HREF, {
    as: "image",
    type: "image/avif",
    fetchPriority: "high",
  });

  return (
    <html lang={locale}>
      <body className="antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
