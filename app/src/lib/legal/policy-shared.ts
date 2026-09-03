import type { LegalDocumentSlug } from "../legal-content";
import { legalContacts } from "./contacts";
import {
  privacyPolicyRevision,
  safetyPolicyRevision,
} from "./revisions";

export const policySupportEmail = legalContacts.supportEmail;
export const policyLegalEmail = legalContacts.legalEmail;
export const policyIpEmail = legalContacts.ipEmail;

const monthNames = {
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  ru: [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
  ],
} as const;

export function formatPolicyDate(
  isoDate: string,
  locale: "en" | "ru",
): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const monthName = monthNames[locale][(month ?? 1) - 1];
  return locale === "ru"
    ? `${day} ${monthName} ${year} г.`
    : `${monthName} ${day}, ${year}`;
}

export const policyLastUpdated = formatPolicyDate(
  safetyPolicyRevision.publishedOn,
  "en",
);
export const policyEffectiveDate = formatPolicyDate(
  safetyPolicyRevision.effectiveOn,
  "en",
);

export function policyRevisionDates(locale: "en" | "ru") {
  return formatRevisionDates(safetyPolicyRevision, locale);
}

export function privacyRevisionDates(locale: "en" | "ru") {
  return formatRevisionDates(privacyPolicyRevision, locale);
}

function formatRevisionDates(
  revision: { effectiveOn: string; publishedOn: string },
  locale: "en" | "ru",
) {
  return {
    effectiveDate: formatPolicyDate(revision.effectiveOn, locale),
    lastUpdated: formatPolicyDate(revision.publishedOn, locale),
  };
}

export function relatedPolicy(
  href: `/${LegalDocumentSlug}`,
  label: string,
) {
  return { href, label };
}
