# Phase 5 Entrance Checklist

## Status

Production runtime entrance gate before product feature implementation (updated 2026-06-27 for the production-stack pivot).

## Purpose

The Phase 4 production-stack architecture is accepted. Phase 5 starts with a production-shape docker-compose runtime and real services from Day 1 (see ADR-006). The `/app` frontend stays — it is already built on a provider port/adapter abstraction; its Supabase provider is replaced domain by domain with a real `api` provider against the Go API + Kratos. Real provider registration (Google/Apple OAuth, Lava.top live, self-hosted image model) is a per-feature integration gate, not a precondition for the runtime.

## Sprint 0 Scope

Sprint 0 is the first implementation slice of Phase 5 and is delivered by `.specify/specs/024-production-stack-runtime/`. Feature sprints begin after the gates below are complete.

| Gate                            | Required Artifact                                                                     | Acceptance Criteria                                                                                                                                                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Founder approval                | Decision note or issue comment referencing the rewritten ADRs                         | Founder approves the production-stack pivot and the v0.1 scope (Lava.top stubbed, image processing deferred to Stage 2)                                                                                                 |
| DigitalOcean droplet            | DO droplet of at least 4 GB / 2 vCPU / 80 GB                                          | Droplet provisioned, hostname set, Cloudflare A record pointed at the droplet IP                                                                                                                                        |
| DNS + Cloudflare proxy          | Spaceship nameservers pointing at Cloudflare; CF zone for `capsulezero.app`           | Proxy (orange cloud) enabled on the apex; SSL/TLS mode `Full (strict)`; Bot Fight Mode enabled                                                                                                                          |
| docker-compose runtime          | `docker-compose.yml` plus `docker-compose.dev.yml`                                    | Every active v0.1 service from the production runtime table is declared as a separate `services:` block; `docker compose up -d` brings the stack up and every active service reports healthy                            |
| API contract                    | `docs_capsule_zero/adr/openapi.yaml` plus updated `docs_capsule_zero/adr/api-spec.md` | P0: every route-method in the API inventory has auth, request schema, response schema, error schema; coin-spend and Lava.top webhook stubs included even though the integration is v0.2                                 |
| Generated clients               | `app/src/lib/api/generated/`; mobile path deferred to the React Native scaffold gate  | Web TypeScript client regenerated from the OpenAPI contract; React Native client generation is restored when `/mobile` defines its source layout                                                                        |
| Contract tests                  | `api/tests/contract/` and CI target                                                   | Tests verify auth/error conventions and representative endpoint schemas against the running Go API                                                                                                                      |
| Schema migrations               | `api/migrations/`                                                                     | Tables, indexes, FKs, enum/check constraints, seed methodology data shipped as embedded SQL migration files; migrations apply cleanly at API boot                                                                                |
| Auth runtime                    | Kratos config in `infra/kratos/`                                                      | Kratos boots against its own Postgres database; identity schema published; Resend SMTP courier configured; email verification and password recovery flows verified end-to-end                                           |
| Authorization tests             | `api/tests/authz/`                                                                    | Cross-user mutation rejected; public catalog reads succeed without a session; ledger inserts only from internal handlers                                                                                                |
| Storage                         | DigitalOcean Spaces bucket + CORS                                                     | Bucket exists; CORS allows `https://capsulezero.app` and the dev origin; signed PUT/GET round-trip verified                                                                                                             |
| Email                           | Resend account + SPF/DKIM                                                             | DNS verified; from address `no-reply@capsulezero.app` delivers in test                                                                                                                                                  |
| React Native scaffold           | `/mobile`                                                                             | Expo project boots, routing covers `(auth)` and `(app)` groups, env config covers API base URL and deep-link scheme, generated API client path is defined and regenerated; build runs locally for at least one platform |
| Mobile payment posture          | ADR/API/mobile docs match                                                             | Mobile v0.1 has no in-app Lava.top purchase CTA; mobile only displays balance (which is zero until v0.2)                                                                                                                |
| Local quality tooling           | lint/hook config                                                                      | Linting and local commit hooks are configured before first product-code PR                                                                                                                                              |
| Backups                         | Cron job in the runtime                                                               | Nightly `pg_dump` uploads to the `backups/` prefix in Spaces with 14 day retention                                                                                                                                      |
| Observability                   | syslog + tracing; Grafana deferred by ADR-007                                         | syslog files rotated; trace exporter receives traces from a smoke request through the stack; Grafana promotion follows ADR-007                                                                                          |
| Legacy provider retirement plan | Issue or PR description                                                               | Follow-up slices retire the Supabase provider domain by domain inside `/app`; no `/web` frontend is introduced                                                                                                          |

## Sprint 0 Follow-Up Scope

Track these as Stage 1 issues or per-feature integration-gate issues. They are not blockers for accepting Phase 4 or for shipping spec 024, but they must not be lost during implementation setup.

| Area                            | Follow-up                                                                                                                                                            |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lava.top webhook security       | Define HMAC signature verification with a pre-shared key, replay protection, and idempotent event handling (v0.2 wiring).                                            |
| Ownership model tests           | Document and test the two-table item pattern: `items.visibility` controls catalog exposure; `wardrobe_entries.user_id` controls user ownership and states.           |
| Coin ledger writes              | Coin ledger inserts come only from internal billing/webhook handlers; cover with tests (v0.2 wiring).                                                                |
| OpenAPI completion              | Expand `openapi.yaml` for every route-method, including the `urls` array for marketplace imports and the coin-spend `reason ↔ targetId` correlation rules.           |
| API error contract              | Standardize HTTP error codes and `ErrorResponse.error.code` taxonomy across the API. Cover at minimum 400/401/403/404/409/422 and 402/`INSUFFICIENT_BALANCE` (v0.2). |
| Compatibility source            | `docs_capsule_zero/project/methodology/colors.md` is the canonical compatibility matrix. Temperature stays display metadata only.                                    |
| Vector dimension                | Lock the pgvector embedding dimension before semantic search slice writes embeddings.                                                                                |
| Background removal              | Self-hosted Capsule Zero image model lands in Stage 2; until then v0.1 stores originals only and the 5 second gate is dormant.                                       |
| Mobile i18n                     | Specify React Native i18n library, language detection, persisted language sync; active v0.1 locales `en` and `ru`; `es-AR` v0.2.                                     |
| Concurrency                     | Add optimistic locking/versioning for item edits so two devices cannot silently overwrite each other.                                                                |
| Upload hygiene                  | Normalize EXIF orientation for mobile camera uploads and deduplicate images before paid image processing (Stage 2).                                                  |
| Rate limits and cost ceilings   | Define limits for marketplace import, catalog search, and photo upload.                                                                                              |
| Privacy and app-store readiness | Scope GDPR/account deletion, TestFlight/signing/App Store Connect/Google Play setup, and mobile release checks.                                                      |
| Observability expansion         | Bring Grafana, Sentry, and Prometheus back after ADR-007/Stage 2 gates; until then syslog + traces are the observability surface.                                    |
| React Native design parity      | Map glass/achromatic web tokens to a React Native theme so native UI does not drift from the approved design language.                                               |

## Mobile Payment Posture

v0.1 release posture is conservative:

- Web uses Lava.top for coin purchases (integrated in v0.2; stubbed in v0.1).
- iOS and Android apps do not show Lava.top purchase CTAs or external payment links.
- Mobile apps show coin balance and transaction status after backend webhook fulfillment (v0.2).
- App-store-specific purchase paths can be revisited after legal/store-policy approval.

## Exit Rule

Phase 5 feature sprints may start when the Sprint 0 gates above are complete. If a feature requires Google/Apple OAuth in Kratos, real Lava.top payment, or the self-hosted image model, run the corresponding integration gate before that feature enters QA, staging, or launch.
