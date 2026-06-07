"use client";

import { useLocale, useTranslations } from "next-intl";
import { AuthPanel } from "./AuthPanel";
import { LanguageSwitcher } from "@/components/landing/LanguageSwitcher";
import { CookieBanner } from "@/components/landing/CookieBanner";

export function AuthPage() {
  const locale = useLocale();

  return (
    <div className="cz-page">
      <div className="wallpaper-bg" />
      <div className="wallpaper-overlay" />

      <header className="landing-header">
        <a className="landing-logo" href={`/${locale}`}>
          Capsule Zero
        </a>
        <LanguageSwitcher />
      </header>

      <main className="auth-page-main">
        <AuthPanel variant="standalone" />
      </main>

      <Footer />
      <CookieBanner />
    </div>
  );
}

function Footer() {
  const t = useTranslations("landing");

  return (
    <footer className="landing-footer">
      <a href="#terms">{t("terms")}</a>
      <span aria-hidden="true">·</span>
      <a href="#privacy">{t("privacy")}</a>
      <span aria-hidden="true">·</span>
      <span>{t("copyright")}</span>
    </footer>
  );
}
