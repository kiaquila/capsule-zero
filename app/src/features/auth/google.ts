import "server-only";

import { cookies, headers } from "next/headers";
import { createProviderRegistry } from "@/lib/providers";

// Google sign-in server helpers (spec 037): provider availability for the
// button, the app origin for the OIDC return_to, and the short-lived
// httpOnly cookie that carries the session-token exchange (init) code across
// the consent-screen round-trip. The callback route consumes the cookie.

const GOOGLE_EXCHANGE_COOKIE = "capsule_zero_google_exchange";
// Matches the Kratos login-flow lifespan (10m) — the exchange code dies with
// the flow, so a longer cookie would only linger uselessly.
const EXCHANGE_MAX_AGE_SECONDS = 60 * 10;

export async function googleSignInAvailable(): Promise<boolean> {
  const { auth } = createProviderRegistry();
  if (!auth.googleSignInEnabled) {
    return false;
  }
  try {
    return await auth.googleSignInEnabled();
  } catch {
    // An unreachable API means no button, not a broken page render.
    return false;
  }
}

/**
 * Canonical app origin for the OIDC return_to. The configured public URL
 * wins so a client-controlled Host header can never steer the redirect;
 * request headers are only a dev/e2e convenience where the env is unset.
 */
export async function appOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) {
    return configured.replace(/\/+$/, "");
  }
  const incoming = await headers();
  const proto = incoming.get("x-forwarded-proto") ?? "http";
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host");
  return `${proto}://${host}`;
}

export async function storeGoogleExchangeCode(code: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(GOOGLE_EXCHANGE_COOKIE, code, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: EXCHANGE_MAX_AGE_SECONDS,
  });
}

/** Read and clear the exchange code — each code pair is single-use. */
export async function takeGoogleExchangeCode(): Promise<string | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(GOOGLE_EXCHANGE_COOKIE)?.value ?? null;
  if (value !== null) {
    cookieStore.delete(GOOGLE_EXCHANGE_COOKIE);
  }
  return value;
}
