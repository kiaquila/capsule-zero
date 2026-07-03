"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useState, type CSSProperties } from "react";
import { useForm } from "react-hook-form";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  completePasswordRecoveryAction,
  requestPasswordRecoveryAction,
  signInWithPasswordAction,
  signUpWithPasswordAction,
} from "@/features/auth/actions";
import {
  createRecoveryCompleteSchema,
  createRecoverySchema,
  createSignInSchema,
  createSignUpSchema,
  type RecoveryInput,
  type SignInInput,
  type SignUpInput,
} from "@/features/auth/schemas";
import { AuthField } from "./AuthField";

// Auth modes include the spec-035 recovery pair: "recovery" asks for the email
// and sends a one-time code; "recoveryCode" completes the reset (code + new
// password) against the flow the code is bound to, then auto-logs-in.
type AuthMode = "signIn" | "signUp" | "recovery" | "recoveryCode";

// Fields the user types on the completion step; the flow id lives in state.
interface RecoveryCompleteFields {
  code: string;
  newPassword: string;
  confirmPassword: string;
}

export interface RecoveryDeepLink {
  flowId: string;
  code?: string;
}

const elevatedGlassStyle = {
  backdropFilter: "blur(64px) saturate(118%)",
  WebkitBackdropFilter: "blur(64px) saturate(118%)",
} satisfies CSSProperties;

interface AuthPanelProps {
  initialMode?: AuthMode;
  /** Pre-bound recovery flow from an emailed link (/auth?flow=…&code=…). */
  initialRecovery?: RecoveryDeepLink;
  onClose?: () => void;
  variant?: "popup" | "standalone";
}

export function AuthPanel({
  initialMode = "signIn",
  initialRecovery,
  onClose,
  variant = "standalone",
}: AuthPanelProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("auth");
  const landing = useTranslations("landing");
  const [mode, setMode] = useState<AuthMode>(
    initialRecovery ? "recoveryCode" : initialMode,
  );
  const [recoveryFlowId, setRecoveryFlowId] = useState(
    initialRecovery?.flowId ?? "",
  );
  const [recoveryEmail, setRecoveryEmail] = useState("");
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
      invalidCode: t("invalidCode"),
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
  const recoverySchema = useMemo(
    () => createRecoverySchema(validationMessages),
    [validationMessages],
  );
  const recoveryCompleteSchema = useMemo(
    () => createRecoveryCompleteSchema(validationMessages),
    [validationMessages],
  );
  const recoveryForm = useForm<RecoveryInput>({
    resolver: zodResolver(recoverySchema),
    mode: "onChange",
    defaultValues: { email: "" },
  });
  const recoveryCompleteForm = useForm<RecoveryCompleteFields>({
    resolver: zodResolver(recoveryCompleteSchema),
    mode: "onChange",
    defaultValues: {
      code: initialRecovery?.code ?? "",
      newPassword: "",
      confirmPassword: "",
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

  const onRecoveryRequest = recoveryForm.handleSubmit(async (values) => {
    setServerMessage(null);
    const result = await requestPasswordRecoveryAction(values);

    if (!result.ok || !result.flowId) {
      showError(result.message ?? t("invalidEmail"));
      return;
    }

    setRecoveryFlowId(result.flowId);
    setRecoveryEmail(values.email);
    setMode("recoveryCode");
    showInfo(t("recoverySent"));
  });

  const onRecoveryComplete = recoveryCompleteForm.handleSubmit(
    async (values) => {
      setServerMessage(null);
      const result = await completePasswordRecoveryAction({
        ...values,
        flowId: recoveryFlowId,
      });

      if (!result.ok) {
        showError(result.message ?? t("invalidCode"));
        return;
      }

      redirectToDashboard();
    },
  );

  const resendRecoveryCode = async () => {
    if (!recoveryEmail) {
      switchMode("recovery");
      return;
    }
    setServerMessage(null);
    const result = await requestPasswordRecoveryAction({
      email: recoveryEmail,
    });
    if (!result.ok || !result.flowId) {
      showError(result.message ?? t("invalidEmail"));
      return;
    }
    setRecoveryFlowId(result.flowId);
    showInfo(t("recoverySent"));
  };

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

  const headerAction =
    mode === "signIn" ? (
      <button className="auth-mode-switch" type="button" onClick={() => switchMode("signUp")}>
        {t("signUpTab")}
      </button>
    ) : (
      <button className="auth-mode-switch" type="button" onClick={() => switchMode("signIn")}>
        {mode === "signUp" ? t("logInTab") : t("backToLogin")}
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
            <button
              data-testid="auth-forgot-link"
              type="button"
              onClick={() => switchMode("recovery")}
            >
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

      {mode === "recovery" ? (
        <form noValidate onSubmit={onRecoveryRequest}>
          <h2 className="auth-recovery-title">{t("recoveryTitle")}</h2>
          <p className="auth-recovery-hint">{t("recoveryHint")}</p>
          <AuthField
            autoComplete="email"
            error={recoveryForm.formState.errors.email?.message}
            inputMode="email"
            name="recoveryEmail"
            placeholder={t("email")}
            register={recoveryForm.register("email")}
            testId="recovery-email-input"
            type="email"
          />
          <button
            className="auth-primary"
            data-testid="recovery-submit"
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

      {mode === "recoveryCode" ? (
        <form noValidate onSubmit={onRecoveryComplete}>
          <h2 className="auth-recovery-title">{t("recoveryTitle")}</h2>
          <p className="auth-recovery-hint">{t("recoveryCodeHint")}</p>
          <AuthField
            autoComplete="one-time-code"
            error={recoveryCompleteForm.formState.errors.code?.message}
            inputMode="numeric"
            name="recoveryCode"
            placeholder={t("codePlaceholder")}
            register={recoveryCompleteForm.register("code")}
            testId="recovery-code-input"
            type="text"
          />
          <AuthField
            autoComplete="new-password"
            error={recoveryCompleteForm.formState.errors.newPassword?.message}
            name="recoveryNewPassword"
            placeholder={t("newPassword")}
            register={recoveryCompleteForm.register("newPassword")}
            reveal={{
              visible: passwordVisible,
              toggle: () => setPasswordVisible((value) => !value),
              label: passwordVisible ? t("hidePassword") : t("showPassword"),
            }}
            testId="recovery-new-password-input"
            type={passwordVisible ? "text" : "password"}
          />
          <AuthField
            autoComplete="new-password"
            error={
              recoveryCompleteForm.formState.errors.confirmPassword?.message
            }
            name="recoveryConfirmPassword"
            placeholder={t("confirmPassword")}
            register={recoveryCompleteForm.register("confirmPassword")}
            reveal={{
              visible: confirmVisible,
              toggle: () => setConfirmVisible((value) => !value),
              label: confirmVisible ? t("hidePassword") : t("showPassword"),
            }}
            testId="recovery-confirm-password-input"
            type={confirmVisible ? "text" : "password"}
          />
          <button
            className="auth-primary"
            data-testid="recovery-submit"
            disabled={recoveryCompleteForm.formState.isSubmitting}
            type="submit"
          >
            {recoveryCompleteForm.formState.isSubmitting
              ? t("resetting")
              : t("resetCta")}
          </button>
          <p className="auth-switch-link">
            <button type="button" onClick={resendRecoveryCode}>
              {t("resendCode")}
            </button>{" "}
            <button type="button" onClick={() => switchMode("signIn")}>
              {t("backToLogin")}
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

      <p className="auth-terms-note">
        {t("termsConsentPrefix")}{" "}
        <Link href="/terms-of-use">{landing("terms")}</Link>{" "}
        {t("termsConsentMiddle")}{" "}
        <Link href="/privacy-policy">{landing("privacy")}</Link>
      </p>
    </section>
  );
}
