"use client";

import { useTranslations } from "next-intl";
import { NotificationBanner } from "@/components/common/NotificationBanner";
import { Link } from "@/i18n/navigation";

interface TermsUpdateNoticeProps {
  visible: boolean;
}

export function TermsUpdateNotice({ visible }: TermsUpdateNoticeProps) {
  const t = useTranslations("termsUpdate");

  if (!visible) {
    return null;
  }

  return (
    <div className="authenticated-terms-notice">
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
    </div>
  );
}
