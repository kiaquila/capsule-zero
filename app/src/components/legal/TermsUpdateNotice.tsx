"use client";

import { useTranslations } from "next-intl";
import { NotificationBanner } from "@/components/common/NotificationBanner";
import { Link } from "@/i18n/navigation";
import { shouldShowTermsUpdateNotice } from "@/lib/legal/revisions";

export function TermsUpdateNotice() {
  const t = useTranslations("termsUpdate");

  if (!shouldShowTermsUpdateNotice()) {
    return null;
  }

  return (
    <NotificationBanner
      description={t("description")}
      testId="terms-update-notice"
      title={t("title")}
    >
      <Link
        className="dashboard-ghost-action terms-update-link"
        data-testid="terms-update-link"
        href="/terms-of-use/2026-09-15"
      >
        {t("action")}
      </Link>
    </NotificationBanner>
  );
}
