"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { COLOR_HEX, type GuestItem, imageOf } from "@/features/guest/catalog";
import type { Evaluation, Recommendation } from "@/features/guest/outfits";
import { OutfitCard } from "./OutfitCard";

interface Props {
  evaluation: Evaluation;
  pickedItems: GuestItem[];
  recommendations: Recommendation[];
  onAdd: (id: string) => void;
  onEdit: () => void;
  onSave: () => void;
}

const FIRST = 6;

export function GuestResultStep(props: Props) {
  const { evaluation, pickedItems, recommendations, onAdd, onEdit, onSave } =
    props;
  const t = useTranslations("guest");
  const locale = useLocale() as "ru" | "en";
  const [all, setAll] = useState(false);
  const shown = all ? evaluation.outfits : evaluation.outfits.slice(0, FIRST);
  const palette = [...new Set(pickedItems.map((x) => x.colorId))];
  const name = (x: GuestItem) => x.name[locale];

  return (
    <section className="guest-result" data-testid="guest-step-result">
      <div className="guest-hero">
        <p className="guest-eyebrow">{t("resultEyebrow")}</p>
        <p className="guest-hero-number" data-testid="guest-result-count">
          {evaluation.count}
        </p>
        <h1 className="guest-hero-title">
          {t("resultTitle", {
            outfits: evaluation.count,
            items: evaluation.countedItems,
          })}
        </h1>
        <div className="guest-hero-meta">
          <span className="guest-chip">
            {t("resultOpr", {
              opr: evaluation.opr
                .toFixed(1)
                .replace(".", locale === "ru" ? "," : "."),
            })}
          </span>
          <span className="guest-palette" aria-label={t("palette")}>
            {palette.map((c) => (
              <i key={c} style={{ background: COLOR_HEX[c] }} />
            ))}
          </span>
        </div>
        <p className="guest-lead">{t("resultLead")}</p>
      </div>

      {evaluation.conflicts.length > 0 ? (
        <div className="guest-conflict" data-testid="guest-conflicts">
          <strong>{t("conflictTitle")}</strong>
          <ul>
            {evaluation.conflicts.slice(0, 3).map(([a, b]) => (
              <li key={`${a.id}-${b.id}`}>
                {t("conflictPair", {
                  a: name(a),
                  b: locale === "ru" ? name(b).toLowerCase() : name(b),
                })}
              </li>
            ))}
          </ul>
          <small>{t("conflictNote")}</small>
        </div>
      ) : null}

      <div className="guest-gallery">
        {shown.map((o, i) => (
          <OutfitCard
            key={o.key}
            outfit={o}
            label={t("outfitN", { n: i + 1 })}
          />
        ))}
      </div>
      {evaluation.outfits.length > FIRST && !all ? (
        <button
          type="button"
          className="guest-ghost guest-showall"
          onClick={() => setAll(true)}
        >
          {t("showAll", { count: evaluation.outfits.length })}
        </button>
      ) : null}

      {recommendations.length > 0 ? (
        <div className="guest-panel" data-testid="guest-reco">
          <h2 className="guest-panel-title">{t("recoTitle")}</h2>
          <p className="guest-panel-lead">{t("recoLead")}</p>
          <div className="guest-reco-list">
            {recommendations.map(({ item, gain }) => (
              <div key={item.id} className="guest-reco">
                <span className="guest-reco-img">
                  <img src={imageOf(item.id)} alt="" />
                </span>
                <span className="guest-reco-text">
                  <strong>{name(item)}</strong>
                  <em>{t("recoGain", { count: gain })}</em>
                </span>
                <button
                  type="button"
                  className="guest-ghost guest-ghost-sm"
                  onClick={() => onAdd(item.id)}
                  data-testid={`guest-reco-add-${item.id}`}
                >
                  {t("recoHave")}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="guest-panel guest-save" data-testid="guest-save">
        <h2 className="guest-panel-title">{t("saveTitle")}</h2>
        <ul className="guest-save-list">
          <li>{t("saveBullet1")}</li>
          <li>{t("saveBullet2")}</li>
          <li>{t("saveBullet3")}</li>
        </ul>
        <button
          type="button"
          className="guest-cta guest-cta-wide"
          onClick={onSave}
          data-testid="guest-save-cta"
        >
          {t("saveCta")}
        </button>
        <p className="guest-note">{t("saveNote")}</p>
      </div>

      <button type="button" className="guest-link guest-back" onClick={onEdit}>
        {t("editItems")}
      </button>
    </section>
  );
}
