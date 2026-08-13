export const safetyPolicyEffectiveAt: "2026-09-15T00:00:00.000Z";

export type TermsVersion = "2026-07-24" | "2026-09-15";
export type TermsLocale = "en" | "ru";

export interface ApplicableTermsSelection {
  version: TermsVersion;
  locale: TermsLocale;
}

export function resolveApplicableTermsVersion(at?: Date): TermsVersion;

export function normalizeTermsLocale(locale?: string): TermsLocale;

export function resolveApplicableTermsSelection(
  locale?: string,
  at?: Date,
): ApplicableTermsSelection;

export function shouldShowTermsUpdateNotice(at?: Date): boolean;
