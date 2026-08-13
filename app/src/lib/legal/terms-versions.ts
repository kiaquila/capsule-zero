import { legalDocuments, type LegalDocument } from "../legal-content";
import {
  resolveApplicableTermsVersion,
  type TermsVersion,
} from "./revisions";
import { currentTermsDocument } from "./terms-2026-07-24";

const termsByVersion: Record<TermsVersion, LegalDocument> = {
  "2026-07-24": currentTermsDocument,
  "2026-09-15": legalDocuments["terms-of-use"],
};

export function getTermsDocument(version: TermsVersion): LegalDocument {
  return termsByVersion[version];
}

export function getApplicableTermsDocument(at: Date = new Date()): LegalDocument {
  return getTermsDocument(resolveApplicableTermsVersion(at));
}
