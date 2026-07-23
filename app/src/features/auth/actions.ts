"use server";

import { createProviderRegistry } from "@/lib/providers";
import { routing, type AppLocale } from "@/i18n/routing";
import {
  createPasswordChangeSchema,
  createRecoveryCompleteSchema,
  createRecoverySchema,
  createSignInSchema,
  createSignUpSchema,
  createVerificationCodeSchema,
  type AuthValidationMessages,
  type PasswordChangeInput,
  type RecoveryCompleteInput,
  type RecoveryInput,
  type SignInInput,
  type SignUpInput,
  type VerificationCodeInput,
} from "./schemas";
import { authActionFailure } from "./error-codes";
import {
  appOrigin,
  googleSignInAvailable,
  storeGoogleExchangeCode,
} from "./google";
import {
  clearMockSession,
  markAppSessionEmailVerified,
  persistMockSession,
} from "./session";

const serverValidationMessages: AuthValidationMessages = {
  invalidEmail: "Please enter a valid email",
  weakPassword: "Password must be at least 8 characters",
  passwordsMismatch: "Passwords don't match",
  invalidCode: "Enter the code from the email",
};

export interface AuthActionResult {
  ok: boolean;
  /** Machine error code the UI maps to a localized message (spec 035). */
  code?: string;
  message?: string;
  requiresEmailConfirmation?: boolean;
  /** Flow the emailed one-time code is bound to (recovery/verification). */
  flowId?: string;
  /** Opaque retry id after a valid recovery code hit a password-policy error. */
  recoveryContinuationId?: string;
  /** Google consent-screen URL the browser must visit (spec 037). */
  redirectUrl?: string;
}

/**
 * Whether this deployment offers Google sign-in (spec 037). Exists as an
 * action so AuthPanel instances mounted from STATIC pages (the landing
 * popup) can resolve availability at request time — calling the provider
 * registry during the landing prerender would break the production build.
 */
export async function googleSignInAvailableAction(): Promise<boolean> {
  return googleSignInAvailable();
}

/**
 * Begin the Google sign-in loop (spec 037): the provider hands back the
 * consent redirect URL plus the exchange code, which is parked in a
 * short-lived httpOnly cookie for the callback route to consume.
 */
export async function startGoogleSignInAction(input: {
  locale?: string;
}): Promise<AuthActionResult> {
  const providers = createProviderRegistry();
  if (!providers.auth.startGoogleSignIn) {
    return { ok: false, code: "GOOGLE_SIGN_IN_FAILED" };
  }
  const locale = normalizeActionLocale(input.locale);

  try {
    const origin = await appOrigin();
    const { redirectUrl, exchangeCode } =
      await providers.auth.startGoogleSignIn(
        `${origin}/${locale}/auth/google/callback`,
      );
    await storeGoogleExchangeCode(exchangeCode);
    return { ok: true, redirectUrl };
  } catch (error) {
    return { ok: false, ...authActionFailure(error) };
  }
}

export async function signInWithPasswordAction(
  input: SignInInput,
): Promise<AuthActionResult> {
  const parsed = createSignInSchema(serverValidationMessages).safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message };
  }

  const providers = createProviderRegistry();
  try {
    const session = await providers.auth.signInWithPassword(parsed.data);
    await persistMockSession(session);
  } catch (error) {
    return { ok: false, ...authActionFailure(error) };
  }

  return { ok: true };
}

export async function signUpWithPasswordAction(
  input: SignUpInput & { locale?: string },
): Promise<AuthActionResult> {
  const parsed = createSignUpSchema(serverValidationMessages).safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message };
  }

  const providers = createProviderRegistry();
  try {
    const session = await providers.auth.signUpWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
      locale: normalizeActionLocale(input.locale),
    });
    if (!session) {
      return { ok: true, requiresEmailConfirmation: true };
    }
    await persistMockSession(session);
  } catch (error) {
    return { ok: false, ...authActionFailure(error) };
  }

  return { ok: true };
}

export async function requestPasswordRecoveryAction(
  input: RecoveryInput,
): Promise<AuthActionResult> {
  const parsed = createRecoverySchema(serverValidationMessages).safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message };
  }

  const providers = createProviderRegistry();
  try {
    const request = await providers.auth.requestPasswordRecovery(
      parsed.data.email,
    );
    return { ok: true, flowId: request.flowId };
  } catch (error) {
    return { ok: false, ...authActionFailure(error) };
  }
}

export async function completePasswordRecoveryAction(
  input: RecoveryCompleteInput & {
    flowId?: string;
    recoveryContinuationId?: string;
  },
): Promise<AuthActionResult> {
  const parsed =
    createRecoveryCompleteSchema(serverValidationMessages).safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message };
  }
  if (!input.flowId && !input.recoveryContinuationId) {
    return { ok: false, message: serverValidationMessages.invalidCode };
  }

  const providers = createProviderRegistry();
  try {
    const session = await providers.auth.completePasswordRecovery({
      flowId: input.flowId,
      code: parsed.data.code,
      newPassword: parsed.data.newPassword,
      recoveryContinuationId: input.recoveryContinuationId,
    });
    await persistMockSession(session);
  } catch (error) {
    const failure = authActionFailure(error);
    return {
      ok: false,
      ...failure,
      recoveryContinuationId: recoveryContinuationIdFromDetails(
        failure.details,
      ),
    };
  }

  return { ok: true };
}

function recoveryContinuationIdFromDetails(
  details: Record<string, unknown> | undefined,
): string | undefined {
  const value = details?.recoveryContinuationId;
  return typeof value === "string" && value.trim() ? value : undefined;
}

export async function startEmailVerificationAction(
  input: RecoveryInput,
): Promise<AuthActionResult> {
  const parsed = createRecoverySchema(serverValidationMessages).safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message };
  }

  const providers = createProviderRegistry();
  try {
    const request = await providers.auth.startEmailVerification(
      parsed.data.email,
    );
    return { ok: true, flowId: request.flowId };
  } catch (error) {
    return { ok: false, ...authActionFailure(error) };
  }
}

export async function completeEmailVerificationAction(
  input: VerificationCodeInput & { flowId: string },
): Promise<AuthActionResult> {
  const parsed =
    createVerificationCodeSchema(serverValidationMessages).safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message };
  }
  if (!input.flowId) {
    return { ok: false, message: serverValidationMessages.invalidCode };
  }

  const providers = createProviderRegistry();
  try {
    await providers.auth.completeEmailVerification({
      flowId: input.flowId,
      code: parsed.data.code,
    });
  } catch (error) {
    return { ok: false, ...authActionFailure(error) };
  }

  await markAppSessionEmailVerified();
  return { ok: true };
}

export async function changePasswordAction(
  input: PasswordChangeInput,
): Promise<AuthActionResult> {
  const parsed =
    createPasswordChangeSchema(serverValidationMessages).safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message };
  }

  const providers = createProviderRegistry();
  try {
    await providers.auth.changePassword({
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.newPassword,
    });
  } catch (error) {
    return { ok: false, ...authActionFailure(error) };
  }

  return { ok: true };
}

export async function signOutAction(): Promise<AuthActionResult> {
  const providers = createProviderRegistry();
  let revocationError: unknown;
  try {
    await providers.auth.signOut();
  } catch (error) {
    revocationError = error;
  } finally {
    await clearMockSession();
  }

  if (revocationError) {
    // Best-effort logout: the local app session is already cleared, so the
    // user is signed out even when Kratos revocation fails. Log for operators
    // instead of returning an error-shaped message on a successful sign-out.
    console.error("Sign-out revocation failed:", revocationError);
  }
  return { ok: true };
}

function normalizeActionLocale(locale: string | undefined): AppLocale {
  if (routing.locales.includes(locale as AppLocale)) {
    return locale as AppLocale;
  }
  return routing.defaultLocale;
}
