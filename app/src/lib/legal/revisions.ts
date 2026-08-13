export const safetyPolicyRevision = {
  lastUpdated: "August 13, 2026",
  effectiveDate: "September 15, 2026",
  effectiveAt: "2026-09-15T00:00:00.000Z",
  priorEffectiveDate: "July 24, 2026",
} as const;

export type TermsVersion = "2026-07-24" | "2026-09-15";

export function resolveApplicableTermsVersion(
  at: Date = new Date(),
): TermsVersion {
  return at.getTime() >= Date.parse(safetyPolicyRevision.effectiveAt)
    ? "2026-09-15"
    : "2026-07-24";
}

export function shouldShowTermsUpdateNotice(at: Date = new Date()): boolean {
  return resolveApplicableTermsVersion(at) === "2026-07-24";
}

export const privacyPolicyRevision = {
  lastUpdated: "August 13, 2026",
  effectiveDate: "August 13, 2026",
} as const;
