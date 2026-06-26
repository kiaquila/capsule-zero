import "server-only";

import { cookies } from "next/headers";
import type { Session } from "@/lib/providers";

const APP_SESSION_COOKIE = "capsule_zero_session";
const LEGACY_MOCK_SESSION_COOKIE = "capsule_zero_mock_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export interface PersistedAppSession {
  userId: string;
  email: string;
  name?: string;
  accessToken?: string;
  createdAt?: string;
  expiresAt: string;
}

export type PersistedMockSession = PersistedAppSession;

export async function persistAppSession(session: Session) {
  const cookieStore = await cookies();
  const value: PersistedAppSession = {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    accessToken: session.accessToken,
    createdAt: session.user.createdAt,
    expiresAt: session.expiresAt,
  };

  cookieStore.set(APP_SESSION_COOKIE, encodeURIComponent(JSON.stringify(value)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function readAppSession(): Promise<PersistedAppSession | null> {
  const cookieStore = await cookies();
  const rawValue =
    cookieStore.get(APP_SESSION_COOKIE)?.value ??
    cookieStore.get(LEGACY_MOCK_SESSION_COOKIE)?.value;

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(rawValue)) as PersistedAppSession;

    if (!parsed.email || !parsed.userId || Date.parse(parsed.expiresAt) < Date.now()) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function clearAppSession() {
  const cookieStore = await cookies();
  cookieStore.delete(APP_SESSION_COOKIE);
  cookieStore.delete(LEGACY_MOCK_SESSION_COOKIE);
}

export const persistMockSession = persistAppSession;
export const readMockSession = readAppSession;
export const clearMockSession = clearAppSession;
