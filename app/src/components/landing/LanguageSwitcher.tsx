"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const localeCodes: Record<AppLocale, string> = {
  en: "EN",
  ru: "RU",
};

export function LanguageSwitcher() {
  const t = useTranslations("language");
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const selectLocale = (nextLocale: AppLocale) => {
    setOpen(false);
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <div className={cn("language-switcher", open && "language-switcher-open")}>
      <button
        aria-expanded={open}
        aria-label={t("label")}
        className="language-trigger"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <GlobeIcon />
        <span>{localeCodes[locale]}</span>
        <span aria-hidden="true" className="language-chevron">
          ▾
        </span>
      </button>
      <div className="language-menu">
        {routing.locales.map((nextLocale) => (
          <button
            className={cn("language-option", nextLocale === locale && "language-option-active")}
            key={nextLocale}
            onClick={() => selectLocale(nextLocale)}
            type="button"
          >
            <span>{t(nextLocale)}</span>
            <span className="language-code">{localeCodes[nextLocale]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function GlobeIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="14" viewBox="0 0 24 24" width="14">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 12h20" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      <path
        d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}
