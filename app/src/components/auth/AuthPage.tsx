"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AuthPanel, type RecoveryDeepLink } from "./AuthPanel";
import { LanguageSwitcher } from "@/components/landing/LanguageSwitcher";
import { CookieBanner } from "@/components/landing/CookieBanner";

interface AuthPageProps {
  /** Recovery flow carried by /auth?flow=…&code=… URL params. */
  recovery?: RecoveryDeepLink;
  /** Whether this deployment offers Google sign-in (spec 037). */
  googleSignIn?: boolean;
  /** A failed Google callback landed on /auth?googleError=1. */
  googleError?: boolean;
}

export function AuthPage({ recovery, googleSignIn, googleError }: AuthPageProps) {
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
        <AuthPanel
          googleError={googleError}
          googleSignIn={googleSignIn}
          initialRecovery={recovery}
          variant="standalone"
        />
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
      <Link href="/terms-of-use" data-testid="footer-terms-link">
        {t("terms")}
      </Link>
      <span aria-hidden="true">·</span>
      <Link href="/privacy-policy" data-testid="footer-privacy-link">
        {t("privacy")}
      </Link>
      <span aria-hidden="true">·</span>
      <span>{t("copyright")}</span>
    </footer>
  );
}
