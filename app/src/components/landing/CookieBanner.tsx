"use client";

import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  COOKIE_CONSENT_OPEN_EVENT,
  acceptAll,
  listNonNecessaryCategories,
  rejectAll,
  savePreferences,
  useCookieConsent,
  type CookieCategory,
} from "@/lib/cookie-consent";

const elevatedGlassStyle = {
  backdropFilter: "blur(64px) saturate(118%)",
  WebkitBackdropFilter: "blur(64px) saturate(118%)",
} satisfies CSSProperties;

type ToggleableCategory = Exclude<CookieCategory, "necessary">;

export function CookieBanner() {
  const { decided, gpc, preferences } = useCookieConsent();
  const [forceOpen, setForceOpen] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [draft, setDraft] = useState<Record<ToggleableCategory, boolean>>(() => ({
    preferences: preferences.preferences,
    analytics: preferences.analytics,
    marketing: preferences.marketing,
  }));
  const titleId = useId();
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  const open = !decided || forceOpen;

  useEffect(() => {
    const handler = () => {
      lastFocusedRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      setDraft({
        preferences: preferences.preferences,
        analytics: preferences.analytics,
        marketing: preferences.marketing,
      });
      setCustomizing(true);
      setForceOpen(true);
    };
    window.addEventListener(COOKIE_CONSENT_OPEN_EVENT, handler);
    return () => window.removeEventListener(COOKIE_CONSENT_OPEN_EVENT, handler);
  }, [preferences]);

  useEffect(() => {
    if (open && customizing) {
      closeRef.current?.focus();
    }
  }, [open, customizing]);

  const dismiss = useCallback(() => {
    setForceOpen(false);
    setCustomizing(false);
    lastFocusedRef.current?.focus();
  }, []);

  if (!open) {
    return null;
  }

  const handleAcceptAll = () => {
    acceptAll();
    dismiss();
  };

  const handleRejectAll = () => {
    rejectAll();
    dismiss();
  };

  const handleCustomize = () => {
    setDraft({
      preferences: preferences.preferences,
      analytics: preferences.analytics,
      marketing: preferences.marketing,
    });
    setCustomizing(true);
  };

  const handleSave = () => {
    savePreferences(draft);
    dismiss();
  };

  return (
    <aside
      className="cookie-banner glass"
      style={elevatedGlassStyle}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      aria-live="polite"
      data-testid="cookie-banner"
    >
      {customizing ? (
        <CustomizePanel
          titleId={titleId}
          draft={draft}
          gpc={gpc}
          onChange={setDraft}
          onSave={handleSave}
          onAcceptAll={handleAcceptAll}
          onRejectAll={handleRejectAll}
          onClose={dismiss}
          closeRef={closeRef}
        />
      ) : (
        <Summary
          titleId={titleId}
          gpc={gpc}
          onAcceptAll={handleAcceptAll}
          onRejectAll={handleRejectAll}
          onCustomize={handleCustomize}
        />
      )}
    </aside>
  );
}

interface SummaryProps {
  titleId: string;
  gpc: boolean;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onCustomize: () => void;
}

function Summary({ titleId, gpc, onAcceptAll, onRejectAll, onCustomize }: SummaryProps) {
  const t = useTranslations("landing");

  return (
    <div className="cookie-summary">
      <div className="cookie-summary-copy">
        <p id={titleId}>{t("cookie")}</p>
        {gpc ? <p className="cookie-gpc-note">{t("cookieGpcNote")}</p> : null}
      </div>
      <div className="cookie-actions">
        <button
          className="cookie-action cookie-action-primary"
          onClick={onAcceptAll}
          type="button"
          data-testid="cookie-accept-all"
        >
          {t("cookieAccept")}
        </button>
        <button
          className="cookie-action cookie-action-primary"
          onClick={onRejectAll}
          type="button"
          data-testid="cookie-reject-all"
        >
          {t("cookieReject")}
        </button>
        <button
          className="cookie-action cookie-action-ghost"
          onClick={onCustomize}
          type="button"
        >
          {t("cookieCustomize")}
        </button>
      </div>
    </div>
  );
}

interface CustomizePanelProps {
  titleId: string;
  draft: Record<ToggleableCategory, boolean>;
  gpc: boolean;
  onChange: (next: Record<ToggleableCategory, boolean>) => void;
  onSave: () => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onClose: () => void;
  closeRef: React.RefObject<HTMLButtonElement | null>;
}

function CustomizePanel({
  titleId,
  draft,
  gpc,
  onChange,
  onSave,
  onAcceptAll,
  onRejectAll,
  onClose,
  closeRef,
}: CustomizePanelProps) {
  const t = useTranslations("landing");

  const setCategory = (category: ToggleableCategory, value: boolean) => {
    onChange({ ...draft, [category]: value });
  };

  return (
    <div className="cookie-customize">
      <header className="cookie-customize-head">
        <h2 id={titleId}>{t("cookiePreferences")}</h2>
        <button
          ref={closeRef}
          className="cookie-customize-close"
          onClick={onClose}
          type="button"
          aria-label={t("cookieClose")}
        >
          ×
        </button>
      </header>
      <p className="cookie-customize-intro">{t("cookie")}</p>
      {gpc ? <p className="cookie-gpc-note">{t("cookieGpcNote")}</p> : null}

      <ul className="cookie-category-list">
        <li className="cookie-category">
          <div className="cookie-category-copy">
            <h3>{t("cookieCategories.necessary.title")}</h3>
            <p>{t("cookieCategories.necessary.description")}</p>
            <p className="cookie-category-note">{t("cookieNecessaryNote")}</p>
          </div>
          <span
            className="cookie-toggle cookie-toggle-on cookie-toggle-locked"
            aria-disabled="true"
            role="switch"
            aria-checked="true"
          >
            <span />
          </span>
        </li>
        {listNonNecessaryCategories().map((category) => (
          <li className="cookie-category" key={category}>
            <div className="cookie-category-copy">
              <h3>{t(`cookieCategories.${category}.title`)}</h3>
              <p>{t(`cookieCategories.${category}.description`)}</p>
            </div>
            <button
              className={`cookie-toggle ${draft[category] ? "cookie-toggle-on" : ""}`}
              onClick={() => setCategory(category, !draft[category])}
              type="button"
              role="switch"
              aria-checked={draft[category]}
              aria-label={t(`cookieCategories.${category}.title`)}
            >
              <span />
            </button>
          </li>
        ))}
      </ul>

      <div className="cookie-customize-actions">
        <button
          className="cookie-action cookie-action-ghost"
          onClick={onRejectAll}
          type="button"
        >
          {t("cookieReject")}
        </button>
        <button
          className="cookie-action cookie-action-ghost"
          onClick={onAcceptAll}
          type="button"
        >
          {t("cookieAccept")}
        </button>
        <button
          className="cookie-action cookie-action-primary"
          onClick={onSave}
          type="button"
        >
          {t("cookieSave")}
        </button>
      </div>
    </div>
  );
}
