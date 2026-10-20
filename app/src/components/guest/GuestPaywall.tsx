"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export type PaywallKind = "photos" | "pile";

// Свои фото и «вся куча одним кадром» требуют распознавания — это стоит денег, поэтому честно платно.
// Модель монетизации ещё не выбрана (PRODUCT-PLAN, Этап 4), поэтому без цены и без оплаты — только запись интереса.
export function GuestPaywall({
  kind,
  onClose,
}: {
  kind: PaywallKind;
  onClose: () => void;
}) {
  const t = useTranslations("guest");
  const [noted, setNoted] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const { style } = document.body;
    const prev = style.overflow;
    style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      style.overflow = prev;
    };
  }, [onClose]);

  const want = () => {
    try {
      window.localStorage.setItem(
        `cz-paid-interest-${kind}`,
        new Date().toISOString(),
      );
    } catch {
      /* ignore */
    }
    setNoted(true);
  };

  return (
    <div
      className="guest-sheet-backdrop"
      onClick={onClose}
      data-testid="guest-paywall"
    >
      <div
        className="guest-sheet"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="guest-paid">{t("paid")}</span>
        <h2 className="guest-panel-title">
          {t(kind === "photos" ? "payPhotosTitle" : "payPileTitle")}
        </h2>
        <p className="guest-panel-lead">
          {t(kind === "photos" ? "payPhotosText" : "payPileText")}
        </p>
        <p className="guest-note">{t("payWhy")}</p>
        {noted ? (
          <p className="guest-noted" data-testid="guest-paywall-noted">
            {t("payNoted")}
          </p>
        ) : (
          <button
            type="button"
            className="guest-ghost guest-ghost-wide"
            onClick={want}
          >
            {t("payWant")}
          </button>
        )}
        <button
          type="button"
          className="guest-cta guest-cta-wide"
          data-testid="guest-paywall-back"
          onClick={onClose}
        >
          {t("payBack")}
        </button>
      </div>
    </div>
  );
}
