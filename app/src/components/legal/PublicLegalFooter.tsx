"use client";

import { Fragment } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { openCookieSettings } from "@/lib/cookie-consent";
import type { LegalDocumentSlug } from "@/lib/legal-content";
import { legalNavigationItems } from "@/lib/legal/navigation";

const footerTestIds = {
  "terms-of-use": "footer-terms-link",
  "privacy-policy": "footer-privacy-link",
  "community-guidelines": "footer-community-link",
  "copyright-policy": "footer-copyright-policy-link",
  "enforcement-policy": "footer-enforcement-link",
} as const satisfies Record<LegalDocumentSlug, string>;

interface PublicLegalFooterProps {
  showCookieSettings?: boolean;
}

export function PublicLegalFooter({
  showCookieSettings = false,
}: PublicLegalFooterProps) {
  const t = useTranslations("landing");

  return (
    <footer className="landing-footer">
      {legalNavigationItems.map((policy, index) => (
        <Fragment key={policy.href}>
          {index > 0 ? <span aria-hidden="true">·</span> : null}
          <Link href={policy.href} data-testid={footerTestIds[policy.slug]}>
            {t(policy.labelKey)}
          </Link>
        </Fragment>
      ))}
      {showCookieSettings ? (
        <>
          <span aria-hidden="true">·</span>
          <button
            className="landing-footer-button"
            onClick={openCookieSettings}
            type="button"
          >
            {t("cookieSettings")}
          </button>
        </>
      ) : null}
      <span aria-hidden="true">·</span>
      <span>{t("copyright")}</span>
    </footer>
  );
}
