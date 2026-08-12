"use client";

import { Fragment } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { openCookieSettings } from "@/lib/cookie-consent";

const policyLinks = [
  {
    href: "/terms-of-use",
    labelKey: "terms",
    testId: "footer-terms-link",
  },
  {
    href: "/privacy-policy",
    labelKey: "privacy",
    testId: "footer-privacy-link",
  },
  {
    href: "/community-guidelines",
    labelKey: "community",
    testId: "footer-community-link",
  },
  {
    href: "/copyright-policy",
    labelKey: "copyrightPolicy",
    testId: "footer-copyright-policy-link",
  },
  {
    href: "/enforcement-policy",
    labelKey: "enforcement",
    testId: "footer-enforcement-link",
  },
] as const;

interface PublicLegalFooterProps {
  showCookieSettings?: boolean;
}

export function PublicLegalFooter({
  showCookieSettings = false,
}: PublicLegalFooterProps) {
  const t = useTranslations("landing");

  return (
    <footer className="landing-footer">
      {policyLinks.map((policy, index) => (
        <Fragment key={policy.href}>
          {index > 0 ? <span aria-hidden="true">·</span> : null}
          <Link href={policy.href} data-testid={policy.testId}>
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
