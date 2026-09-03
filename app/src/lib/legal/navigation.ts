import type { LegalDocumentSlug } from "../legal-content";

export type LegalNavigationLabelKey =
  | "terms"
  | "privacy"
  | "community"
  | "copyrightPolicy"
  | "enforcement";

export const legalNavigationItems: ReadonlyArray<{
  href: `/${LegalDocumentSlug}`;
  labelKey: LegalNavigationLabelKey;
  slug: LegalDocumentSlug;
}> = [
  { href: "/terms-of-use", labelKey: "terms", slug: "terms-of-use" },
  {
    href: "/privacy-policy",
    labelKey: "privacy",
    slug: "privacy-policy",
  },
  {
    href: "/community-guidelines",
    labelKey: "community",
    slug: "community-guidelines",
  },
  {
    href: "/copyright-policy",
    labelKey: "copyrightPolicy",
    slug: "copyright-policy",
  },
  {
    href: "/enforcement-policy",
    labelKey: "enforcement",
    slug: "enforcement-policy",
  },
];
