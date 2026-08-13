export const safetyPolicyEffectiveAt: "2026-09-15T00:00:00.000Z";

export type TermsVersion = "2026-07-24" | "2026-09-15";

export function resolveApplicableTermsVersion(at?: Date): TermsVersion;

export function shouldShowTermsUpdateNotice(at?: Date): boolean;
