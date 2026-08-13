import type { LegalDocumentSlug } from "../legal-content";
import { legalContacts } from "./contacts";
import { safetyPolicyRevision } from "./revisions";

export const policyLastUpdated = safetyPolicyRevision.lastUpdated;
export const policyEffectiveDate = safetyPolicyRevision.effectiveDate;
export const policySupportEmail = legalContacts.supportEmail;
export const policyLegalEmail = legalContacts.legalEmail;
export const policyIpEmail = legalContacts.ipEmail;

export function relatedPolicy(
  href: `/${LegalDocumentSlug}`,
  label: string,
) {
  return { href, label };
}
