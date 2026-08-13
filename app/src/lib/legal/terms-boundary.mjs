export const safetyPolicyEffectiveAt = "2026-09-15T00:00:00.000Z";

export function resolveApplicableTermsVersion(at = new Date()) {
  return at.getTime() >= Date.parse(safetyPolicyEffectiveAt)
    ? "2026-09-15"
    : "2026-07-24";
}

export function shouldShowTermsUpdateNotice(at = new Date()) {
  return resolveApplicableTermsVersion(at) === "2026-07-24";
}
