import type { LegalDocument } from "../legal-content";
import { communityGuidelines } from "./community-guidelines";
import { communityGuidelinesRu } from "./community-guidelines-ru";
import { copyrightPolicy } from "./copyright-policy";
import { copyrightPolicyRu } from "./copyright-policy-ru";
import { enforcementPolicy } from "./enforcement-policy";
import { enforcementPolicyRu } from "./enforcement-policy-ru";

export type PolicyDocumentSlug =
  | "community-guidelines"
  | "copyright-policy"
  | "enforcement-policy";

const policyDocuments: Record<"en" | "ru", Record<PolicyDocumentSlug, LegalDocument>> = {
  en: {
    "community-guidelines": communityGuidelines,
    "copyright-policy": copyrightPolicy,
    "enforcement-policy": enforcementPolicy,
  },
  ru: {
    "community-guidelines": communityGuidelinesRu,
    "copyright-policy": copyrightPolicyRu,
    "enforcement-policy": enforcementPolicyRu,
  },
};

export function getPolicyDocument(slug: PolicyDocumentSlug, locale: string) {
  return policyDocuments[locale === "ru" ? "ru" : "en"][slug];
}
