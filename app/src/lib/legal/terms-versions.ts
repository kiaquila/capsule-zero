import { legalDocuments, type LegalDocument } from "../legal-content";
import {
  resolveApplicableTermsVersion,
  type TermsVersion,
} from "./terms-boundary.mjs";
import { currentTermsDocument } from "./terms-2026-07-24";
import { futureTermsDocumentRu } from "./terms-2026-09-15-ru";

type TermsLocale = "en" | "ru";

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

function normalizeTermsLocale(locale: string): TermsLocale {
  return locale === "ru" ? "ru" : "en";
}

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
  return getTermsDocument(resolveApplicableTermsVersion(at), locale);
}
