"use server";

import { createProviderRegistry } from "@/lib/providers";
import { routing, type AppLocale } from "@/i18n/routing";
import {
  createRecoverySchema,
  createSignInSchema,
  createSignUpSchema,
  type AuthValidationMessages,
  type RecoveryInput,
  type SignInInput,
  type SignUpInput,
} from "./schemas";
import { clearMockSession, persistMockSession } from "./session";

const serverValidationMessages: AuthValidationMessages = {
  invalidEmail: "Please enter a valid email",
  weakPassword: "Password must be at least 8 characters",
  passwordsMismatch: "Passwords don't match",
};

export interface AuthActionResult {
  ok: boolean;
  message?: string;
  requiresEmailConfirmation?: boolean;
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
    await providers.auth.requestPasswordRecovery(parsed.data.email);
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

  return revocationError
    ? { ok: true, message: authActionErrorMessage(revocationError) }
    : { ok: true };
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

  const providerMessage = message.split(":").at(-1)?.trim();
  if (providerMessage) {
    return providerMessage;
  }

  return "Authentication failed. Please try again.";
}
