// Shared contract for the Google-callback origin guard (spec 037).
//
// The guard runs the /app in its production shape — the standalone server
// (`node server.js`) bound to HOSTNAME=0.0.0.0 — which is the only shape where
// the prod incident reproduces: with `trustHostHeader: false`, Next resolves
// `request.nextUrl.origin` to the bind (`http://0.0.0.0:PORT`), not the request
// Host header. `next dev` never runs this way, so the localhost suite can't
// catch a revert of the callback route to `request.nextUrl.origin`.
//
// NEXT_PUBLIC_APP_URL is baked to a canary origin that is DELIBERATELY neither
// the bind nor a reachable host. The fixed route builds its redirects from
// appOrigin() (→ this canary); the pre-fix route builds them from the request
// origin (→ 0.0.0.0). Asserting the redirect Location origin === this canary
// therefore fails red on the pre-fix route and passes green on the fix.
//
// Both the Playwright config (which bakes + serves the build) and the spec
// (which asserts the redirect target) import these constants, so they can
// never drift apart.

export const ORIGIN_GUARD_PORT = 3100;

/**
 * Canary public origin baked into the guard build via NEXT_PUBLIC_APP_URL.
 * A `.test` host that no bind or DNS will ever resolve to — the whole point is
 * that it differs from wherever the request actually arrives.
 */
export const ORIGIN_GUARD_CANARY_ORIGIN = "https://origin-guard.canary.test";
