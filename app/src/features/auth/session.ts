import "server-only";

import { cookies } from "next/headers";
import type { Session } from "@/lib/providers";

const MOCK_SESSION_COOKIE = "capsule_zero_mock_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export interface PersistedMockSession {
  userId: string;
  email: string;
  name?: string;
  expiresAt: string;
}

export async function persistMockSession(session: Session) {
  const cookieStore = await cookies();
  const value: PersistedMockSession = {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    expiresAt: session.expiresAt,
  };

  cookieStore.set(MOCK_SESSION_COOKIE, encodeURIComponent(JSON.stringify(value)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function readMockSession(): Promise<PersistedMockSession | null> {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(MOCK_SESSION_COOKIE)?.value;

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(rawValue)) as PersistedMockSession;

    if (!parsed.email || !parsed.userId || Date.parse(parsed.expiresAt) < Date.now()) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function clearMockSession() {
  const cookieStore = await cookies();
  cookieStore.delete(MOCK_SESSION_COOKIE);
}
