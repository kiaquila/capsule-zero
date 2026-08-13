import type { LegalDocumentSlug } from "../legal-content";
import { legalContacts } from "./contacts";

export const policyLastUpdated = "August 12, 2026";
export const policyEffectiveDate = "August 12, 2026";
export const policySupportEmail = legalContacts.supportEmail;
export const policyLegalEmail = legalContacts.legalEmail;
export const policyIpEmail = legalContacts.ipEmail;

export function relatedPolicy(
  href: `/${LegalDocumentSlug}`,
  label: string,
) {
  return { href, label };
}
