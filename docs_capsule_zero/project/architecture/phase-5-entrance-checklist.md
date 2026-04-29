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
| API contract | `docs_capsule_zero/adr/openapi.yaml` plus updated `docs_capsule_zero/adr/api-spec.md` | Every REST route has auth, request schema, response schema, and error schema |
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

## Mobile Payment Posture

MVP release posture is conservative:

- Web uses Lava.top for coin purchases.
- iOS and Android apps do not show Lava.top purchase CTAs or external payment links.
- Mobile apps show coin balance and transaction status after backend webhook fulfillment.
- App-store-specific purchase paths can be revisited after legal/store-policy approval.

## Exit Rule

Phase 5 feature sprints may start only when all P1 gates above are complete. If any gate remains open, continue Sprint 0 instead of beginning product screens.
