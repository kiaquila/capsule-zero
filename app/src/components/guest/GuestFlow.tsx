"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { LanguageSwitcher } from "@/components/landing/LanguageSwitcher";
import {
  type GuestWardrobe,
  catalogFor,
  findItem,
} from "@/features/guest/catalog";
import { evaluate, recommend } from "@/features/guest/outfits";
import { GuestItemsStep } from "./GuestItemsStep";
import { GuestResultStep } from "./GuestResultStep";
import { GuestPaywall, type PaywallKind } from "./GuestPaywall";

import { EMPTY, loadGuestState, type Step } from "@/features/guest/state";

export function GuestFlow() {
  const t = useTranslations("guest");
  const locale = useLocale();
  const [state, setState] = useState(loadGuestState);
  const [paywall, setPaywall] = useState<PaywallKind | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem("cz-guest-v1", JSON.stringify(state));
    } catch {
      /* приватный режим — просто не запоминаем */
    }
  }, [state]);

  useEffect(() => {
    if (!authOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAuthOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", close);
    };
  }, [authOpen]);

  const pool = useMemo(
    () => (state.wardrobe ? catalogFor(state.wardrobe) : []),
    [state.wardrobe],
  );
  const pickedItems = useMemo(
    () =>
      state.picked.map(findItem).filter(Boolean) as NonNullable<
        ReturnType<typeof findItem>
      >[],
    [state.picked],
  );
  const evaluation = useMemo(() => evaluate(pickedItems), [pickedItems]);
  const recommendations = useMemo(
    () => recommend(pickedItems, pool),
    [pickedItems, pool],
  );

  const go = (step: Step) => {
    setState((s) => ({ ...s, step }));
    window.scrollTo({ top: 0 });
  };
  const toggle = (id: string) =>
    setState((s) => ({
      ...s,
      picked: s.picked.includes(id)
        ? s.picked.filter((x) => x !== id)
        : [...s.picked, id],
    }));
  const add = (id: string) =>
    setState((s) =>
      s.picked.includes(id) ? s : { ...s, picked: [...s.picked, id] },
    );
  const restart = () => {
    setState(EMPTY);
    window.scrollTo({ top: 0 });
  };

  const stepIndex = { type: 0, items: 1, result: 2 }[state.step];

  return (
    <div className={`cz-page guest-page${authOpen ? " is-auth" : ""}`}>
      <div className="wallpaper-bg" />
      <div className="wallpaper-overlay" />

      <header className="guest-header">
        <a className="landing-logo" href={`/${locale}`}>
          Capsule Zero
        </a>
        <div className="guest-header-actions">
          <LanguageSwitcher />
          {state.step !== "type" ? (
            <button
              className="guest-link"
              type="button"
              onClick={restart}
              data-testid="guest-restart"
            >
              {t("restart")}
            </button>
          ) : null}
        </div>
      </header>

      <ol className="guest-progress" aria-label={t("progressLabel")}>
        {(["stepType", "stepItems", "stepResult"] as const).map((key, i) => (
          <li
            key={key}
            className={
              i === stepIndex
                ? "is-current"
                : i < stepIndex
                  ? "is-done"
                  : undefined
            }
          >
            <span>{i + 1}</span>
            {t(key)}
          </li>
        ))}
      </ol>

      <main className="guest-main">
        {state.step === "type" ? (
          <section className="guest-type" data-testid="guest-step-type">
            <p className="guest-eyebrow">{t("typeEyebrow")}</p>
            <h1 className="guest-title">{t("typeTitle")}</h1>
            <p className="guest-lead">{t("typeLead")}</p>
            <div className="guest-type-grid">
              {(["female", "male", "mixed"] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  className="guest-type-card"
                  data-testid={`guest-type-${w}`}
                  onClick={() =>
                    setState((s) => ({
                      step: "items",
                      wardrobe: w,
                      picked: s.wardrobe === w ? s.picked : [],
                    }))
                  }
                >
                  <span className="guest-type-preview" aria-hidden="true">
                    <img
                      src={`/catalog/${w === "female" ? "w-dress-black" : w === "male" ? "m-polo-navy" : "w-shirt-white"}.webp`}
                      alt=""
                    />
                    <img
                      src={`/catalog/${w === "female" ? "w-loafers-black" : "m-sneakers-white"}.webp`}
                      alt=""
                    />
                  </span>
                  <span className="guest-type-name">
                    {t(
                      w === "female"
                        ? "typeFemale"
                        : w === "male"
                          ? "typeMale"
                          : "typeMixed",
                    )}
                  </span>
                </button>
              ))}
            </div>
            <p className="guest-note">{t("typeNote")}</p>
          </section>
        ) : state.step === "items" && state.wardrobe ? (
          <GuestItemsStep
            pool={pool}
            picked={state.picked}
            evaluation={evaluation}
            pickedItems={pickedItems}
            onToggle={toggle}
            onPaywall={setPaywall}
            onBack={() => go("type")}
            onNext={() => go("result")}
          />
        ) : (
          <GuestResultStep
            evaluation={evaluation}
            pickedItems={pickedItems}
            recommendations={recommendations}
            onAdd={add}
            onEdit={() => go("items")}
            onSave={() => setAuthOpen(true)}
          />
        )}
      </main>

      {paywall ? (
        <GuestPaywall kind={paywall} onClose={() => setPaywall(null)} />
      ) : null}

      {authOpen ? (
        <div
          className="guest-auth-backdrop"
          data-testid="auth-popover"
          onClick={() => setAuthOpen(false)}
        >
          <div className="guest-auth-box" onClick={(e) => e.stopPropagation()}>
            <AuthPanel
              initialMode="signUp"
              onClose={() => setAuthOpen(false)}
              variant="popup"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
