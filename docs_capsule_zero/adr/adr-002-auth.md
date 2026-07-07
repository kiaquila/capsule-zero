# ADR-002: Auth

## Status

Accepted (rewritten 2026-06-27 for the production-stack pivot).

## Context

US-002 and US-003 use staged auth scope.

v0.1 requires registration and login through:

- email/password
- Google sign-in (pulled forward from Stage 2 by spec 037)

Stage 2 adds:

- Apple Sign-In

The app must preserve sessions between visits, support password recovery, store optional location and language preferences, and redirect authenticated users to the dashboard. Auth must also secure private wardrobe items, photos, capsules, payments, and profile data across web and React Native mobile clients.

The previous Phase 4 choice (Supabase Auth) is dropped together with Supabase. The replacement must run self-hosted on the production server, integrate cleanly with the Go monolith and React Native client, and deliver email verification and password reset using Resend.

## Decision

Use **Ory Kratos** as the identity provider, fronted by nginx `auth_request`, with the Go monolith owning the application-level session cookie/JWT.

Implementation rules:

- Run Ory Kratos as a docker-compose service, configured headless: the Capsule Zero UI (Next.js for web, React Native for mobile) renders all auth screens, while Kratos handles the identity/session machinery over its self-service API.
- Use Kratos identity schema fields: `traits.email`, `traits.name.first` (optional), `traits.locale`.
- Email flows (verification, recovery, password change) are delivered by Kratos through the SMTP courier connected to Resend (`smtps://…@smtp.resend.com:2465/` — Hetzner blocks outbound 25/465, so the courier uses Resend's 2465 implicit-TLS port). Since spec 035 both flows run the one-time-code method as server-side API flows driven by the Go API; the web UI ships the flow-aware completion steps (recovery code entry on /auth, the verify-email banner, and /verify-email for emailed verification links).
- nginx runs an `auth_request` subrequest against the Kratos session check on protected routes; the Go API also validates the Kratos session cookie on every request.
- The Go monolith maps `kratos_identity_id` → `profiles.id` on first sign-in and stores `display_name`, `language`, `country`, `city`, and `coin_balance` in its own Postgres tables.
- Email/password registration, login, code-method password recovery, code-method email verification, and password change are active in v0.1 (spec 035). Sign-up keeps the auto-login `session` hook; verification is non-blocking (founder decision 2026-07-03).
- Google sign-in is active in v0.1 (spec 037) through the Kratos **native-app OIDC flow with session-token exchange** — not the browser flow — because sessions are token-based and the edge keeps Kratos public closed except for the exact `/self-service/methods/oidc/callback/google` path. The Go API owns `/api/auth/providers`, `/api/auth/google/start`, and `/api/auth/google/complete`; provider credentials enter only via the host env file (`SELFSERVICE_METHODS_OIDC_CONFIG_PROVIDERS`), and everything defaults to off (`AUTH_GOOGLE_ENABLED=false`). Account linking for duplicate emails and auto-verified Google addresses are recorded follow-ups (spec 037 Known Issues). Operator runbook: `docs_capsule_zero/project/devops/google-oauth-setup.md`. Apple Sign-In stays behind the Stage 2 social-auth integration gate.
- Configure mobile deep links for OAuth callbacks in Stage 2 (React Native submits the Google SDK `id_token` to the same Kratos provider config; Kratos validates the flow). Payment-return deep links are deferred — v0.1 mobile has no purchase CTA.
- Persist language preference on `profiles.language` (allowed values: `en`, `ru`).
- Persist optional `country` and `city` on `profiles`, but never block registration if absent.
- Use inline UI errors with Capsule Zero yellow `#FFD600`; no alert popups.
- Production secrets (Kratos cookie/session secret, Resend API key) live only in the droplet's encrypted `.env` and provider dashboards.

## Data Model

`profiles`

| Field                | Type          | Notes                                                 |
| -------------------- | ------------- | ----------------------------------------------------- |
| `id`                 | uuid PK       | Internal app primary key                              |
| `kratos_identity_id` | uuid unique   | References Kratos identity                            |
| `display_name`       | text          | User-editable                                         |
| `avatar_asset_id`    | uuid nullable | References selected avatar asset                      |
| `language`           | text          | `en`, `ru`; default `en`. `es-AR` is deferred to v0.2 |
| `country`            | text nullable | Optional                                              |
| `city`               | text nullable | Optional                                              |
| `coin_balance`       | integer       | Cached from coin ledger; ledger is canonical          |
| `created_at`         | timestamptz   | Server-generated                                      |
| `updated_at`         | timestamptz   | Server-generated                                      |

`coin_ledger`

| Field             | Type          | Notes                                                                               |
| ----------------- | ------------- | ----------------------------------------------------------------------------------- |
| `id`              | uuid PK       |                                                                                     |
| `user_id`         | uuid          | References `profiles.id`; canonical ownership column                                |
| `delta`           | integer       | Positive for purchase, negative for spend/refund                                    |
| `reason`          | text          | `lava_purchase`, `extra_capsule`, `photo_enhancement`, `refund`, `admin_adjustment` |
| `lava_event_id`   | text nullable | References `lava_events.id` when the ledger row came from a Lava.top webhook        |
| `lava_invoice_id` | text nullable | Payment/invoice traceability                                                        |
| `created_at`      | timestamptz   |                                                                                     |

`lava_events`

| Field               | Type                 | Notes                                                              |
| ------------------- | -------------------- | ------------------------------------------------------------------ |
| `id`                | text PK              | Provider event ID, contract ID, or invoice-derived idempotency key |
| `lava_invoice_id`   | text nullable        | Invoice/payment traceability                                       |
| `event_type`        | text                 | Provider event type                                                |
| `payload_hash`      | text                 | Hash of normalized payload for replay/debug checks                 |
| `payload`           | jsonb                | Raw provider payload for audit/debug                               |
| `processing_status` | text                 | `received`, `processed`, `ignored`, or `failed`                    |
| `received_at`       | timestamptz          | Server-generated                                                   |
| `processed_at`      | timestamptz nullable | Set after fulfillment attempt                                      |
| `error_message`     | text nullable        | Internal failure detail                                            |

The coin tables ship in the schema from Day 1 so the ledger contract is stable, but coin purchases and image-enhancement spends are v0.2 features. v0.1 keeps Lava.top stubbed and the spend reasons unused.

## Authorization

Postgres RLS is not used. Authorization is enforced in the Go monolith on every request:

- Every authenticated handler resolves `user_id` from the Kratos session before any data access.
- Repository methods take `user_id` as a parameter and only return rows owned by that user, except for explicit public-catalog reads.
- Public catalog reads (`items.visibility = 'public'`) are served through a dedicated read path that does not require a session.
- Coin ledger inserts are server-only and only callable from internal billing/webhook handlers.
- Admin moderation routes require an admin role claim attached to the Kratos identity.

## Consequences

Positive:

- Auth identity lives in a self-hosted, open-source product the team controls.
- Kratos handles password hashing, MFA upgrade paths, recovery tokens, and verification flows — we do not roll our own.
- The Go monolith owns the business identity (`profiles.id`) and is free to evolve independent of Kratos schema.
- Email flows reuse the same Resend account the rest of the platform uses, with SPF/DKIM published once for `capsulezero.app`.
- Web and mobile share one auth authority and one set of session semantics.
- No vendor lock-in: Kratos can move droplets or be swapped out behind the same Go interface.

Tradeoffs:

- We own the Kratos config, migrations, and upgrade cycle.
- The nginx `auth_request` path adds one in-cluster hop on protected requests (cheap, but real).
- OAuth provider setup must happen in Kratos and provider dashboards before Stage 2 social auth QA, staging, or launch.
- Apple Sign-In may not always provide name metadata on repeat sign-ins, so Stage 2 profile completion must tolerate missing provider names.
- React Native requires deep-link configuration, secure token storage, and platform-specific OAuth redirect testing in Stage 2.

## References

- Ory Kratos docs: https://www.ory.sh/docs/kratos/
- Kratos self-service flows: https://www.ory.sh/docs/kratos/self-service
- Kratos identity schema: https://www.ory.sh/docs/kratos/manage-identities/identity-schema
- Resend SMTP: https://resend.com/docs/send-with-smtp
- nginx `auth_request`: https://nginx.org/en/docs/http/ngx_http_auth_request_module.html
- React Native deep links: https://reactnative.dev/docs/linking
- Apple Sign-In: https://developer.apple.com/sign-in-with-apple/
- Google OAuth: https://developers.google.com/identity/protocols/oauth2
