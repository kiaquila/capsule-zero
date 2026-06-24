"use client";

import { useCallback, useSyncExternalStore } from "react";

export type CookieCategory = "necessary" | "preferences" | "analytics" | "marketing";

export interface CookieConsentPreferences {
  necessary: true;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
}

export interface CookieConsentState {
  decided: boolean;
  gpc: boolean;
  preferences: CookieConsentPreferences;
}

export const COOKIE_CONSENT_STORAGE_KEY = "capsule_zero_cookie_consent";
export const COOKIE_CONSENT_EVENT = "capsule-zero-cookie-consent";
export const COOKIE_CONSENT_OPEN_EVENT = "capsule-zero-cookie-consent-open";

const NON_NECESSARY_CATEGORIES: ReadonlyArray<Exclude<CookieCategory, "necessary">> = [
  "preferences",
  "analytics",
  "marketing",
];

const SERVER_STATE: CookieConsentState = {
  decided: false,
  gpc: false,
  preferences: emptyPreferences(),
};

function emptyPreferences(): CookieConsentPreferences {
  return {
    necessary: true,
    preferences: false,
    analytics: false,
    marketing: false,
    decidedAt: "",
  };
}

function detectGpc(): boolean {
  if (typeof navigator === "undefined") return false;
  const candidate = navigator as Navigator & { globalPrivacyControl?: boolean };
  return candidate.globalPrivacyControl === true;
}

export function defaultPreferences(gpc: boolean = detectGpc()): CookieConsentPreferences {
  const base = emptyPreferences();
  if (!gpc) {
    return base;
  }
  return { ...base, analytics: false, marketing: false };
}

function isPreferences(value: unknown): value is CookieConsentPreferences {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    record.necessary === true &&
    typeof record.preferences === "boolean" &&
    typeof record.analytics === "boolean" &&
    typeof record.marketing === "boolean" &&
    typeof record.decidedAt === "string"
  );
}

function readState(): CookieConsentState {
  if (typeof window === "undefined") return SERVER_STATE;

  const gpc = detectGpc();
  const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);

  if (!raw) {
    return { decided: false, gpc, preferences: defaultPreferences(gpc) };
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isPreferences(parsed)) {
      return { decided: false, gpc, preferences: defaultPreferences(gpc) };
    }
    return { decided: parsed.decidedAt.length > 0, gpc, preferences: parsed };
  } catch {
    return { decided: false, gpc, preferences: defaultPreferences(gpc) };
  }
}

let cachedState: CookieConsentState | null = null;
let cachedSnapshot = "";

function getSnapshot(): CookieConsentState {
  const next = readState();
  const serialized = JSON.stringify(next);
  if (serialized === cachedSnapshot && cachedState) {
    return cachedState;
  }
  cachedState = next;
  cachedSnapshot = serialized;
  return next;
}

function getServerSnapshot(): CookieConsentState {
  return SERVER_STATE;
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(COOKIE_CONSENT_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(COOKIE_CONSENT_EVENT, callback);
  };
}

function emit() {
  cachedState = null;
  cachedSnapshot = "";
  window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT));
}

function persist(preferences: CookieConsentPreferences) {
  window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(preferences));
  emit();
}

export function savePreferences(input: Partial<Omit<CookieConsentPreferences, "necessary" | "decidedAt">>) {
  if (typeof window === "undefined") return;
  const current = readState().preferences;
  const next: CookieConsentPreferences = {
    necessary: true,
    preferences: input.preferences ?? current.preferences,
    analytics: input.analytics ?? current.analytics,
    marketing: input.marketing ?? current.marketing,
    decidedAt: new Date().toISOString(),
  };
  persist(next);
}

export function acceptAll() {
  if (typeof window === "undefined") return;
  persist({
    necessary: true,
    preferences: true,
    analytics: true,
    marketing: true,
    decidedAt: new Date().toISOString(),
  });
}

export function rejectAll() {
  if (typeof window === "undefined") return;
  persist({
    necessary: true,
    preferences: false,
    analytics: false,
    marketing: false,
    decidedAt: new Date().toISOString(),
  });
}

export function openCookieSettings() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(COOKIE_CONSENT_OPEN_EVENT));
}

/**
 * Read cookie-consent state in a React component. Future analytics / marketing
 * tags MUST gate themselves on `hasConsent(category)` before initializing — the
 * hook is the single read path so consent stays in sync across surfaces.
 */
export function useCookieConsent() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const hasConsent = useCallback(
    (category: CookieCategory) => state.preferences[category] === true,
    [state.preferences],
  );

  return {
    decided: state.decided,
    gpc: state.gpc,
    preferences: state.preferences,
    hasConsent,
  };
}

export function listNonNecessaryCategories() {
  return NON_NECESSARY_CATEGORIES;
}
