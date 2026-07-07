# Spec 037 — Google Sign-In (native-flow OIDC via Kratos)

## Goal

Users can create an account and sign in to Capsule Zero with their Google
account — one click on `/auth`, through Google's consent screen, and back to
the dashboard with the standard app session — without weakening the spec-024
edge posture (browser never talks to Kratos; sessions stay token-based).

## Scope

**In:**

- Kratos `oidc` method with a single `google` provider, **disabled by
  default** and switched on per-environment via compose env
  (`SELFSERVICE_METHODS_OIDC_ENABLED` + `SELFSERVICE_METHODS_OIDC_CONFIG_PROVIDERS`
  as a JSON value; the client secret never enters the repo). Claim mapping via
  `infra/kratos/oidc.google.jsonnet` (email required + `email_verified`
  asserted, `given_name` → `name.first`; the `locale` trait is not mapped —
  Google locales like `en-US` are outside the `en|ru` enum).
- **Native-app OIDC flow with session-token exchange** (the architecture
  decision of this spec): the Go API creates an API login flow with
  `return_session_token_exchange_code=true`, submits `method=oidc`, and hands
  the browser the Google redirect URL. After Google → Kratos callback, Kratos
  redirects to the app's callback route with a `code`; the Go API exchanges
  `init_code + return_to_code` at `/sessions/token-exchange` (internal
  network) for the same session-token shape every other auth flow returns.
  The Kratos *browser* flow (cookie sessions) is deliberately not used — the
  stack has no consumer for `ory_kratos_session` cookies.
- Edge: exactly **one** Kratos public path opens at the edge —
  `location = /self-service/methods/oidc/callback/google` (exact match,
  auth rate-limit bucket) in the host nginx config and its container-nginx
  rollback mirror. `^~ /self-service/` stays 404 for everything else.
  Kratos public port 4433 is published on host loopback for the edge proxy
  (same posture as web:3000 / api:8080).
- Go API (auth bounded context):
  - `GET  /api/auth/providers` — `{ "google": bool }` from
    `AUTH_GOOGLE_ENABLED`; the web uses it to show/hide the button.
  - `POST /api/auth/google/start` — `{returnTo}` →
    `{redirectUrl, exchangeCode}`; 404 when the provider is disabled.
  - `POST /api/auth/google/complete` — `{exchangeCode, returnToCode}` →
    standard auth response (session + user + profile via
    `EnsureForIdentity`, same as password login).
- Web `/app` (reusing existing auth styles/actions/i18n patterns):
  - "Continue with Google" button on AuthPanel (sign-in and sign-up modes),
    design-system social-button surface (`rgba(255,255,255,.28)`),
    monochrome white G glyph (achromatic interface rule; no brand colors).
    Hidden when the provider reports Google disabled.
  - Server actions: start (stores the exchange code in a short-lived
    httpOnly cookie, returns the Google redirect URL) and the
    `/[locale]/auth/google/callback` **route handler** that completes the
    exchange, persists the standard signed app-session cookie, and redirects
    to the dashboard; failures land on `/auth?googleError=1` with a localized
    message.
  - Optional `AuthPort` extensions (`googleSignInEnabled` /
    `startGoogleSignIn` / `completeGoogleSignIn`) — optional so the frozen
    Supabase provider is not touched (AGENTS §8).
  - Mock provider implements the loop deterministically so the
    provider-agnostic e2e can click through it.
- Contract: `docs_capsule_zero/adr/openapi.yaml` + regenerated
  `app/src/lib/api/generated/openapi.ts` for the three new endpoints.
- Docs actualized in the same PR (AGENTS §9): constitution §V, AGENTS.md
  Phase-4 auth row + provider gates, ADR-002 auth, backend/frontend docs,
  ui-texts EN/RU, f-002-auth + screen-auth, operator runbook
  `docs_capsule_zero/project/devops/google-oauth-setup.md`, deploy env
  templates.

**Out (explicitly):**

- **Apple Sign-In** — separate slice (paid Apple Developer setup; Stage 2).
- **Account linking.** A Google sign-in whose email already belongs to a
  password identity is **not** auto-merged: Kratos rejects the duplicate
  identifier and the user lands back on `/auth` with the standard localized
  Google-error message ("sign in with your password"). Linking via the
  settings flow is a follow-up (Known Issues).
- Auto-marking the Google email as verified in Kratos. OSS Kratos v1.3 has no
  mapper hook for `verifiable_addresses`; Google users get the existing
  non-blocking verify-email banner (Known Issues; founder may waive later).
- Mobile (React Native) Google SDK `id_token` flow — same Kratos provider
  config will serve it when `/mobile` ships.

## User story

As a new or returning user on the auth screen, I click **Continue with
Google**, approve the Google consent screen, and land on my dashboard signed
in — no password to invent or remember. (Spec 001 US-002 social-auth path.)

## Acceptance criteria

1. With Google enabled, `/auth` (popup and standalone; sign-in and sign-up
   modes) shows the Google button; with it disabled, the button is absent.
2. Clicking the button drives the full loop and ends authenticated on
   `/dashboard` with the standard app session (survives reload).
3. New Google identities get a profile via the same `EnsureForIdentity` path
   as password registration (email + first name from Google claims).
4. The edge serves **only** the exact callback path from Kratos public;
   `/self-service/anything-else` still 404s.
5. All three new endpoints appear in `openapi.yaml` and the regenerated
   client; `npm run check:api-contract` passes.

## Negative scenarios

1. Callback reached **without** a `code` (user canceled at Google, duplicate
   email rejected by Kratos, or direct navigation): no session is created and
   the user lands on `/auth` with a localized error message (EN/RU).
2. `POST /api/auth/google/complete` with a wrong/expired/reused exchange code
   pair: 401 with machine code `GOOGLE_SIGN_IN_FAILED`, no session issued.
3. `POST /api/auth/google/start` while `AUTH_GOOGLE_ENABLED=false`: 404, and
   Kratos-side OIDC stays disabled (defense in depth).

## Deploy-order note (merge = prod deploy)

Before merging, the operator installs on the prod host env file:
`KRATOS_OIDC_ENABLED=true`, `KRATOS_OIDC_PROVIDERS=<JSON with client id/secret>`,
`AUTH_GOOGLE_ENABLED=true` — see the runbook. Without them the stack deploys
with Google sign-in cleanly **off** (button hidden, endpoints 404) — the
slice degrades gracefully rather than failing.
