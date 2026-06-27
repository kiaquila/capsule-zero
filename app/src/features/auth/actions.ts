"use server";

import { createProviderRegistry } from "@/lib/providers";
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
  input: SignUpInput,
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
  await providers.auth.signOut();
  await clearMockSession();

  return { ok: true };
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
