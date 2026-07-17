import { useTranslations } from "next-intl";

const STUB_STEPS = [1, 2, 3] as const;

/**
 * Reserved "How it works" section — a placeholder that sits strictly below the
 * first viewport (design-system §9.11(d)). Content is post-MVP (PRODUCT-PLAN
 * Этап 1 п.1); kept as its own component so the throwaway placeholder stays
 * isolated from the shipping hero.
 */
export function LandingSlidesStub() {
  const t = useTranslations("landing");

  return (
    <section className="landing-slides-stub" data-testid="slides-stub">
      <div className="landing-stub-head">
        <h2>{t("howItWorksTitle")}</h2>
      </div>
      <div className="landing-stub-grid">
        {STUB_STEPS.map((step) => (
          <article className="landing-stub-card" key={step}>
            <span className="landing-stub-number">
              {String(step).padStart(2, "0")}
            </span>
            <p>{t("stubReserved", { step })}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
