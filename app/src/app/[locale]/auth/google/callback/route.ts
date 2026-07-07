import { NextResponse, type NextRequest } from "next/server";
import { routing, type AppLocale } from "@/i18n/routing";
import { persistAppSession } from "@/features/auth/session";
import { takeGoogleExchangeCode } from "@/features/auth/google";
import { createProviderRegistry } from "@/lib/providers";

// Google OIDC callback landing (spec 037). Kratos redirects the browser here
// with the return_to `code`; together with the exchange code parked in the
// httpOnly cookie it buys the session token (server-side, via the provider),
// which is persisted as the standard signed app-session cookie. A route
// handler — not a page — because persisting the session mutates cookies.
//
// Every failure (canceled consent, duplicate email rejected by Kratos,
// missing/expired codes, direct navigation) lands on /auth?googleError=1
// with a localized message and no session (negative scenario 1).

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  const activeLocale: AppLocale = routing.locales.includes(locale as AppLocale)
    ? (locale as AppLocale)
    : routing.defaultLocale;
  const failure = new URL(
    `/${activeLocale}/auth?googleError=1`,
    request.nextUrl.origin,
  );

  // Consume the parked cookie on every path, including failures — the code
  // pair is single-use, so a stale cookie only lingers uselessly otherwise.
  const exchangeCode = await takeGoogleExchangeCode();
  const returnToCode = request.nextUrl.searchParams.get("code");
  if (!returnToCode || !exchangeCode) {
    return NextResponse.redirect(failure);
  }

  const { auth } = createProviderRegistry();
  if (!auth.completeGoogleSignIn) {
    return NextResponse.redirect(failure);
  }
  try {
    const session = await auth.completeGoogleSignIn({
      exchangeCode,
      returnToCode,
    });
    await persistAppSession(session);
  } catch (error) {
    // The user just sees /auth?googleError=1; leave operators the cause
    // (Kratos config drift, rejected exchange) in the server log.
    console.error("Google sign-in completion failed:", error);
    return NextResponse.redirect(failure);
  }

  return NextResponse.redirect(
    new URL(`/${activeLocale}/dashboard`, request.nextUrl.origin),
  );
}
