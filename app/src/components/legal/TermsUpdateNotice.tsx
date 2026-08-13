"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { NotificationBanner } from "@/components/common/NotificationBanner";
import { Link } from "@/i18n/navigation";

interface TermsUpdateNoticeProps {
  effectiveAt: string;
  serverNow: string;
  visible: boolean;
}

const MAX_TIMEOUT_MS = 2_147_483_647;

function scheduleExpiry(delayMs: number, expire: () => void) {
  const expiresAt = performance.now() + Math.max(0, delayMs);
  let timeoutId: number | undefined;

  const scheduleNext = () => {
    const remainingMs = expiresAt - performance.now();
    if (remainingMs <= 0) {
      expire();
      return;
    }
    timeoutId = window.setTimeout(
      scheduleNext,
      Math.min(remainingMs, MAX_TIMEOUT_MS),
    );
  };

  scheduleNext();
  return () => {
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
    }
  };
}

export function TermsUpdateNotice({
  effectiveAt,
  serverNow,
  visible,
}: TermsUpdateNoticeProps) {
  const t = useTranslations("termsUpdate");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }
    const delayMs = Date.parse(effectiveAt) - Date.parse(serverNow);
    return scheduleExpiry(delayMs, () => setExpired(true));
  }, [effectiveAt, serverNow, visible]);

  if (!visible || expired) {
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
