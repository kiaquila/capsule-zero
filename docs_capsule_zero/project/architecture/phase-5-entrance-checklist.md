# Phase 5 Entrance Checklist

## Status

Required Sprint 0 gate before product feature implementation.

## Purpose

The Phase 4 architecture direction is accepted, but Phase 5 feature work must not start from unresolved setup decisions. Sprint 0 converts the architecture plan into implementation-ready contracts, scaffolds, policies, and verification commands.

## Sprint 0 Scope

Sprint 0 is the first five working days of Phase 5. Feature sprints begin only after this checklist is complete.

| Gate | Required Artifact | Acceptance Criteria |
|---|---|---|
| Founder approval | Decision note or issue comment referencing ADRs | Founder approves Supabase, Flutter, Lava.top web payments, and mobile payment posture |
| API contract | `docs_capsule_zero/adr/openapi.yaml` plus updated `docs_capsule_zero/adr/api-spec.md` | P0: every route-method in the API inventory has auth, request schema, response schema, and error schema. The PR #18 review counted 42 route-method contracts before coin-spend was added; do not scope this as an approximate 30-route scaffold. |
| RPC contract | `supabase/migrations/0001_initial_schema.sql` and RPC signatures in migration comments or docs | Domain RPC functions have argument and return contracts for web and Flutter |
| Generated clients | `app/src/lib/api/generated/` and `mobile/lib/api/generated/` | TypeScript and Dart clients/types can be regenerated from the OpenAPI contract |
| Contract tests | `app/tests/contract/` or equivalent CI target | Tests verify auth/error conventions and representative endpoint schemas |
| Supabase schema | `supabase/migrations/` | Tables, indexes, FKs, RLS, seed data, and storage buckets are migration-backed |
| RLS/storage tests | `supabase/tests/` | Owner isolation, public catalog reads, private asset access, and server-only ledger writes are tested |
| Flutter scaffold | `mobile/` | Flutter app boots on iOS and Android simulator/emulator, with routing, env config, Supabase init, and deep-link placeholders |
| Lava.top setup | Backend config plus test webhook note | Web purchase flow creates invoice/payment link and webhook idempotency is testable |
| Mobile payment posture | ADR/API/mobile docs match | Mobile MVP has no in-app Lava.top purchase CTA; mobile only displays balance and reflects web purchases |
| Background removal spike | Measurement note under backend docs or issue | Real wardrobe image test confirms Photoroom meets quality/latency or switches adapter to remove.bg |
| Local quality tooling | lint/hook config | Linting and local commit hooks are configured before first product-code PR |

## Sprint 0 Follow-Up Scope

Track these as Sprint 0 issues before product feature work. They are not blockers for accepting the Phase 4 architecture direction, but they must not be lost during implementation setup.

| Area | Follow-up |
|---|---|
| Lava.top webhook security | Define HMAC signature verification with a pre-shared key, replay protection, and idempotent event handling. |
| RLS ownership model | Document and test the two-table item pattern: `items.visibility` controls catalog exposure; `wardrobe_entries.user_id` controls user ownership and states. Audit RLS on every application table during Sprint 0; explicitly document and test that `lava_events` rows are server-only with no client read or write access (RLS enabled, no anon/authenticated grants). |
| Coin ledger writes | Choose the server-only write mechanism, either Route Handler/Edge Function with service-role credentials or reviewed `security definer` RPC, and cover it with RLS tests. |
| OpenAPI completion | Expand `openapi.yaml` for every route-method in `api-spec.md`, including `/api/items/:itemId/status` enum values `active`, `uncapsulated`, `for_sale`, `for_repair`; parsed marketplace candidate shape; `/api/catalog/search` query params; Lava.top webhook payload schema; and generated TypeScript/Dart clients. Specify the `reason` <-> `targetId` correlation rules for `CoinSpendRequest` (for example, `reason=extra_capsule` requires a capsule UUID; `reason=photo_enhancement` requires an item or upload-job UUID) in both `openapi.yaml` description fields and the "Coin Spend" section of `api-spec.md`. |
| API error contract | Standardize HTTP error codes and `ErrorResponse.error.code` taxonomy across the API. Cover at minimum 400 (validation), 401 (unauthenticated), 403 (forbidden), 404 (missing resource), 409 (idempotency conflict), 422 (semantic validation), and 402 / `INSUFFICIENT_BALANCE` for coin spend. Document the codes alongside the OpenAPI contract before generated clients are produced. |
| Compatibility source | Treat `docs_capsule_zero/project/methodology/colors.md` as the canonical compatibility matrix. Temperature-rule expansion is deferred to v0.2 unless explicitly accepted for Sprint 0. |
| Vector search | Lock pgvector embedding dimension before seed data and migrations are written. |
| Background removal | Measure Photoroom P99 latency and quality on real wardrobe photos, document the async polling fallback, and switch adapter if the 5 second quality gate fails. |
| Mobile i18n | Specify Flutter i18n package, language detection, persisted language sync, and fallback behavior for `en`, `es-AR`, and `ru`. |
| Concurrency | Add optimistic locking/versioning for item edits so two devices cannot silently overwrite each other. |
| Upload hygiene | Normalize EXIF orientation for mobile camera uploads and deduplicate images before paid background removal. |
| Rate limits and cost ceilings | Define limits for marketplace import, catalog search, and photo upload; add Photoroom spend guardrails before broad testing. |
| Privacy and app-store readiness | Scope GDPR/account deletion, TestFlight/signing/App Store Connect/Google Play setup, and mobile release checks. |
| Observability | Bring Sentry or equivalent error monitoring into Sprint 1 at latest, and into Sprint 0 if financial transaction implementation begins there. |
| Flutter design parity | Map glass/achromatic web tokens to Flutter theme tokens so native UI does not drift from the approved design language. |

## Mobile Payment Posture

MVP release posture is conservative:

- Web uses Lava.top for coin purchases.
- iOS and Android apps do not show Lava.top purchase CTAs or external payment links.
- Mobile apps show coin balance and transaction status after backend webhook fulfillment.
- App-store-specific purchase paths can be revisited after legal/store-policy approval.

## Exit Rule

Phase 5 feature sprints may start only when all P1 gates above are complete. If any gate remains open, continue Sprint 0 instead of beginning product screens.
