"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  bindGuestIntent,
  clearGuestIntent,
  clearSavedGuestDraft,
} from "@/features/guest/intent";
import { saveGuestProgressAction } from "@/features/guest/actions";
import { Link } from "@/i18n/navigation";

export function GuestSaveContinue({
  userId,
  transferId,
}: {
  userId: string;
  transferId: string;
}) {
  const t = useTranslations("guest");
  const locale = useLocale();
  const started = useRef(false);
  const [status, setStatus] = useState<"saving" | "error" | "owner" | "empty">(
    "saving",
  );
  const save = useCallback(async () => {
    setStatus("saving");
    try {
      const intent = bindGuestIntent(userId, transferId);
      const result = await saveGuestProgressAction(intent);
      if (!result.ok) {
        setStatus(result.code === "OWNER_MISMATCH" ? "owner" : "error");
        return;
      }
      // A storage-cleanup failure after a durable commit must not hide success.
      try {
        clearSavedGuestDraft(intent);
        clearGuestIntent(intent.transferId);
      } catch {
        /* retry stays idempotent */
      }
      window.location.replace(`/${locale}/account/guest/${result.id}`);
    } catch (error) {
      setStatus(
        error instanceof Error && error.message === "NO_INTENT"
          ? "empty"
          : error instanceof Error && error.message === "OWNER_MISMATCH"
            ? "owner"
            : "error",
      );
    }
  }, [locale, userId, transferId]);
  useEffect(() => {
    if (!started.current) {
      started.current = true;
      void save();
    }
  }, [save]);
  return (
    <section
      className="guest-panel guest-save"
      data-testid="guest-save-continuation"
      aria-busy={status === "saving"}
    >
      <h1
        className="guest-panel-title"
        data-testid={
          status === "owner" ? "guest-save-owner-mismatch" : undefined
        }
      >
        {t(
          status === "saving"
            ? "saving"
            : status === "owner"
              ? "saveOwnerMismatch"
              : status === "empty"
                ? "saveNoIntent"
                : "saveError",
        )}
      </h1>
      <p
        className="guest-panel-lead"
        role={status === "error" || status === "owner" ? "alert" : "status"}
      >
        {t(status === "saving" ? "saveWait" : "savePreserved")}
      </p>
      {status === "error" ? (
        <button
          className="guest-cta guest-cta-wide"
          type="button"
          onClick={() => void save()}
          data-testid="guest-save-retry"
        >
          {t("saveRetry")}
        </button>
      ) : null}
      {status !== "saving" ? (
        <Link className="guest-ghost guest-ghost-wide" href="/start">
          {t("saveBack")}
        </Link>
      ) : null}
    </section>
  );
}
