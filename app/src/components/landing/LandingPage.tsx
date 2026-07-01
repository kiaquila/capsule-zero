"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { openCookieSettings } from "@/lib/cookie-consent";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { CookieBanner } from "./CookieBanner";

export function LandingPage() {
  const t = useTranslations("landing");
  const locale = useLocale();
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div className="cz-page">
      <div className="wallpaper-bg" />
      <div className="wallpaper-overlay" />

      <header className="landing-header">
        <a className="landing-logo" href={`/${locale}`}>
          Capsule Zero
        </a>
        <div className="landing-header-actions">
          <LanguageSwitcher />
          <button
            className="landing-auth-button"
            onClick={() => setAuthOpen((value) => !value)}
            type="button"
            data-testid="auth-trigger"
          >
            {t("authCta")}
          </button>
        </div>
      </header>

      <main className="landing-main">
        <section className="landing-manifesto">
          <h1>{t("headline")}</h1>
          <p>{t("subtitle")}</p>
        </section>
      </main>

      <footer className="landing-footer">
        <Link href="/terms-of-use" data-testid="footer-terms-link">
          {t("terms")}
        </Link>
        <span aria-hidden="true">·</span>
        <Link href="/privacy-policy" data-testid="footer-privacy-link">
          {t("privacy")}
        </Link>
        <span aria-hidden="true">·</span>
        <button
          className="landing-footer-button"
          onClick={openCookieSettings}
          type="button"
        >
          {t("cookieSettings")}
        </button>
        <span aria-hidden="true">·</span>
        <span>{t("copyright")}</span>
      </footer>

      {authOpen ? (
        <div className="landing-auth-popover" data-testid="auth-popover">
          <AuthPanel onClose={() => setAuthOpen(false)} variant="popup" />
        </div>
      ) : null}

      <CookieBanner />
    </div>
  );
}
