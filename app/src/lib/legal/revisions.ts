import { safetyPolicyEffectiveAt } from "./terms-boundary.mjs";

export const safetyPolicyRevision = {
  publishedOn: "2026-08-13",
  lastUpdated: "August 13, 2026",
  effectiveDate: "September 15, 2026",
  effectiveAt: safetyPolicyEffectiveAt,
  priorEffectiveOn: "2026-07-24",
  priorEffectiveDate: "July 24, 2026",
} as const;

export const privacyPolicyRevision = {
  publishedOn: "2026-08-13",
  lastUpdated: "August 13, 2026",
  effectiveDate: "August 13, 2026",
} as const;
