"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  completeEmailVerificationAction,
  startEmailVerificationAction,
} from "@/features/auth/actions";
import {
  createVerificationCodeSchema,
  type VerificationCodeInput,
} from "@/features/auth/schemas";

interface VerifyEmailBannerProps {
  email: string;
  /** After-sign-up flow the emailed code is bound to; resend replaces it. */
  initialFlowId?: string;
}

/**
 * Non-blocking verify-email prompt for signed-in users with an unverified
 * address (spec 035). Glass surface + quiet completion per the design system;
 * disappears once the emailed code is confirmed.
 */
export function VerifyEmailBanner({
  email,
  initialFlowId,
}: VerifyEmailBannerProps) {
  const t = useTranslations("verifyEmail");
  const router = useRouter();
  const [flowId, setFlowId] = useState(initialFlowId ?? "");
  const [status, setStatus] = useState<{
    text: string;
    kind: "error" | "info";
  } | null>(null);
  const [verified, setVerified] = useState(false);

  const schema = useMemo(
    () =>
      createVerificationCodeSchema({
        invalidEmail: t("invalidCode"),
        weakPassword: t("invalidCode"),
        passwordsMismatch: t("invalidCode"),
        invalidCode: t("invalidCode"),
      }),
    [t],
  );
  const form = useForm<VerificationCodeInput>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { code: "" },
  });

  const resend = async () => {
    setStatus(null);
    const result = await startEmailVerificationAction({ email });
    if (!result.ok || !result.flowId) {
      setStatus({ text: result.message ?? t("error"), kind: "error" });
      return;
    }
    setFlowId(result.flowId);
    setStatus({ text: t("sent"), kind: "info" });
  };

  const submit = form.handleSubmit(async (values) => {
    setStatus(null);
    if (!flowId) {
      // No live flow to submit against (e.g. a reloaded session): request one
      // first so the next code entry has a flow to bind to.
      await resend();
      return;
    }
    const result = await completeEmailVerificationAction({
      code: values.code,
      flowId,
    });
    if (!result.ok) {
      setStatus({ text: result.message ?? t("error"), kind: "error" });
      return;
    }
    setVerified(true);
    router.refresh();
  });

  if (verified) {
    return null;
  }

  return (
    <section
      className="dashboard-glass verify-email-banner"
      data-testid="verify-email-banner"
    >
      <div className="verify-email-copy">
        <h2>{t("title")}</h2>
        <p>{t("hint", { email })}</p>
      </div>
      <form className="verify-email-form" noValidate onSubmit={submit}>
        <input
          aria-invalid={Boolean(form.formState.errors.code)}
          autoComplete="one-time-code"
          className="auth-input verify-email-input"
          data-testid="verify-email-code-input"
          inputMode="numeric"
          placeholder={t("codePlaceholder")}
          type="text"
          {...form.register("code")}
        />
        <button
          className="auth-primary verify-email-submit"
          data-testid="verify-email-submit"
          disabled={form.formState.isSubmitting}
          type="submit"
        >
          {form.formState.isSubmitting ? t("checking") : t("submit")}
        </button>
        <button
          className="verify-email-resend"
          data-testid="verify-email-resend"
          onClick={resend}
          type="button"
        >
          {t("resend")}
        </button>
      </form>
      {status || form.formState.errors.code ? (
        <p
          className="verify-email-status"
          data-testid={
            status?.kind === "error" || form.formState.errors.code
              ? "verify-email-error"
              : "verify-email-info"
          }
          role={status?.kind === "error" ? "alert" : "status"}
        >
          {form.formState.errors.code?.message ?? status?.text}
        </p>
      ) : null}
    </section>
  );
}
