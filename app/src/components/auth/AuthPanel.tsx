"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useState, type CSSProperties } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  requestPasswordRecoveryAction,
  signInWithPasswordAction,
  signUpWithPasswordAction,
} from "@/features/auth/actions";
import {
  createRecoverySchema,
  createSignInSchema,
  createSignUpSchema,
  type RecoveryInput,
  type SignInInput,
  type SignUpInput,
} from "@/features/auth/schemas";

type AuthMode = "signIn" | "signUp" | "recovery";

const elevatedGlassStyle = {
  backdropFilter: "blur(64px) saturate(118%)",
  WebkitBackdropFilter: "blur(64px) saturate(118%)",
} satisfies CSSProperties;

interface AuthPanelProps {
  initialMode?: AuthMode;
  onClose?: () => void;
  variant?: "popup" | "standalone";
}

export function AuthPanel({
  initialMode = "signIn",
  onClose,
  variant = "standalone",
}: AuthPanelProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("auth");
  const landing = useTranslations("landing");
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [serverMessage, setServerMessage] = useState<{
    text: string;
    kind: "error" | "info";
  } | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const validationMessages = useMemo(
    () => ({
      invalidEmail: t("invalidEmail"),
      weakPassword: t("weakPassword"),
      passwordsMismatch: t("passwordsMismatch"),
    }),
    [t],
  );

  const signInSchema = useMemo(
    () => createSignInSchema(validationMessages),
    [validationMessages],
  );
  const signUpSchema = useMemo(
    () => createSignUpSchema(validationMessages),
    [validationMessages],
  );
  const recoverySchema = useMemo(
    () => createRecoverySchema(validationMessages),
    [validationMessages],
  );

  const signInForm = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const signUpForm = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      country: "",
      city: "",
    },
  });
  const recoveryForm = useForm<RecoveryInput>({
    resolver: zodResolver(recoverySchema),
    mode: "onChange",
    defaultValues: {
      email: "",
    },
  });

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setServerMessage(null);
  };

  const showError = (text: string) =>
    setServerMessage({ text, kind: "error" });
  const showInfo = (text: string) => setServerMessage({ text, kind: "info" });

  const redirectToDashboard = () => {
    showInfo(t("successRedirect"));
    router.push(`/${locale}/dashboard`);
    router.refresh();
  };

  const onSignIn = signInForm.handleSubmit(async (values) => {
    setServerMessage(null);
    const result = await signInWithPasswordAction(values);

    if (!result.ok) {
      showError(result.message ?? t("enterPassword"));
      return;
    }

    redirectToDashboard();
  });

  const onSignUp = signUpForm.handleSubmit(async (values) => {
    setServerMessage(null);
    const result = await signUpWithPasswordAction({ ...values, locale });

    if (!result.ok) {
      showError(result.message ?? t("weakPassword"));
      return;
    }

    if (result.requiresEmailConfirmation) {
      signInForm.setValue("email", values.email);
      signUpForm.reset();
      setMode("signIn");
      showInfo(t("confirmationRequired"));
      return;
    }

    redirectToDashboard();
  });

  const onRecovery = recoveryForm.handleSubmit(async (values) => {
    setServerMessage(null);
    const result = await requestPasswordRecoveryAction(values);

    if (!result.ok) {
      showError(result.message ?? t("invalidEmail"));
      return;
    }

    showInfo(t("recoverySent"));
  });

  const headerAction =
    mode === "signIn" ? (
      <button className="auth-mode-switch" type="button" onClick={() => switchMode("signUp")}>
        {t("signUpTab")}
      </button>
    ) : (
      <button className="auth-mode-switch" type="button" onClick={() => switchMode("signIn")}>
        {t("logInTab")}
      </button>
    );

  return (
    <section
      className={cn("auth-panel glass", `auth-panel-${variant}`)}
      style={elevatedGlassStyle}
    >
      <div className="auth-panel-header">
        {headerAction}
        {onClose ? (
          <button className="auth-close" type="button" onClick={onClose} aria-label={t("close")}>
            ×
          </button>
        ) : (
          <a className="auth-close" href={`/${locale}`} aria-label={t("close")}>
            ×
          </a>
        )}
      </div>

      {mode === "signIn" ? (
        <form noValidate onSubmit={onSignIn}>
          <AuthField
            autoComplete="email"
            error={signInForm.formState.errors.email?.message}
            inputMode="email"
            name="email"
            placeholder={t("email")}
            register={signInForm.register("email")}
            type="email"
          />
          <AuthField
            autoComplete="current-password"
            error={signInForm.formState.errors.password?.message}
            name="password"
            placeholder={t("password")}
            register={signInForm.register("password")}
            reveal={{
              visible: passwordVisible,
              toggle: () => setPasswordVisible((value) => !value),
              label: passwordVisible ? t("hidePassword") : t("showPassword"),
            }}
            type={passwordVisible ? "text" : "password"}
          />
          <div className="auth-forgot-row">
            <button type="button" onClick={() => switchMode("recovery")}>
              {t("forgotPassword")}
            </button>
          </div>
          <button
            className="auth-primary"
            disabled={signInForm.formState.isSubmitting}
            type="submit"
          >
            {signInForm.formState.isSubmitting ? t("checking") : t("logInTab")}
          </button>
          <p className="auth-switch-link">
            {t("signInLinkPrefix")}{" "}
            <button type="button" onClick={() => switchMode("signUp")}>
              {t("signInLinkAction")}
            </button>
          </p>
        </form>
      ) : null}

      {mode === "signUp" ? (
        <form noValidate onSubmit={onSignUp}>
          <p className="auth-required-note">{t("requiredNote")}</p>
          <AuthField
            autoComplete="email"
            error={signUpForm.formState.errors.email?.message}
            inputMode="email"
            name="email"
            placeholder={`${t("email")} *`}
            register={signUpForm.register("email")}
            type="email"
          />
          <AuthField
            autoComplete="new-password"
            error={signUpForm.formState.errors.password?.message}
            name="password"
            placeholder={`${t("password")} *`}
            register={signUpForm.register("password")}
            reveal={{
              visible: passwordVisible,
              toggle: () => setPasswordVisible((value) => !value),
              label: passwordVisible ? t("hidePassword") : t("showPassword"),
            }}
            type={passwordVisible ? "text" : "password"}
          />
          <AuthField
            autoComplete="new-password"
            error={signUpForm.formState.errors.confirmPassword?.message}
            name="confirmPassword"
            placeholder={t("confirmPassword")}
            register={signUpForm.register("confirmPassword")}
            reveal={{
              visible: confirmVisible,
              toggle: () => setConfirmVisible((value) => !value),
              label: confirmVisible ? t("hidePassword") : t("showPassword"),
            }}
            type={confirmVisible ? "text" : "password"}
          />
          <AuthField
            autoComplete="given-name"
            error={signUpForm.formState.errors.name?.message}
            name="name"
            placeholder={t("name")}
            register={signUpForm.register("name")}
            type="text"
          />
          <div className="auth-optional-row">
            <AuthField
              autoComplete="country-name"
              error={signUpForm.formState.errors.country?.message}
              name="country"
              placeholder={t("country")}
              register={signUpForm.register("country")}
              type="text"
            />
            <AuthField
              autoComplete="address-level2"
              error={signUpForm.formState.errors.city?.message}
              name="city"
              placeholder={t("city")}
              register={signUpForm.register("city")}
              type="text"
            />
          </div>
          <button
            className="auth-primary"
            disabled={signUpForm.formState.isSubmitting}
            type="submit"
          >
            {signUpForm.formState.isSubmitting ? t("creating") : t("createAccountCta")}
          </button>
          <p className="auth-switch-link">
            {t("logInLinkPrefix")}{" "}
            <button type="button" onClick={() => switchMode("signIn")}>
              {t("logInLinkAction")}
            </button>
          </p>
        </form>
      ) : null}

      {mode === "recovery" ? (
        <form noValidate onSubmit={onRecovery}>
          <h2 className="auth-recovery-title">{t("recoveryTitle")}</h2>
          <p className="auth-recovery-hint">{t("recoveryHint")}</p>
          <AuthField
            autoComplete="email"
            error={recoveryForm.formState.errors.email?.message}
            inputMode="email"
            name="email"
            placeholder={t("email")}
            register={recoveryForm.register("email")}
            type="email"
          />
          <button
            className="auth-primary"
            disabled={recoveryForm.formState.isSubmitting}
            type="submit"
          >
            {recoveryForm.formState.isSubmitting ? t("sending") : t("recoveryCta")}
          </button>
          <p className="auth-switch-link">
            <button type="button" onClick={() => switchMode("signIn")}>
              {t("backToLogin")}
            </button>
          </p>
        </form>
      ) : null}

      {serverMessage ? (
        <p
          className={cn(
            "auth-server-message",
            serverMessage.kind === "error" && "auth-server-message-error",
          )}
          role={serverMessage.kind === "error" ? "alert" : undefined}
          aria-live={serverMessage.kind === "error" ? "assertive" : "polite"}
        >
          {serverMessage.text}
        </p>
      ) : null}

      {mode !== "recovery" ? (
        <p className="auth-terms-note">
          {t("termsConsentPrefix")}{" "}
          <Link href="/terms-of-use">{landing("terms")}</Link>{" "}
          {t("termsConsentMiddle")}{" "}
          <Link href="/privacy-policy">{landing("privacy")}</Link>
        </p>
      ) : null}
    </section>
  );
}

interface AuthFieldProps {
  autoComplete: string;
  error?: string;
  inputMode?: "email";
  name: string;
  placeholder: string;
  register: UseFormRegisterReturn;
  reveal?: {
    visible: boolean;
    toggle: () => void;
    label: string;
  };
  type: string;
}

function AuthField({
  autoComplete,
  error,
  inputMode,
  name,
  placeholder,
  register,
  reveal,
  type,
}: AuthFieldProps) {
  return (
    <div className="auth-field">
      <div className="auth-field-wrap">
        <input
          aria-invalid={Boolean(error)}
          autoComplete={autoComplete}
          className={cn("auth-input", error && "auth-input-error", reveal && "auth-input-with-reveal")}
          id={name}
          inputMode={inputMode}
          placeholder={placeholder}
          type={type}
          {...register}
        />
        {reveal ? (
          <button
            aria-label={reveal.label}
            className="auth-eye"
            onClick={reveal.toggle}
            type="button"
          >
            <EyeIcon hidden={reveal.visible} />
          </button>
        ) : null}
      </div>
      <p className={cn("auth-field-message", error && "auth-field-message-error")}>
        {error ?? ""}
      </p>
    </div>
  );
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  if (hidden) {
    return (
      <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16">
        <path
          d="M17.94 17.94A10.1 10.1 0 0 1 12 20C5 20 1 12 1 12a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A9.1 9.1 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M14.12 14.12a3 3 0 0 1-4.24-4.24M1 1l22 22"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16">
      <path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}
