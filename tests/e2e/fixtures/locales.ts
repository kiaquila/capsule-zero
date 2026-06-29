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
    signUpTab: "Sign Up",
    logInTab: "Log In",
    close: "Close",
  },
  ru: {
    signUpTab: "Зарегистрироваться",
    logInTab: "Войти",
    close: "Закрыть",
  },
} as const satisfies Record<Locale, Record<string, string>>;
