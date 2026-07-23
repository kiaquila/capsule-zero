"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useForm } from "react-hook-form";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  completePasswordRecoveryAction,
  googleSignInAvailableAction,
  requestPasswordRecoveryAction,
  signInWithPasswordAction,
  signUpWithPasswordAction,
  startGoogleSignInAction,
  type AuthActionResult,
} from "@/features/auth/actions";
import { authErrorMessageKey } from "@/features/auth/error-codes";
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
  /** Pre-bound recovery flow from /auth?flow=…&code=… URL params. */
  initialRecovery?: RecoveryDeepLink;
  /**
   * Whether this deployment offers Google sign-in (spec 037). Dynamic routes
   * (/auth) resolve it server-side and pass it down; panels mounted from
   * static pages (the landing popup) leave it undefined and the panel asks
   * the server itself after mount — the landing stays prerenderable.
   */
  googleSignIn?: boolean;
  /** A failed Google callback landed on /auth?googleError=1. */
  googleError?: boolean;
  onClose?: () => void;
  variant?: "popup" | "standalone";
}

export function AuthPanel({
  initialMode = "signIn",
  initialRecovery,
  googleSignIn,
  googleError = false,
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
  const [recoveryContinuationId, setRecoveryContinuationId] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [serverMessage, setServerMessage] = useState<{
    text: string;
    kind: "error" | "info";
  } | null>(
    googleError
      ? { text: t("errors.GOOGLE_SIGN_IN_FAILED"), kind: "error" }
      : null,
  );
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  // Availability comes from the prop when the mounting page resolved it
  // server-side (/auth); panels mounted from static pages (landing popup)
  // leave the prop undefined and the panel asks the server after mount.
  const [fetchedGoogleAvailable, setFetchedGoogleAvailable] = useState(false);
  const googleAvailable = googleSignIn ?? fetchedGoogleAvailable;
  const panelRef = useRef<HTMLElement>(null);
  // The panel scrolls internally with the scrollbar hidden; this flag drives
  // the bottom fade so cut-off content reads as "continues below", not broken.
  const [hasOverflowBelow, setHasOverflowBelow] = useState(false);

  // A new mode's form starts at the top — otherwise the panel keeps the
  // previous mode's scroll offset (e.g. after tapping a below-the-fold link).
  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0 });
  }, [mode]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) {
      return;
    }
    const update = () => {
      setHasOverflowBelow(
        panel.scrollHeight - panel.scrollTop - panel.clientHeight > 8,
      );
    };
    update();
    panel.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(panel);
    // The content wrapper grows when error chips or the server message appear
    // after the initial layout — the panel's own box stays fixed then.
    if (panel.firstElementChild) {
      observer.observe(panel.firstElementChild);
    }
    return () => {
      panel.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [mode, googleAvailable]);

  useEffect(() => {
    if (googleSignIn !== undefined) {
      return;
    }
    let cancelled = false;
    googleSignInAvailableAction()
      .then((available) => {
        if (!cancelled) {
          setFetchedGoogleAvailable(available);
        }
      })
      .catch(() => {
        // Unknown availability keeps the button hidden.
      });
    return () => {
      cancelled = true;
    };
  }, [googleSignIn]);

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

  const showError = (text: string) => setServerMessage({ text, kind: "error" });
  const showInfo = (text: string) => setServerMessage({ text, kind: "info" });
  // Every server-side failure is shown through the localized code map — raw
  // provider text never reaches the user (spec 035 review round 2).
  const showFailure = (result: AuthActionResult) =>
    showError(t(authErrorMessageKey(result.code)));

  const redirectToDashboard = () => {
    showInfo(t("successRedirect"));
    router.push(`/${locale}/dashboard`);
    router.refresh();
  };

  const onSignIn = signInForm.handleSubmit(async (values) => {
    setServerMessage(null);
    const result = await signInWithPasswordAction(values);

    if (!result.ok) {
      showFailure(result);
      return;
    }

    redirectToDashboard();
  });

  const onRecoveryRequest = recoveryForm.handleSubmit(async (values) => {
    setServerMessage(null);
    const result = await requestPasswordRecoveryAction(values);

    if (!result.ok || !result.flowId) {
      showFailure(result);
      return;
    }

    setRecoveryFlowId(result.flowId);
    setRecoveryContinuationId("");
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
        recoveryContinuationId,
      });

      if (!result.ok) {
        if (result.recoveryContinuationId) {
          setRecoveryContinuationId(result.recoveryContinuationId);
        } else if (result.code === "INVALID_CODE") {
          setRecoveryContinuationId("");
        }
        showFailure(result);
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
      showFailure(result);
      return;
    }
    setRecoveryFlowId(result.flowId);
    setRecoveryContinuationId("");
    showInfo(t("recoverySent"));
  };

  const onGoogleSignIn = async () => {
    setServerMessage(null);
    setGoogleSubmitting(true);
    const result = await startGoogleSignInAction({ locale });
    if (!result.ok || !result.redirectUrl) {
      setGoogleSubmitting(false);
      showFailure(result);
      return;
    }
    // Stay disabled until the browser leaves for the consent screen.
    window.location.assign(result.redirectUrl);
  };

  // Shared by the sign-in and sign-up forms; hidden when the deployment does
  // not offer Google. Leads the form — on mobile the primary path must sit
  // above the fold. Monochrome glyph — the interface stays achromatic.
  const googleBlock = googleAvailable ? (
    <>
      <button
        className="auth-social"
        data-testid="auth-google-button"
        disabled={googleSubmitting}
        onClick={onGoogleSignIn}
        type="button"
      >
        <GoogleGlyph />
        {googleSubmitting ? t("googleRedirecting") : t("continueWithGoogle")}
      </button>
      <div aria-hidden="true" className="auth-divider">
        {t("orDivider")}
      </div>
    </>
  ) : null;

  const onSignUp = signUpForm.handleSubmit(async (values) => {
    setServerMessage(null);
    const result = await signUpWithPasswordAction({ ...values, locale });

    if (!result.ok) {
      showFailure(result);
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

  // The header names the current mode (the old top-left mode-switch button
  // read as a wrong title over the form); switching lives in the links under
  // each form.
  const panelTitle =
    mode === "signIn"
      ? t("signInTitle")
      : mode === "signUp"
        ? t("signUpTitle")
        : t("recoveryTitle");

  return (
    <section
      aria-labelledby="auth-panel-title"
      className={cn(
        "auth-panel glass",
        `auth-panel-${variant}`,
        hasOverflowBelow && "auth-panel-more",
      )}
      ref={panelRef}
      style={elevatedGlassStyle}
    >
      <div className="auth-panel-content">
        <div className="auth-panel-header">
          <h2 className="auth-panel-title" id="auth-panel-title">
            {panelTitle}
          </h2>
          {onClose ? (
            <button
              className="auth-close"
              type="button"
              onClick={onClose}
              aria-label={t("close")}
            >
              ×
            </button>
          ) : (
            <a
              className="auth-close"
              href={`/${locale}`}
              aria-label={t("close")}
            >
              ×
            </a>
          )}
        </div>

        {mode === "signIn" ? (
          <form noValidate onSubmit={onSignIn}>
            {googleBlock}
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
                onClick={() => {
                  const typedEmail = signInForm.getValues("email").trim();
                  if (typedEmail) {
                    recoveryForm.setValue("email", typedEmail, {
                      shouldValidate: true,
                    });
                  }
                  switchMode("recovery");
                }}
              >
                {t("forgotPassword")}
              </button>
            </div>
            <button
              className="auth-primary"
              disabled={signInForm.formState.isSubmitting}
              type="submit"
            >
              {signInForm.formState.isSubmitting
                ? t("checking")
                : t("logInTab")}
            </button>
            <p className="auth-switch-link">
              {t("signInLinkPrefix")}{" "}
              <button
                data-testid="auth-mode-switch"
                type="button"
                onClick={() => switchMode("signUp")}
              >
                {t("signInLinkAction")}
              </button>
            </p>
          </form>
        ) : null}

        {mode === "recovery" ? (
          <form noValidate onSubmit={onRecoveryRequest}>
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
              {recoveryForm.formState.isSubmitting
                ? t("sending")
                : t("recoveryCta")}
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
              <button
                data-testid="recovery-resend"
                type="button"
                onClick={resendRecoveryCode}
              >
                {t("resendCode")}
              </button>
            </p>
            <p className="auth-switch-link">
              <button type="button" onClick={() => switchMode("signIn")}>
                {t("backToLogin")}
              </button>
            </p>
          </form>
        ) : null}

        {mode === "signUp" ? (
          <form noValidate onSubmit={onSignUp}>
            {googleBlock}
            <AuthField
              autoComplete="email"
              error={signUpForm.formState.errors.email?.message}
              inputMode="email"
              name="email"
              placeholder={t("email")}
              register={signUpForm.register("email")}
              type="email"
            />
            <AuthField
              autoComplete="new-password"
              error={signUpForm.formState.errors.password?.message}
              name="password"
              placeholder={t("password")}
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
            <button
              className="auth-primary"
              disabled={signUpForm.formState.isSubmitting}
              type="submit"
            >
              {signUpForm.formState.isSubmitting
                ? t("creating")
                : t("createAccountCta")}
            </button>
            <p className="auth-switch-link">
              {t("logInLinkPrefix")}{" "}
              <button
                data-testid="auth-mode-switch"
                type="button"
                onClick={() => switchMode("signIn")}
              >
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
      </div>
    </section>
  );
}

// Monochrome Google "G" — the achromatic-interface rule wins over brand
// colors (spec 037); inherits the button's text color.
function GoogleGlyph() {
  return (
    <svg
      aria-hidden="true"
      fill="currentColor"
      height="16"
      viewBox="0 0 24 24"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 10.2v3.9h5.5c-.24 1.42-1.66 4.17-5.5 4.17-3.31 0-6.01-2.74-6.01-6.12S8.69 6.03 12 6.03c1.88 0 3.14.8 3.86 1.49l2.63-2.53C16.8 3.41 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.54 0 9.22-3.9 9.22-9.38 0-.63-.07-1.11-.15-1.59H12Z" />
    </svg>
  );
}
