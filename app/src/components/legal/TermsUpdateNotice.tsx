"use client";

import { useTranslations } from "next-intl";
import { NotificationBanner } from "@/components/common/NotificationBanner";
import { Link } from "@/i18n/navigation";

export function TermsUpdateNotice() {
  const t = useTranslations("termsUpdate");

  return (
    <NotificationBanner
      description={t("description")}
      testId="terms-update-notice"
      title={t("title")}
    >
      <Link
        className="dashboard-ghost-action terms-update-link"
        data-testid="terms-update-link"
        href="/terms-of-use"
      >
        {t("action")}
      </Link>
    </NotificationBanner>
  );
}
