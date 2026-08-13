import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";
import type { Session } from "@/lib/providers";
import {
  parseLegacySession,
  parseSignedSession,
  serializeSignedSession,
  type PersistedAppSession,
} from "./session-codec";

const APP_SESSION_COOKIE = "capsule_zero_session";
const LEGACY_MOCK_SESSION_COOKIE = "capsule_zero_mock_session";
const COOKIE_WRITE_PROBE = "capsule_zero_cookie_write_probe";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export type PersistedMockSession = PersistedAppSession;

export async function persistAppSession(session: Session) {
  await writeAppSessionCookie(toPersistedAppSession(session));
}

export async function readSignedAppSession(): Promise<PersistedAppSession | null> {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(APP_SESSION_COOKIE)?.value;

  if (rawValue) {
    return parseSignedSession(rawValue);
  }

  const legacyMockValue = cookieStore.get(LEGACY_MOCK_SESSION_COOKIE)?.value;
  if (legacyMockValue && allowLegacyMockSession()) {
    return parseLegacySession(legacyMockValue);
  }

  return null;
}

export async function canWriteAppSessionCookie(): Promise<boolean> {
  const cookieStore = await cookies();

  try {
    cookieStore.set(COOKIE_WRITE_PROBE, "", {
      path: "/",
      maxAge: 0,
    });
    return true;
  } catch (error) {
    if (isReadonlyCookieMutationError(error)) {
      return false;
    }
    throw error;
  }
}

export async function readAppSession(): Promise<PersistedAppSession | null> {
  return readVerifiedAppSession();
}

async function resolveVerifiedAppSession(): Promise<PersistedAppSession | null> {
  const persisted = await readSignedAppSession();
  if (!persisted) {
    return null;
  }

  if (isNonProductionMockProviderMode()) {
    return persisted;
  }

  const { createProviderRegistry } = await import("@/lib/providers/registry");
  const session = await createProviderRegistry().auth.getCurrentSession();
  if (!session) {
    return null;
  }
  const live = toPersistedAppSession(session);
  return {
    ...live,
    // whoami cannot know the after-sign-up verification flow (only the
    // registration response carries it), so keep the cookie's copy — the
    // verify-email banner submits the emailed code against it. Live
    // emailVerified stays authoritative when the provider reports one.
    verificationFlowId: live.verificationFlowId ?? persisted.verificationFlowId,
    emailVerified: live.emailVerified ?? persisted.emailVerified,
  };
}

export const readVerifiedAppSession = cache(resolveVerifiedAppSession);

export async function clearAppSession() {
  const cookieStore = await cookies();
  cookieStore.delete(APP_SESSION_COOKIE);
  cookieStore.delete(LEGACY_MOCK_SESSION_COOKIE);
}

function toPersistedAppSession(session: Session): PersistedAppSession {
  return {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    createdAt: session.user.createdAt,
    expiresAt: session.expiresAt,
    verificationFlowId: session.verificationFlowId,
    emailVerified: session.user.emailVerified,
  };
}

// markAppSessionEmailVerified records a completed email verification in the
// signed session cookie so the banner stays dismissed across requests even
// when the provider cannot report live state (mock mode). The live whoami
// value still wins where available (spec 035).
export async function markAppSessionEmailVerified(): Promise<void> {
  const persisted = await readSignedAppSession();
  if (!persisted) {
    return;
  }
  await writeAppSessionCookie({
    ...persisted,
    emailVerified: true,
    verificationFlowId: undefined,
  });
}

async function writeAppSessionCookie(
  value: PersistedAppSession,
): Promise<boolean> {
  const cookieStore = await cookies();
  cookieStore.set(APP_SESSION_COOKIE, await serializeSignedSession(value), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
  return true;
}

function isReadonlyCookieMutationError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes("Cookies can only be modified")
  );
}

function allowLegacyMockSession(): boolean {
  return isNonProductionMockProviderMode();
}

function isNonProductionMockProviderMode(): boolean {
  return (
    (process.env.CAPSULE_PROVIDER_MODE ?? "mock") === "mock" &&
    process.env.NODE_ENV !== "production"
  );
}

export const persistMockSession = persistAppSession;
export const readMockSession = readVerifiedAppSession;
export const clearMockSession = clearAppSession;
