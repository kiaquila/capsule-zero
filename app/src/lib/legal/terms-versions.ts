import { legalDocuments, type LegalDocument } from "../legal-content";
import { currentTermsDocumentRu } from "./terms-current-ru";
import { currentTermsDocument as archivedTermsDocument } from "./terms-2026-07-24";

const currentTermsByLocale: Record<"en" | "ru", LegalDocument> = {
  en: legalDocuments["terms-of-use"],
  ru: currentTermsDocumentRu,
};

export function getTermsDocument(locale = "en"): LegalDocument {
  return currentTermsByLocale[locale === "ru" ? "ru" : "en"];
}

export function getArchivedTermsDocument(): LegalDocument {
  return archivedTermsDocument;
}
