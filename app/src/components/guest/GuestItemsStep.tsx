"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import {
  COLOR_HEX,
  type GuestItem,
  ROLE_ORDER,
  imageOf,
} from "@/features/guest/catalog";
import { type Evaluation, missingRoles } from "@/features/guest/outfits";
import type { PaywallKind } from "./GuestPaywall";

interface Props {
  pool: GuestItem[];
  picked: string[];
  pickedItems: GuestItem[];
  evaluation: Evaluation;
  onToggle: (id: string) => void;
  onPaywall: (kind: PaywallKind) => void;
  onBack: () => void;
  onNext: () => void;
}

// Растущий счётчик образов: при каждом прибавлении коротко показываем «+N».
function useDelta(count: number) {
  const prev = useRef(count);
  const [delta, setDelta] = useState<{ value: number; key: number } | null>(
    null,
  );
  useEffect(() => {
    const diff = count - prev.current;
    prev.current = count;
    // Delta is derived from the previous rendered count for the reference animation.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (diff > 0) setDelta({ value: diff, key: Date.now() });
  }, [count]);
  return delta;
}

export function GuestItemsStep(props: Props) {
  const {
    pool,
    picked,
    pickedItems,
    evaluation,
    onToggle,
    onPaywall,
    onBack,
    onNext,
  } = props;
  const t = useTranslations("guest");
  const locale = useLocale() as "ru" | "en";
  const delta = useDelta(evaluation.count);
  const missing = missingRoles(pickedItems);
  const roles = ROLE_ORDER.filter((r) => pool.some((x) => x.role === r));

  return (
    <section className="guest-items" data-testid="guest-step-items">
      <p className="guest-eyebrow">{t("itemsEyebrow")}</p>
      <h1 className="guest-title">{t("itemsTitle")}</h1>
      <p className="guest-lead">{t("itemsLead")}</p>

      <div className="guest-own">
        <button
          type="button"
          className="guest-own-tile"
          onClick={() => onPaywall("photos")}
          data-testid="guest-own-photos"
        >
          <span className="guest-own-plus" aria-hidden="true">
            +
          </span>
          <span className="guest-own-text">
            <strong>{t("ownPhotos")}</strong>
            <small>{t("ownPhotosHint")}</small>
          </span>
          <span className="guest-paid">{t("paid")}</span>
        </button>
        <button
          type="button"
          className="guest-own-tile"
          onClick={() => onPaywall("pile")}
          data-testid="guest-own-pile"
        >
          <span className="guest-own-plus" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="3" y="7" width="18" height="13" rx="2" />
              <path d="M8 7l1.5-2.5h5L16 7" />
              <circle cx="12" cy="13.5" r="3.5" />
            </svg>
          </span>
          <span className="guest-own-text">
            <strong>{t("ownPile")}</strong>
            <small>{t("ownPileHint")}</small>
          </span>
          <span className="guest-paid">{t("paid")}</span>
        </button>
      </div>

      {roles.map((role) => (
        <div key={role} className="guest-section">
          <h2 className="guest-section-title">{t(`role.${role}`)}</h2>
          <div className="guest-grid">
            {pool
              .filter((x) => x.role === role)
              .map((x) => {
                const on = picked.includes(x.id);
                return (
                  <button
                    key={x.id}
                    type="button"
                    className={`guest-tile${on ? " is-on" : ""}`}
                    aria-pressed={on}
                    onClick={() => onToggle(x.id)}
                    data-testid={`guest-item-${x.id}`}
                  >
                    <span className="guest-tile-img">
                      <img src={imageOf(x.id)} alt="" loading="lazy" />
                    </span>
                    <span className="guest-tile-name">
                      <i
                        style={{ background: COLOR_HEX[x.colorId] }}
                        aria-hidden="true"
                      />
                      {x.name[locale]}
                    </span>
                    <span className="guest-check" aria-hidden="true">
                      <svg
                        viewBox="0 0 16 16"
                        width="12"
                        height="12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M3.5 8.5l3 3 6-7" />
                      </svg>
                    </span>
                  </button>
                );
              })}
          </div>
        </div>
      ))}

      <div className="guest-bar" data-testid="guest-bar">
        <div className="guest-bar-count">
          <strong data-testid="guest-count">{evaluation.count}</strong>
          <span>
            {t("barOutfits", { count: evaluation.count })}
            <br />
            <small>{t("barItems", { count: picked.length })}</small>
          </span>
          {delta ? (
            <em key={delta.key} className="guest-delta">
              +{delta.value}
            </em>
          ) : null}
        </div>
        {evaluation.count > 0 ? (
          <button
            type="button"
            className="guest-cta"
            onClick={onNext}
            data-testid="guest-next"
          >
            {t("barCta")}
          </button>
        ) : (
          <p className="guest-bar-hint">
            {picked.length === 0
              ? t("hintStart")
              : t("hintMissing", {
                  roles: missing.map((r) => t(`need.${r}`)).join(", "),
                })}
          </p>
        )}
      </div>
      <button
        type="button"
        className="guest-link guest-back"
        data-testid="guest-back"
        onClick={onBack}
      >
        {t("back")}
      </button>
    </section>
  );
}
