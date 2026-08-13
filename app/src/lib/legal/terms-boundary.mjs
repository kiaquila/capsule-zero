export const safetyPolicyEffectiveAt = "2026-09-15T00:00:00.000Z";

export function resolveApplicableTermsVersion(at = new Date()) {
  return at.getTime() >= Date.parse(safetyPolicyEffectiveAt)
    ? "2026-09-15"
    : "2026-07-24";
}

export function normalizeTermsLocale(locale = "en") {
  return locale === "ru" ? "ru" : "en";
}

export function resolveApplicableTermsSelection(
  locale = "en",
  at = new Date(),
) {
  return {
    version: resolveApplicableTermsVersion(at),
    locale: normalizeTermsLocale(locale),
  };
}

export function shouldShowTermsUpdateNotice(at = new Date()) {
  return resolveApplicableTermsVersion(at) === "2026-07-24";
}
