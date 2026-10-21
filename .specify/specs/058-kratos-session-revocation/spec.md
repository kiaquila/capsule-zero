# Spec 058 — Kratos session revocation

## Goal

Allow an authenticated user to end one other session or all other sessions while preserving the current login.

## Scope

Extend the existing session inventory, public Kratos client, Go auth routes, API provider and EN/RU profile controls. No admin API, identity selector, new database, provider legacy changes, or inferred device metadata. Existing logout remains the way to end the current session.

## Acceptance Criteria

- AC-001: DELETE /api/auth/sessions/{id} ends only a session owned by the authenticated identity; UUID validation and exact current-session protection happen before mutation. DELETE /api/auth/sessions ends all other sessions through Kratos's native atomic exclusion.
- AC-002: Missing/expired authentication fails 401, invalid/current targets fail 400, foreign/missing targets are safe 204 no-ops, outages fail 502. No redirects forward credentials; responses are private/no-store and share the session rate limiter.
- AC-003: Signed-token API provider and server action expose optional revocation capability, validate target input, propagate failures, and never report success for unsupported providers or failed writes.
- AC-004: EN/RU controls exist only for other sessions when supported. Pending disables all revoke controls, failures preserve rows with localized feedback, successful single/bulk actions remove confirmed targets while current remains. Buttons never submit the surrounding profile form.
- AC-005: Verify real Kratos v26.2.0 single/bulk revocation, current preservation and owner isolation; complete native review, five green gates, >=120s stable readiness, normal merge and production CD with matching live SHA.

## Negative Scenarios

Attempt current, malformed, foreign and expired-token revocation; reject upstream failure without hiding rows or pretending success. Production smoke uses unauthenticated requests only; authenticated mutation tests use disposable local identities.
