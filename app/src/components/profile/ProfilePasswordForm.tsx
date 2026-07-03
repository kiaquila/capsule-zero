"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { changePasswordAction } from "@/features/auth/actions";
import {
  createPasswordChangeSchema,
  type PasswordChangeInput,
} from "@/features/auth/schemas";
import { ProfileTextField } from "./ProfileShell";

interface ProfilePasswordFormProps {
  /** Surfaces the shared profile toast on success. */
  onSuccess: (notice: string) => void;
}

/**
 * Real change-password form behind the profile "Change password" button
 * (spec 035; replaces the mock notice). Current password is required — the
 * API re-authenticates with it before applying the new one.
 */
export function ProfilePasswordForm({ onSuccess }: ProfilePasswordFormProps) {
  const t = useTranslations("profile");
  const auth = useTranslations("auth");
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      createPasswordChangeSchema({
        invalidEmail: auth("invalidEmail"),
        weakPassword: auth("weakPassword"),
        passwordsMismatch: auth("passwordsMismatch"),
        invalidCode: auth("invalidCode"),
      }),
    [auth],
  );
  const form = useForm<PasswordChangeInput>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const submit = form.handleSubmit(async (values) => {
    setServerError(null);
    const result = await changePasswordAction(values);

    if (!result.ok) {
      setServerError(result.message ?? t("password.error"));
      return;
    }

    form.reset();
    setOpen(false);
    onSuccess(t("notice.passwordChanged"));
  });

  if (!open) {
    return (
      <button
        className="profile-ghost-button"
        data-testid="profile-change-password-button"
        onClick={() => setOpen(true)}
        type="button"
      >
        {t("buttons.changePassword")}
      </button>
    );
  }

  // Rendered as a <div>, not a <form>: this block lives inside the profile
  // screen's main <form>, and browsers strip nested form elements — a real
  // <form> here would submit the outer profile form instead.
  return (
    <div
      className="profile-field-grid profile-password-form"
      data-testid="profile-password-form"
    >
      <ProfileTextField
        error={form.formState.errors.currentPassword?.message}
        label={t("password.current")}
        registration={form.register("currentPassword")}
        testId="profile-current-password"
        type="password"
      />
      <ProfileTextField
        error={form.formState.errors.newPassword?.message}
        label={t("password.new")}
        registration={form.register("newPassword")}
        testId="profile-new-password"
        type="password"
      />
      <ProfileTextField
        error={form.formState.errors.confirmPassword?.message}
        label={t("password.confirm")}
        registration={form.register("confirmPassword")}
        testId="profile-confirm-password"
        type="password"
      />
      {serverError ? (
        <p
          className="profile-field-error profile-password-error"
          data-testid="profile-password-error"
          role="alert"
        >
          {serverError}
        </p>
      ) : null}
      <div className="profile-password-actions">
        <button
          className="profile-save-button"
          data-testid="profile-password-submit"
          disabled={form.formState.isSubmitting}
          onClick={submit}
          type="button"
        >
          {form.formState.isSubmitting
            ? t("buttons.saving")
            : t("password.submit")}
        </button>
        <button
          className="profile-ghost-button"
          onClick={() => {
            form.reset();
            setServerError(null);
            setOpen(false);
          }}
          type="button"
        >
          {t("password.cancel")}
        </button>
      </div>
    </div>
  );
}
