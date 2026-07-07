# Spec 037 — Tasks & Process Memory

## Tasks

1. Failing tests (Go + Playwright) — committed first (TDD).
2. Infra: Kratos oidc method (disabled default) + google jsonnet mapper +
   registration `after.oidc` session hook; compose env passthrough + Kratos
   4433 on host loopback; edge callback carve-out (host nginx + container
   mirror); deploy env templates.
3. Go: kratos client `OIDCStart`/`OIDCExchange`; auth handlers
   `Providers`/`GoogleStart`/`GoogleComplete`; config `AUTH_GOOGLE_ENABLED`;
   routes (start/complete in the strict auth bucket, providers in the
   session bucket).
4. Contract: openapi.yaml + regenerated web client.
5. Web: optional AuthPort methods; api + mock providers; server action +
   callback route handler; AuthPanel Google button + error state; i18n EN/RU.
6. Docs: constitution §V, AGENTS.md, ADR-002, backend/frontend docs,
   ui-texts, f-002-auth, screen-auth, google-oauth-setup runbook.
7. Verification per plan.md; draft PR with SENAR gate.

## Process Memory

### Decisions

- **2026-07-06 (assessment, recorded before implementation):** web Google
  sign-in uses the Kratos **native-app OIDC flow with session-token
  exchange**, not the browser flow. Reason: the stack's sessions are token
  based (signed app cookie holding a Kratos session token; Go API validates
  via `X-Session-Token` whoami) and the edge keeps Kratos public closed.
  The browser flow would mint an `ory_kratos_session` cookie nothing
  consumes and would require exposing the full login/registration browser
  surface at the edge.
- **2026-07-06:** the `AuthPort` Google methods are **optional** members so
  the frozen Supabase provider (AGENTS §8) is not edited; UI hides the
  button when the provider lacks them or reports disabled.
- **2026-07-06:** provider credentials enter only via env
  (`SELFSERVICE_METHODS_OIDC_CONFIG_PROVIDERS` JSON) on the host env file;
  repo carries no client id/secret. Everything defaults to **off** so a
  merge without operator prep deploys with Google cleanly hidden.
- **2026-07-06:** achromatic-interface rule wins over Google brand colors:
  monochrome white "G" glyph on the design-system social button surface.

### Dead Ends

- **Kratos browser OIDC flow** (standard docs path) — rejected for this
  stack; see the first decision. Not attempted in code.

### Known Issues

- **No account linking (v0.1):** Google sign-in with an email that already
  has a password identity is rejected by Kratos (duplicate identifier); the
  user is told to sign in with the password. Settings-flow linking is a
  follow-up slice.
- **Google emails still get the verify-email banner:** OSS Kratos v1.3
  mappers cannot mark `verifiable_addresses` verified, so a Google sign-up
  receives the standard non-blocking verification code email despite
  `email_verified=true` from Google. Acceptable for v0.1; candidates:
  admin-API patch after exchange, or a Kratos upgrade if the option lands.
- **Consent dance not covered in CI:** unit tests pin the Kratos payload
  shapes; the real Google round-trip is a post-rollout operator smoke
  (plan.md row 9).
