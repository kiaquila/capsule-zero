import type { LegalDocument } from "../legal-content";
import { communityGuidelines } from "./community-guidelines";
import { copyrightPolicy } from "./copyright-policy";
import { enforcementPolicy } from "./enforcement-policy";

export type PolicyDocumentSlug =
  | "community-guidelines"
  | "copyright-policy"
  | "enforcement-policy";

export const policyDocuments: Record<PolicyDocumentSlug, LegalDocument> = {
  "community-guidelines": communityGuidelines,
  "copyright-policy": copyrightPolicy,
  "enforcement-policy": enforcementPolicy,
};
