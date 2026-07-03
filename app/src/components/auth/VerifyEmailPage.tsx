"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { LanguageSwitcher } from "@/components/landing/LanguageSwitcher";
import { completeEmailVerificationAction } from "@/features/auth/actions";

const elevatedGlassStyle = {
  backdropFilter: "blur(64px) saturate(118%)",
  WebkitBackdropFilter: "blur(64px) saturate(118%)",
} satisfies CSSProperties;

interface VerifyEmailPageProps {
  flowId?: string;
  code?: string;
}

type Status = "input" | "verifying" | "success" | "error" | "noFlow";

/**
 * Full-page landing for emailed verification links (spec 035). Auto-submits
 * when the link carries both flow and code; otherwise offers code entry
 * against the flow from the link. Without a flow it points back to sign-in —
 * the dashboard banner owns starting fresh flows.
 */
export function VerifyEmailPage({ flowId, code }: VerifyEmailPageProps) {
  const t = useTranslations("verifyEmailPage");
  const locale = useLocale();
  const [status, setStatus] = useState<Status>(() => {
    if (!flowId) {
      return "noFlow";
    }
    return code ? "verifying" : "input";
  });
  const [message, setMessage] = useState<string | null>(null);
  const [codeValue, setCodeValue] = useState(code ?? "");
  const autoSubmitted = useRef(false);

  useEffect(() => {
    if (!flowId || !code || autoSubmitted.current) {
      return;
    }
    autoSubmitted.current = true;
    void completeEmailVerificationAction({ flowId, code }).then((result) => {
      if (result.ok) {
        setStatus("success");
      } else {
        setStatus("input");
        setMessage(result.message ?? t("error"));
      }
    });
  }, [flowId, code, t]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!flowId || !codeValue.trim()) {
      return;
    }
    setStatus("verifying");
    setMessage(null);
    const result = await completeEmailVerificationAction({
      flowId,
      code: codeValue.trim(),
    });
    if (result.ok) {
      setStatus("success");
    } else {
      setStatus("input");
      setMessage(result.message ?? t("error"));
    }
  };

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
        <section
          className="auth-panel glass auth-panel-standalone"
          data-testid="verify-email-page"
          style={elevatedGlassStyle}
        >
          <h2 className="auth-recovery-title">{t("title")}</h2>

          {status === "verifying" ? (
            <p className="auth-recovery-hint">{t("verifying")}</p>
          ) : null}

          {status === "success" ? (
            <>
              <p className="auth-recovery-hint" data-testid="verify-email-page-success">
                {t("success")}
              </p>
              <a className="auth-primary" href={`/${locale}/dashboard`}>
                {t("goToDashboard")}
              </a>
            </>
          ) : null}

          {status === "input" ? (
            <form noValidate onSubmit={submit}>
              <p className="auth-recovery-hint">{t("enterCode")}</p>
              <div className="auth-field">
                <input
                  autoComplete="one-time-code"
                  className="auth-input"
                  data-testid="verify-email-page-code"
                  inputMode="numeric"
                  onChange={(event) => setCodeValue(event.target.value)}
                  placeholder={t("codePlaceholder")}
                  type="text"
                  value={codeValue}
                />
              </div>
              {message ? (
                <p className="auth-server-message auth-server-message-error" role="alert">
                  {message}
                </p>
              ) : null}
              <button className="auth-primary" type="submit">
                {t("submit")}
              </button>
            </form>
          ) : null}

          {status === "noFlow" ? (
            <>
              <p className="auth-recovery-hint">{t("noFlow")}</p>
              <a className="auth-primary" href={`/${locale}/auth`}>
                {t("goToLogin")}
              </a>
            </>
          ) : null}
        </section>
      </main>
    </div>
  );
}
