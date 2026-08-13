import { legalDocuments, type LegalDocument } from "../legal-content";
import {
  normalizeTermsLocale,
  resolveApplicableTermsSelection,
  type TermsLocale,
  type TermsVersion,
} from "./terms-boundary.mjs";
import { currentTermsDocument } from "./terms-2026-07-24";
import { futureTermsDocumentRu } from "./terms-2026-09-15-ru";

const termsByVersionAndLocale: Record<
  TermsVersion,
  Record<TermsLocale, LegalDocument>
> = {
  "2026-07-24": {
    en: currentTermsDocument,
    ru: currentTermsDocument,
  },
  "2026-09-15": {
    en: legalDocuments["terms-of-use"],
    ru: futureTermsDocumentRu,
  },
};

export function getTermsDocument(
  version: TermsVersion,
  locale = "en",
): LegalDocument {
  return termsByVersionAndLocale[version][normalizeTermsLocale(locale)];
}

export function getApplicableTermsDocument(
  locale = "en",
  at: Date = new Date(),
): LegalDocument {
  const selection = resolveApplicableTermsSelection(locale, at);
  return getTermsDocument(selection.version, selection.locale);
}
