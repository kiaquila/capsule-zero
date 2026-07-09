import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Next 16 proxy (formerly `middleware`) entrypoint — next-intl locale routing
// only. Session lifetime is owned server-side: the `api` provider validates the
// Kratos session token per request via `/api/auth/whoami`, so no edge
// token-refresh is needed. The legacy edge session-refresh that used to live
// here was removed with the auth-provider retirement (spec 038).
export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
