import createMiddleware from "next-intl/middleware";
import type { NextRequest, NextResponse } from "next/server";
import { NextResponse as MiddlewareResponse } from "next/server";
import {
  parseSignedSession,
  serializeSignedSession,
  type PersistedAppSession,
} from "@/features/auth/session-codec";
import { routing } from "./i18n/routing";

const APP_SESSION_COOKIE = "capsule_zero_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
const REFRESH_WINDOW_MS = 60_000;

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
  if (isNonProductionMockProviderMode()) {
    return null;
  }

  const rawSession = request.cookies.get(APP_SESSION_COOKIE)?.value;
  if (!rawSession) {
    return null;
  }

  try {
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
      upsertCookieHeader(
        request.headers.get("cookie"),
        APP_SESSION_COOKIE,
        value,
      ),
    );

    return { requestHeaders, value };
  } catch {
    return null;
  }
}

function needsRefresh(expiresAt: string): boolean {
  const expiresAtMs = Date.parse(expiresAt);
  return (
    !Number.isFinite(expiresAtMs) ||
    expiresAtMs <= Date.now() + REFRESH_WINDOW_MS
  );
}

function isNonProductionMockProviderMode(): boolean {
  return (
    (process.env.CAPSULE_PROVIDER_MODE ?? "mock") === "mock" &&
    process.env.NODE_ENV !== "production"
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
