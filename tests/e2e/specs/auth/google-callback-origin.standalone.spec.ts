import { expect, test } from "../../fixtures/base";
import {
  ORIGIN_GUARD_CANARY_ORIGIN,
  ORIGIN_GUARD_PORT,
} from "../../fixtures/origin-guard";

/**
 * Auth — Google callback redirect origin (spec 037, regression guard for the
 * PR #73 prod incident: sign-in landed on https://0.0.0.0:3000).
 *
 * Runs ONLY under the `origin-guard` Playwright project, which serves the /app
 * as the production standalone server (`node server.js`, HOSTNAME=0.0.0.0) with
 * NEXT_PUBLIC_APP_URL baked to a canary origin. That is the one shape where the
 * bug reproduces: with `trustHostHeader: false`, Next resolves
 * `request.nextUrl.origin` to the bind (`http://0.0.0.0:PORT`), never the
 * request Host — so a callback that redirects off the request origin strands
 * the browser on an unreachable host. `next dev` (the localhost suite) can't
 * reproduce this, so this guard is the only CI coverage for the fix.
 *
 * Request-level (no browser, maxRedirects: 0): the fix builds the redirect from
 * appOrigin() → the canary; a revert to request.nextUrl.origin → the 0.0.0.0
 * bind. Asserting the Location origin === the canary fails red on the pre-fix
 * route and passes green on the fix. No POM: there is no rendered UI here, only
 * the redirect a route handler returns.
 */
test.describe("Auth — Google callback redirect origin (standalone prod server)", () => {
  test("the failure redirect targets the configured origin, never the server bind", async ({
    request,
  }) => {
    // Negative scenario: a codeless callback (canceled consent / direct nav)
    // is the cheapest path that still exercises the redirect-origin choice —
    // it fails out before any provider call, on the same origin logic as the
    // success path.
    const response = await request.get("/en/auth/google/callback", {
      maxRedirects: 0,
    });

    expect(response.status()).toBe(307);

    // `?? ""` keeps the type a plain string; the truthiness assertion below
    // fails the test before `new URL` ever sees the empty fallback.
    const location = response.headers()["location"] ?? "";
    expect(location, "callback must issue a Location redirect").toBeTruthy();

    const target = new URL(location);
    // The core assertion: the redirect must leave on the configured public
    // origin, not wherever the request physically arrived. Pre-fix this is the
    // 0.0.0.0 bind and the browser is stranded.
    expect(target.origin).toBe(ORIGIN_GUARD_CANARY_ORIGIN);
    // And explicitly never the internal bind that caused the prod incident.
    expect(target.hostname).not.toBe("0.0.0.0");
    expect(target.port).not.toBe(String(ORIGIN_GUARD_PORT));

    // Still the localized error landing, so the guard fails for an origin
    // regression rather than a route reshuffle.
    expect(target.pathname).toBe("/en/auth");
    expect(target.searchParams.get("googleError")).toBe("1");
  });
});
