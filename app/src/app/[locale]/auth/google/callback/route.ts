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

  const returnToCode = request.nextUrl.searchParams.get("code");
  if (!returnToCode) {
    return NextResponse.redirect(failure);
  }
  const exchangeCode = await takeGoogleExchangeCode();
  if (!exchangeCode) {
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
  } catch {
    return NextResponse.redirect(failure);
  }

  return NextResponse.redirect(
    new URL(`/${activeLocale}/dashboard`, request.nextUrl.origin),
  );
}
