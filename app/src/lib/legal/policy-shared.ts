import type { LegalDocumentSlug } from "../legal-content";

export const policyLastUpdated = "August 12, 2026";
export const policyEffectiveDate = "August 12, 2026";
export const policySupportEmail = "support@capsulezero.com";
export const policyLegalEmail = "legal@capsulezero.com";
export const policyIpEmail = "ip@capsulezero.com";

export function relatedPolicy(
  href: `/${LegalDocumentSlug}`,
  label: string,
) {
  return { href, label };
}
