# ADR-002: Auth

## Status

Accepted.

## Context

US-002 and US-003 now use staged auth scope.

MVP Stage 1 requires registration and login through:

- email/password

MVP Stage 2 adds:

- Google OAuth
- Apple Sign-In

The app must preserve sessions between visits, support password recovery, store optional location and language preferences, and redirect authenticated users to the dashboard. Auth must also support secure access to private wardrobe items, photos, capsules, payments, and profile data across web and Flutter mobile apps.

## Decision

Use Supabase Auth for Capsule Zero MVP authentication. Stage 1 can use a local mock auth adapter behind the same application boundary until Supabase staging is required for persistence/RLS validation.

Implementation rules:

- Use `@supabase/supabase-js` and `@supabase/ssr` for browser/server clients in Next.js App Router.
- Use `supabase_flutter` for iOS and Android.
- Configure Supabase Auth email/password for Stage 1.
- Configure Google OAuth and Apple Sign-In only for MVP Stage 2 or an explicit social-auth integration gate.
- Store application profile data in `public.profiles`, keyed by `auth.users.id`.
- Use Supabase RLS for user-owned tables.
- Keep service-role access server-only in Route Handlers, Server Actions, and Edge Functions.
- Keep Next.js auth callback routes as the Stage 2 OAuth boundary; they are not required for Stage 1 email/password implementation.
- Configure mobile deep links/universal links/app links for Flutter OAuth callbacks in Stage 2. Payment-return deep links are deferred unless a later mobile payment posture is approved.
- Persist language preference on `profiles.language`.
- Persist optional `country` and `city` on `profiles`, but never block registration if absent.
- Use inline UI errors with Capsule Zero yellow `#FFD600`; no alert popups.

## Data Model

`profiles`

| Field             | Type          | Notes                                             |
| ----------------- | ------------- | ------------------------------------------------- |
| `id`              | uuid PK       | References `auth.users.id`                        |
| `display_name`    | text          | User-editable                                     |
| `avatar_asset_id` | uuid nullable | References selected avatar asset                  |
| `language`        | text          | `en`, `ru`; default `en`. `es-AR` is deferred to MVP v2 |
| `country`         | text nullable | Optional                                          |
| `city`            | text nullable | Optional                                          |
| `coin_balance`    | integer       | Derived from coin ledger or cached for fast reads |
| `created_at`      | timestamptz   | Server-generated                                  |
| `updated_at`      | timestamptz   | Server-generated                                  |

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

## RLS Policy Summary

- Users can select and update only their own `profiles` row.
- Users can select only their own `coin_ledger` rows.
- Coin ledger inserts are server-only through Route Handlers or Edge Functions using server credentials after balance, reason, target, and idempotency validation.
- Public catalog item reads are allowed only for items with `visibility = 'public'`.
- Private item, capsule, outfit, upload, and asset rows require `user_id = auth.uid()` or equivalent ownership through a join such as `wardrobe_entries.user_id`.

## Consequences

Positive:

- Auth identity, RLS, and user data share one backend.
- Stage 1 auth can ship with a smaller email/password surface.
- Google and Apple OAuth requirements remain covered by Supabase Auth in Stage 2.
- Web and mobile use the same auth authority and RLS policies.
- The profile model stays simple and avoids duplicating auth credentials.
- Future account deletion/privacy workflows can be implemented by traversing user-owned records.

Tradeoffs:

- OAuth provider setup must happen in Supabase and provider dashboards before Stage 2 social auth QA, staging, or launch.
- Apple Sign-In may not always provide name metadata on repeat sign-ins, so Stage 2 profile completion must tolerate missing provider names.
- Supabase SSR clients and cookie refresh behavior must be implemented carefully in App Router.
- Flutter requires deep-link configuration, secure token storage, and platform-specific OAuth redirect testing.

## References

- Supabase Auth overview: https://supabase.com/docs/guides/auth
- Supabase Social Login: https://supabase.com/docs/guides/auth/social-login
- Supabase Apple login: https://supabase.com/docs/guides/auth/social-login/auth-apple
- Supabase Next.js SSR auth: https://supabase.com/docs/guides/auth/server-side/nextjs
- Supabase Flutter client: https://supabase.com/docs/reference/dart/introduction
- Flutter deep linking: https://docs.flutter.dev/ui/navigation/deep-linking
- Next.js authentication guide: https://nextjs.org/docs/app/guides/authentication
