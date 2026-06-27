import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import type { Session } from "@/lib/providers";

const APP_SESSION_COOKIE = "capsule_zero_session";
const LEGACY_MOCK_SESSION_COOKIE = "capsule_zero_mock_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
const SESSION_COOKIE_VERSION = "v1";
const LOCAL_SESSION_SIGNING_SECRET = "capsule-zero-local-session-secret";

export interface PersistedAppSession {
  userId: string;
  email: string;
  name?: string;
  accessToken?: string;
  refreshToken?: string;
  createdAt?: string;
  expiresAt: string;
}

export type PersistedMockSession = PersistedAppSession;

export async function persistAppSession(session: Session) {
  await writeAppSessionCookie(toPersistedAppSession(session));
}

export async function persistAppSessionIfWritable(
  session: Session,
): Promise<boolean> {
  return writeAppSessionCookie(toPersistedAppSession(session), {
    ignoreReadonly: true,
  });
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

export async function readAppSession(): Promise<PersistedAppSession | null> {
  return readVerifiedAppSession();
}

export async function readVerifiedAppSession(): Promise<PersistedAppSession | null> {
  const persisted = await readSignedAppSession();
  if (!persisted) {
    return null;
  }

  if (process.env.CAPSULE_PROVIDER_MODE === "mock") {
    return persisted;
  }

  const { createProviderRegistry } = await import("@/lib/providers/registry");
  const session = await createProviderRegistry().auth.getCurrentSession();
  return session ? toPersistedAppSession(session) : null;
}

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
  };
}

async function writeAppSessionCookie(
  value: PersistedAppSession,
  options: { ignoreReadonly?: boolean } = {},
): Promise<boolean> {
  const cookieStore = await cookies();

  try {
    cookieStore.set(APP_SESSION_COOKIE, serializeSignedSession(value), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: MAX_AGE_SECONDS,
    });
    return true;
  } catch (error) {
    if (options.ignoreReadonly && isReadonlyCookieMutationError(error)) {
      return false;
    }
    throw error;
  }
}

function isReadonlyCookieMutationError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes("Cookies can only be modified")
  );
}

function serializeSignedSession(value: PersistedAppSession): string {
  const payload = Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
  const signature = signSessionPayload(payload);
  return `${SESSION_COOKIE_VERSION}.${payload}.${signature}`;
}

function parseSignedSession(rawValue: string): PersistedAppSession | null {
  const parts = rawValue.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [version, payload, signature] = parts;
  if (version !== SESSION_COOKIE_VERSION || !payload || !signature) {
    return null;
  }

  if (!verifySessionSignature(payload, signature)) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as PersistedAppSession;
    return validatePersistedSession(parsed);
  } catch {
    return null;
  }
}

function parseLegacySession(rawValue: string): PersistedAppSession | null {
  try {
    const parsed = JSON.parse(decodeURIComponent(rawValue)) as PersistedAppSession;
    return validatePersistedSession(parsed);
  } catch {
    return null;
  }
}

function validatePersistedSession(
  parsed: PersistedAppSession,
): PersistedAppSession | null {
  const expiresAt = Date.parse(parsed.expiresAt);
  if (
    !parsed.email ||
    !parsed.userId ||
    !Number.isFinite(expiresAt) ||
    (expiresAt < Date.now() && !parsed.refreshToken)
  ) {
    return null;
  }
  return parsed;
}

function signSessionPayload(payload: string): string {
  return createHmac("sha256", sessionSigningSecret())
    .update(payload)
    .digest("base64url");
}

function verifySessionSignature(payload: string, signature: string): boolean {
  const expected = signSessionPayload(payload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  return (
    actualBuffer.byteLength === expectedBuffer.byteLength &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

function sessionSigningSecret(): string {
  const configuredSecret =
    process.env.SESSION_SIGNING_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.JWT_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim();

  if (configuredSecret) {
    return configuredSecret;
  }

  if (process.env.NODE_ENV !== "production") {
    return LOCAL_SESSION_SIGNING_SECRET;
  }

  throw new Error(
    "CONFIGURATION_ERROR: SESSION_SIGNING_SECRET or SUPABASE_SERVICE_ROLE_KEY is required to sign Capsule Zero sessions.",
  );
}

function allowLegacyMockSession(): boolean {
  return process.env.CAPSULE_PROVIDER_MODE === "mock" && process.env.NODE_ENV !== "production";
}

export const persistMockSession = persistAppSession;
export const readMockSession = readVerifiedAppSession;
export const clearMockSession = clearAppSession;
