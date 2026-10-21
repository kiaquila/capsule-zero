# Spec 057 — Real Kratos session inventory

## Goal

Replace the profile session-unavailable placeholder with the signed-in user's actual active Kratos sessions.

## Scope

Extend the existing Kratos client, auth routes, API provider and profile snapshot. Render current and other active sessions in EN/RU using existing profile styles. Read-only; no revocation, device inference, geolocation, schema or database migration, new service or Supabase changes.

## Decision

Kratos v26.2.0 public `GET /sessions` excludes the current session; combine it with `/sessions/whoami` using the same server-held token. Follow its Link pagination by copying only pagination parameters onto the configured public endpoint, never following an upstream URL with credentials. Keep a bounded 20-page budget and fail visibly rather than silently truncate. Expose only ID, exact current marker, authentication timestamp and expiry. Server-mediated sessions do not provide reliable browser/device identity or last activity, so do not invent those fields. Separate loaded-empty and unavailable states. Optional AuthPort capability keeps frozen providers unchanged. Revisit metadata only when real client capture is specified.

Sources: [versioned OpenAPI](https://github.com/ory/kratos/blob/v26.2.0/spec/api.json) and [session handler](https://github.com/ory/kratos/blob/v26.2.0/session/handler.go). Context7 was attempted and returned quota exceeded.

## Acceptance Criteria

- AC-001: Authenticated `GET /api/auth/sessions` lists current plus all other active sessions across pages, deduplicated; only exact current ID is marked current.
- AC-002: Missing/invalid credentials return 401; identity outages and malformed or incomplete inventory return 502. A token cannot select another identity, and no identity traits, tokens, network addresses or device guesses enter the response.
- AC-003: The API provider uses the signed session and no-store fetch. Profile loading maps inventory errors to unavailable without losing the profile; unsupported providers remain honest.
- AC-004: EN/RU rows show real localized authentication and expiry timestamps and one current badge. Loaded-empty differs from unavailable, with no sample rows.
- AC-005: Current-head native review and all five required checks pass; after at least two minutes of stable readiness, recheck and merge without bypass, then verify production CD and live commit health.

## Negative Scenarios

Invalid token, failed later page, pagination cycle/budget, untrusted next-link host, duplicate/inactive/expired records, unavailable inventory and empty inventory are covered. Device/location/activity fabrication and cross-account query selection are forbidden.

## Presentation

Dates use the selected EN/RU locale with explicit UTC to keep server/client rendering deterministic. Empty and unavailable are distinct read states; unsupported providers expose no inventory.

Real Kratos v26.2.0 smoke found that a zero-total empty list still carries an optimistic next Link. Regression committed in `c56784a`; only an empty decoded page AND explicit `X-Total-Count: 0` stops this traversal. Other empty pages continue following Link.
