"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { PublicLegalFooter } from "@/components/legal/PublicLegalFooter";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { CookieBanner } from "./CookieBanner";
import { LandingSlidesStub } from "./LandingSlidesStub";

type LandingAuthMode = "signIn" | "signUp";

export function LandingPage() {
  const t = useTranslations("landing");
  const locale = useLocale();
  const [authMode, setAuthMode] = useState<LandingAuthMode | null>(null);

  // Lock the page behind the auth popup: on touch devices the swipe otherwise
  // chains to the body and the panel's own (hidden-scrollbar) scroll never
  // engages, leaving the form bottom unreachable.
  useEffect(() => {
    if (!authMode) {
      return;
    }
    const { style } = document.body;
    const previousOverflow = style.overflow;
    style.overflow = "hidden";
    return () => {
      style.overflow = previousOverflow;
    };
  }, [authMode]);

  return (
    <div className="cz-page">
      <div className="wallpaper-bg" />
      <div className="wallpaper-overlay" />

      {/* First screen = exactly one viewport (§9.11(d)): header + hero. */}
      <div className="landing-fold">
        <header className="landing-header">
          <a className="landing-logo" href={`/${locale}`}>
            Capsule Zero
          </a>
          <div className="landing-header-actions">
            <LanguageSwitcher />
            <button
              className="landing-auth-button"
              onClick={() =>
                setAuthMode((value) => (value === "signIn" ? null : "signIn"))
              }
              type="button"
              data-testid="auth-trigger"
            >
              {t("authCta")}
            </button>
          </div>
        </header>

        <main className="landing-main">
          <section className="landing-hero">
            <h1 className="landing-hero-title" data-testid="hero-title">
              {t("headlineLine1")}
              <br />
              {t("headlineLine2")}
            </h1>
            <p className="landing-hero-subtitle" data-testid="hero-subtitle">
              {t("subtitle")}
            </p>
            <button
              className="landing-hero-cta"
              onClick={() => setAuthMode("signUp")}
              type="button"
              data-testid="hero-cta"
            >
              {t("heroCta")}
            </button>
            <span
              className="landing-scroll-cue"
              aria-hidden="true"
              data-testid="scroll-cue"
            >
              ▾
            </span>
          </section>
        </main>
      </div>

      <LandingSlidesStub />

      <PublicLegalFooter showCookieSettings />

      {authMode ? (
        <div className="landing-auth-popover" data-testid="auth-popover">
          <AuthPanel
            key={authMode}
            initialMode={authMode}
            onClose={() => setAuthMode(null)}
            variant="popup"
          />
        </div>
      ) : null}

      <CookieBanner />
    </div>
  );
}
