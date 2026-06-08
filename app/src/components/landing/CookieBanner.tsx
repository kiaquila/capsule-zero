"use client";

import { useTranslations } from "next-intl";
import { useSyncExternalStore, type CSSProperties } from "react";

const COOKIE_STORAGE_KEY = "capsule_zero_cookie_banner";
const COOKIE_EVENT = "capsule-zero-cookie-banner";
const elevatedGlassStyle = {
  backdropFilter: "blur(64px) saturate(118%)",
  WebkitBackdropFilter: "blur(64px) saturate(118%)",
} satisfies CSSProperties;

export function CookieBanner() {
  const t = useTranslations("landing");
  const cookieState = useSyncExternalStore(
    subscribeToCookieState,
    getCookieState,
    getServerCookieState,
  );

  const accept = () => {
    localStorage.setItem(COOKIE_STORAGE_KEY, "accepted");
    window.dispatchEvent(new Event(COOKIE_EVENT));
  };

  if (cookieState === "accepted") {
    return null;
  }

  return (
    <aside className="cookie-banner glass" style={elevatedGlassStyle} aria-live="polite">
      <p>{t("cookie")}</p>
      <div className="cookie-actions">
        <button className="cookie-accept" onClick={accept} type="button">
          {t("cookieAccept")}
        </button>
        <button className="cookie-settings" onClick={accept} type="button">
          {t("cookieSettings")}
        </button>
      </div>
    </aside>
  );
}

function subscribeToCookieState(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(COOKIE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(COOKIE_EVENT, callback);
  };
}

function getCookieState() {
  return localStorage.getItem(COOKIE_STORAGE_KEY) === "accepted"
    ? "accepted"
    : "pending";
}

function getServerCookieState() {
  return "pending";
}
