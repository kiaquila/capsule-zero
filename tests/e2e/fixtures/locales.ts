// Canonical strings sourced from /app/src/messages/{en,ru}.json.
// Use these in specs instead of inline string literals so a copy edit in
// /app does not cascade into many test files.

export type Locale = "en" | "ru";

export const LOCALES: readonly Locale[] = ["en", "ru"] as const;

export const landingCopy = {
  en: {
    authCta: "Log In",
    cookieAccept: "Accept all",
    cookieReject: "Reject all",
    cookieCustomize: "Customize",
  },
  ru: {
    authCta: "Войти",
    cookieAccept: "Принять все",
    cookieReject: "Отклонить все",
    cookieCustomize: "Настроить",
  },
} as const satisfies Record<Locale, Record<string, string>>;

export const authCopy = {
  en: {
    signInTitle: "Log In",
    signUpTitle: "Create Account",
    logInTab: "Log In",
    close: "Close",
  },
  ru: {
    signInTitle: "Вход",
    signUpTitle: "Регистрация",
    logInTab: "Войти",
    close: "Закрыть",
  },
} as const satisfies Record<Locale, Record<string, string>>;

export const journeyCopy = {
  en: {
    linkUnavailable:
      "Link import is temporarily unavailable while we complete the required compliance and legal review. Upload a photo or choose from the Capsule Zero preset catalog instead.",
    linkTab: "Paste Links",
    searchTab: "Search Catalog",
  },
  ru: {
    linkUnavailable:
      "Импорт по ссылкам временно недоступен, пока мы завершаем обязательную проверку соответствия требованиям и юридическую проверку. Загрузите фото или выберите вещь из каталога Capsule Zero.",
    linkTab: "Вставить ссылки",
    searchTab: "Поиск в каталоге",
  },
} as const satisfies Record<Locale, Record<string, string>>;

// The live legal documents are currently shared across EN/RU routes. Keep
// unavoidable legal-copy assertions here so policy edits have one test source.
export const legalCopy = {
  termsMarketplaceImportGate:
    "Marketplace link import and the shared user-import catalog are not currently available. We will not activate them unless and until a dedicated compliance-scheme specification is complete and an external legal review has approved the launch controls.",
  privacyMarketplaceImportGate:
    "Capsule Zero does not currently collect or process marketplace URLs, parsed item candidates, or marketplace source-site metadata because marketplace link import is disabled.",
  termsMonetizationHold:
    "Capsule Zero does not currently sell subscriptions, coins, credits, or other paid digital features, and no payment provider is active for the Service.",
  privacyMonetizationHold:
    "Capsule Zero does not currently collect billing, invoice, or payment-provider data because no monetization or payment flow is active.",
  privacyDormantLegacyBalance:
    "Existing production profiles may still contain a dormant legacy coin-balance field initialized by our account system. It cannot be purchased, spent, or used to unlock features, and no coin transaction ledger is created while the hold remains active.",
  retiredMonetizationClaims: [
    "Lava.top",
    "purchasing coins",
    "coin economy",
    "paid coin features",
  ],
  activeMarketplaceImportClaims: [
    "The Service lets you import item information from third-party product URLs",
    "Marketplace import is best-effort",
    "Marketplace URLs you submit",
    "Best-effort parsing of product URLs into structured item data",
  ],
} as const;
