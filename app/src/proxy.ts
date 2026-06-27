import createMiddleware from "next-intl/middleware";
import type { NextRequest, NextResponse } from "next/server";
import { NextResponse as MiddlewareResponse } from "next/server";
import { routing } from "./i18n/routing";

const APP_SESSION_COOKIE = "capsule_zero_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
const SESSION_COOKIE_VERSION = "v1";
const LOCAL_SESSION_SIGNING_SECRET = "capsule-zero-local-session-secret";
const REFRESH_WINDOW_MS = 60_000;

interface PersistedAppSession {
  userId: string;
  email: string;
  name?: string;
  accessToken?: string;
  refreshToken?: string;
  createdAt?: string;
  expiresAt: string;
}

interface SupabaseRefreshResponse {
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  expires_in?: number;
  user?: {
    id?: string;
    email?: string;
    created_at?: string;
    user_metadata?: Record<string, unknown>;
  };
}

interface RefreshedSessionCookie {
  requestHeaders: Headers;
  value: string;
}

const intlMiddleware = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const refreshed = await maybeRefreshAppSessionCookie(request);
  const response = intlMiddleware(request);

  if (!refreshed) {
    return response;
  }

  response.cookies.set(APP_SESSION_COOKIE, refreshed.value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
  applyRequestHeaderOverrides(response, refreshed.requestHeaders);

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};

async function maybeRefreshAppSessionCookie(
  request: NextRequest,
): Promise<RefreshedSessionCookie | null> {
  if (process.env.CAPSULE_PROVIDER_MODE === "mock") {
    return null;
  }

  const rawSession = request.cookies.get(APP_SESSION_COOKIE)?.value;
  if (!rawSession) {
    return null;
  }

  const persisted = await parseSignedSession(rawSession);
  if (
    !persisted?.accessToken ||
    !persisted.refreshToken ||
    !needsRefresh(persisted.expiresAt)
  ) {
    return null;
  }

  const refreshed = await refreshSupabaseSession(persisted);
  if (!refreshed) {
    return null;
  }

  const value = await serializeSignedSession(refreshed);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(
    "cookie",
    upsertCookieHeader(request.headers.get("cookie"), APP_SESSION_COOKIE, value),
  );

  return { requestHeaders, value };
}

function needsRefresh(expiresAt: string): boolean {
  const expiresAtMs = Date.parse(expiresAt);
  return (
    !Number.isFinite(expiresAtMs) ||
    expiresAtMs <= Date.now() + REFRESH_WINDOW_MS
  );
}

async function refreshSupabaseSession(
  persisted: PersistedAppSession,
): Promise<PersistedAppSession | null> {
  const tokenUrl = supabaseRefreshTokenUrl();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!tokenUrl || !anonKey || !persisted.refreshToken) {
    return null;
  }

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${anonKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ refresh_token: persisted.refreshToken }),
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as SupabaseRefreshResponse;
  const accessToken = payload.access_token;
  const refreshToken = payload.refresh_token ?? persisted.refreshToken;
  if (!accessToken || !refreshToken) {
    return null;
  }

  return {
    ...persisted,
    userId: payload.user?.id ?? persisted.userId,
    email: payload.user?.email ?? persisted.email,
    name: readMetadataName(payload.user?.user_metadata) ?? persisted.name,
    createdAt: payload.user?.created_at ?? persisted.createdAt,
    accessToken,
    refreshToken,
    expiresAt: readExpiresAt(payload, persisted.expiresAt),
  };
}

function supabaseRefreshTokenUrl(): string | null {
  const baseUrl = (
    process.env.SUPABASE_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ""
  )
    .trim()
    .replace(/\/$/, "");

  return baseUrl ? `${baseUrl}/auth/v1/token?grant_type=refresh_token` : null;
}

function readExpiresAt(
  payload: SupabaseRefreshResponse,
  fallback: string,
): string {
  if (payload.expires_at) {
    return new Date(payload.expires_at * 1000).toISOString();
  }

  if (payload.expires_in) {
    return new Date(Date.now() + payload.expires_in * 1000).toISOString();
  }

  return fallback;
}

function readMetadataName(
  metadata: Record<string, unknown> | undefined,
): string | undefined {
  const name = metadata?.name ?? metadata?.full_name;
  return typeof name === "string" ? name : undefined;
}

function applyRequestHeaderOverrides(
  response: NextResponse,
  requestHeaders: Headers,
): void {
  const override = MiddlewareResponse.next({
    request: { headers: requestHeaders },
  });

  override.headers.forEach((value, key) => {
    if (key !== "x-middleware-next") {
      response.headers.set(key, value);
    }
  });
}

async function serializeSignedSession(
  value: PersistedAppSession,
): Promise<string> {
  const payload = bytesToBase64Url(
    new TextEncoder().encode(JSON.stringify(value)),
  );
  const signature = await signSessionPayload(payload);
  return `${SESSION_COOKIE_VERSION}.${payload}.${signature}`;
}

async function parseSignedSession(
  rawValue: string,
): Promise<PersistedAppSession | null> {
  const parts = rawValue.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [version, payload, signature] = parts;
  if (version !== SESSION_COOKIE_VERSION || !payload || !signature) {
    return null;
  }

  if (!(await verifySessionSignature(payload, signature))) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(payload)),
    ) as PersistedAppSession;
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

async function signSessionPayload(payload: string): Promise<string> {
  const secret = sessionSigningSecret();
  if (!secret) {
    return "";
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );

  return bytesToBase64Url(new Uint8Array(signature));
}

async function verifySessionSignature(
  payload: string,
  signature: string,
): Promise<boolean> {
  const expected = await signSessionPayload(payload);
  return Boolean(expected) && timingSafeEqualString(signature, expected);
}

function sessionSigningSecret(): string | undefined {
  const configuredSecret =
    process.env.SESSION_SIGNING_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.JWT_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim();

  if (configuredSecret) {
    return configuredSecret;
  }

  return process.env.NODE_ENV !== "production"
    ? LOCAL_SESSION_SIGNING_SECRET
    : undefined;
}

function timingSafeEqualString(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return diff === 0;
}

function upsertCookieHeader(
  cookieHeader: string | null,
  name: string,
  value: string,
): string {
  const nextCookie = `${name}=${value}`;
  const otherCookies = (cookieHeader ?? "")
    .split(";")
    .map((cookie) => cookie.trim())
    .filter((cookie) => cookie && !cookie.startsWith(`${name}=`));

  return [nextCookie, ...otherCookies].join("; ");
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}
