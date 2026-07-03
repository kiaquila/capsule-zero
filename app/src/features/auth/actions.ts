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
  message?: string;
  requiresEmailConfirmation?: boolean;
  /** Flow the emailed one-time code is bound to (recovery/verification). */
  flowId?: string;
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
    return { ok: false, message: authActionErrorMessage(error) };
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
      name: parsed.data.name,
      locale: normalizeActionLocale(input.locale),
    });
    if (!session) {
      return { ok: true, requiresEmailConfirmation: true };
    }
    await persistMockSession(session);
  } catch (error) {
    return { ok: false, message: authActionErrorMessage(error) };
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
    return { ok: false, message: authActionErrorMessage(error) };
  }
}

export async function completePasswordRecoveryAction(
  input: RecoveryCompleteInput & { flowId: string },
): Promise<AuthActionResult> {
  const parsed =
    createRecoveryCompleteSchema(serverValidationMessages).safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message };
  }
  if (!input.flowId) {
    return { ok: false, message: serverValidationMessages.invalidCode };
  }

  const providers = createProviderRegistry();
  try {
    const session = await providers.auth.completePasswordRecovery({
      flowId: input.flowId,
      code: parsed.data.code,
      newPassword: parsed.data.newPassword,
    });
    await persistMockSession(session);
  } catch (error) {
    return { ok: false, message: authActionErrorMessage(error) };
  }

  return { ok: true };
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
    return { ok: false, message: authActionErrorMessage(error) };
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
    return { ok: false, message: authActionErrorMessage(error) };
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
    return { ok: false, message: authActionErrorMessage(error) };
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

function authActionErrorMessage(error: unknown): string {
  const message =
    error instanceof Error && error.message.trim()
      ? error.message
      : "Authentication failed. Please try again.";

  // Strip only a leading provider error code (e.g. "AUTH_FAILED: ..."),
  // keeping any colons inside the human-readable part of the message.
  const providerMessage = message.replace(/^[A-Z_]+:\s*/, "").trim();
  if (providerMessage) {
    return providerMessage;
  }

  return "Authentication failed. Please try again.";
}
