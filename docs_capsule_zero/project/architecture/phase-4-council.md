# Phase 4 Architecture Council

> **Monetization freeze (2026-07-16):** Every coin, balance, Lava.top, billing, payment-product,
> pricing, or purchase-flow statement below is superseded historical context under `PRODUCT-PLAN.md`
> D2. Do not implement, provision, expose, test as a release gate, or use it for a new contract or
> code generation. Stage 4 will delete or replace the retained legacy after choosing a model.

## Status

Rerun complete (2026-06-27). Production-stack pivot accepted: Go modular monolith + nginx + Ory Kratos + Postgres + Redis + DigitalOcean Spaces + Cloudflare + Resend + React Native. ADR-007 later slimmed v0.1 to plain Postgres/syslog+traces and deferred pgvector, PgBouncer, Grafana, and the standalone worker until promotion triggers fire. Phase 5 starts with `.specify/specs/024-production-stack-runtime/`.

API-gateway choice revised 2026-06-28: nginx 1.27 replaces Traefik v3 in DI-017. Rationale recorded in ADR-001 § "Why nginx and not Traefik or Caddy".

Hosting and front-door revised 2026-07-02 (spec 033): the DigitalOcean droplet in DI-006 is superseded by a Hetzner CX23 (2 vCPU / 4 GB / 40 GB), and Cloudflare was initially deferred. Spec 047 supersedes that deferral on 2026-07-22: the apex + `www` are proxied now, origin web ingress is Cloudflare-only, and SSH is Tailscale-only. The dated DI-006 / DI-020 register rows keep their 2026-06-27 wording as history. Current state lives in AGENTS.md and ADR-001.

Storage revised 2026-07-10 (spec 039): DigitalOcean Spaces in DI-004 is superseded by **Hetzner Object Storage**. The dated DI-004 row keeps its 2026-06-27 wording as history; current storage posture lives in ADR-003 and uses provider-neutral `OBJECT_STORAGE_*` / `BACKUP_S3_*` env keys.

Storage implementation advanced 2026-07-10 (spec 040): the `internal/storage`
and `internal/uploads` packages, authenticated original-photo init/complete
routes, and the `0003_object_storage_uploads.sql` migration landed. The API is
still a standard-library `net/http` router with a textual OpenAPI guard; Redis,
processed variants remain deferred. Spec 047 activated encrypted daily backup
automation on 2026-07-22 after fixed-header uploader hardening and a restore
drill.

## Purpose

This document records the Architectura-style decision pass that produced the v0.1 production architecture. The durable source of truth remains the Capsule Zero ADRs (`docs_capsule_zero/adr/`); this council document captures the reasoning and quorum behind them.

## Rerun Inputs (2026-06-27)

The council was rerun after the founder accepted these new constraints:

- Target production high-load from Day 1; no BaaS lock-in.
- Hosting is a single DigitalOcean droplet running docker-compose; every service declared as a separate `services:` entry. (Migrated to a Hetzner CX23 on 2026-07-02 — spec 033; the single-server compose shape is unchanged.)
- React Native replaces Flutter for mobile (shared TypeScript ecosystem with web).
- Image processing moves to a self-hosted Capsule Zero model (deferred to Stage 2); Photoroom and remove.bg are dropped.
- Observability stays self-hosted and lightweight in v0.1: syslog + traces. Grafana, Sentry, and Prometheus are deferred.
- Auth provider is Ory Kratos (self-hosted) instead of Supabase Auth.
- Object storage was originally selected as DigitalOcean Spaces (S3-compatible, built-in CDN) instead of Supabase Storage. Superseded 2026-07-10 by Hetzner Object Storage after the compute migration.
- API gateway is nginx 1.27 with `auth_request` into Kratos and `limit_req_zone` rate-limit (Traefik was the original pick on 2026-06-27; revised on 2026-06-28).
- Email is Resend.
- DNS is Spaceship/Cloudflare; the Cloudflare proxy fronts the apex + `www` for DDoS and CDN, with origin web ingress restricted to Cloudflare ranges (activated 2026-07-22, spec 047).
- No Kafka in v0.1 — Redis-based job queue is enough for the worker count we have.
- Coins, image enhancement, and the self-hosted image model are in v0.2 backlog; Lava.top integration is stubbed in v0.1.
- ES-AR remains globally deferred to v0.2.

## Source Material

- `AGENTS.md`
- `.specify/memory/constitution.md`
- `.specify/specs/001-capsule-zero-mvp/spec.md`
- `.specify/specs/001-capsule-zero-mvp/prototype-map.md`
- `html-prototypes/`
- `docs_capsule_zero/project/methodology/`
- `docs_capsule_zero/project/frontend/styling.md`
- `docs_capsule_zero/project/devops/github-ci-and-branch-protection.md`

## Council Roles

| Role               | Voting lens                                                                    |
| ------------------ | ------------------------------------------------------------------------------ |
| Software architect | Coherent product architecture, domain model, API boundaries                    |
| Platform architect | Delivery speed, hosting, observability, operational burden                     |
| Mobile architect   | React Native app architecture, iOS/Android constraints, deep links, ergonomics |
| AI/data architect  | Semantic search, image processing, auto-tagging, shared catalog growth         |
| Verifier           | Production realism, missing constraints, security, validation readiness        |

## Decision Register

| ID     | Decision                 | Accepted option                                                                                                                      | Quorum                                                           | Rationale                                                                                                                                  |
| ------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| DI-001 | Backend                  | Go modular monolith                                                                                                                  | 5/5 approve                                                      | Small static binary, low memory footprint on a 4 GB droplet, clean bounded contexts, easy extraction path when load justifies it.          |
| DI-002 | Database                 | PostgreSQL 16 with Postgres FTS in v0.1; pgvector and PgBouncer deferred by ADR-007                                                  | 5/5 approve                                                      | Relational, ownership-sensitive, search-heavy; one DB covers structured data now and vector search once the semantic slice lands.          |
| DI-003 | Auth                     | Ory Kratos email/password in v0.1; Google OAuth and Apple Sign-In in Stage 2                                                         | 5/5 approve                                                      | Self-hosted, headless, integrates with nginx `auth_request` and Resend SMTP.                                                               |
| DI-004 | File storage             | DigitalOcean Spaces (S3-compatible, built-in CDN) — **superseded 2026-07-10 by Hetzner Object Storage**                               | 5/5 approve                                                      | Original rationale was same-provider billing/CDN while compute was DigitalOcean. After spec 033 moved compute to Hetzner, spec 039 moved object storage there too. |
| DI-005 | Image processing         | Self-hosted Capsule Zero model behind a Go worker, deferred to Stage 2                                                               | 4/5 approve, 1 advisory                                          | Removes vendor cost and lock-in; v0.1 ships without background removal, originals only.                                                    |
| DI-006 | Hosting                  | Single DigitalOcean droplet (≥ 4 GB / 2 vCPU / 80 GB) running docker-compose; Cloudflare proxy in front                              | 5/5 approve                                                      | Lowest operational burden compatible with the production-stack scope; CF absorbs DDoS for free.                                            |
| DI-007 | API shape                | Go HTTP API behind nginx; OpenAPI is the contract source for web and mobile; React Native and Next.js both consume generated clients | 5/5 approve                                                      | One contract source, two clients. No Server Actions doing privileged DB work.                                                              |
| DI-008 | Web state                | Zustand for local journey/UI state, TanStack Query for client server-state, Server Components for initial reads                      | 5/5 approve                                                      | Already proven on the legacy frontend; carries over cleanly.                                                                               |
| DI-009 | Web forms                | React Hook Form + Zod                                                                                                                | 5/5 approve                                                      | Inline validation, schema reuse with Go-side validation via OpenAPI.                                                                       |
| DI-010 | Web i18n                 | next-intl; v0.1 locales `en` and `ru`; `es-AR` deferred to v0.2                                                                      | 5/5 approve                                                      | Best fit for App Router. Locale scope decision from 2026-06-07 holds.                                                                      |
| DI-011 | Semantic search          | Postgres FTS first; pgvector hybrid search deferred by ADR-007 until the semantic-search slice                                       | 5/5 approve                                                      | Catalog search stays in the same DB as the items; no separate vector store until objective scale demands it.                               |
| DI-012 | Payments/coins           | Lava.top one-time product payments on web; **stubbed in v0.1**, integrated in v0.2; mobile read-only balance                         | 5/5 approve                                                      | Avoids app-store payment policy risk and lets v0.1 ship without the integration overhead.                                                  |
| DI-013 | Shared item DB           | Single canonical `items` table with visibility/moderation flags, referenced by per-user wardrobe entries                             | 5/5 approve                                                      | Satisfies US-025 without duplicating public/private item rows.                                                                             |
| DI-014 | Quality tooling          | Existing CI accepted; linting and commit hooks remain a Phase 4 setup follow-up before first product-code PR                         | 5/5 approve                                                      | CI/branch protection docs exist; local hooks land before Phase 5 implementation branches.                                                  |
| DI-015 | Mobile app               | React Native (Expo + Expo Router + EAS Build) sharing the Go API and OpenAPI client                                                  | 5/5 approve                                                      | Aligns language with web; smaller cognitive surface than Flutter.                                                                          |
| DI-016 | Mobile-first impl        | Design, API, and QA optimize for phone workflows first: 375px web baseline and React Native phone UX before tablet/desktop           | 5/5 approve                                                      | Mobile is the dominant wardrobe-capture context.                                                                                           |
| DI-017 | API gateway              | nginx 1.27 with Let's Encrypt TLS (certbot on host), `limit_req_zone` rate-limit, `auth_request` into Kratos                         | 5/5 approve (revised 2026-06-28; original choice was Traefik v3) | Universal mental model, predictable directives, no Docker-socket exposure on the edge container, fits the v0.1 service count. See ADR-001. |
| DI-018 | Cache / sessions / queue | Redis 7 with a Redis-based job queue (River or asynq) — Kafka deferred until multi-service split                                     | 5/5 approve                                                      | Kafka cannot run on the v0.1 droplet; Redis covers cache + queue + idempotency at low memory cost.                                         |
| DI-019 | Email                    | Resend for transactional email; MailHog for local dev                                                                                | 5/5 approve                                                      | Cheapest credible deliverability for Kratos verification/recovery flows; supports SPF/DKIM on `capsulezero.app`.                           |
| DI-020 | DNS / anti-DDoS          | Spaceship registrar pointed at Cloudflare; Cloudflare proxy on `capsulezero.app`                                                     | 5/5 approve                                                      | DDoS, bot fight, CDN, edge TLS — all free at our scale; Spaceship stays the registrar.                                                     |
| DI-021 | Observability            | syslog file logs + OpenTelemetry trace export in v0.1; Grafana, Sentry, and Prometheus deferred                                      | 5/5 approve                                                      | Fits a 4 GB droplet; expands when the budget allows or ADR-007 promotion triggers fire.                                                    |
| DI-022 | Implementation posture   | Production-first: no Stage 1 mock-first layer (see ADR-006)                                                                          | 5/5 approve                                                      | We own the runtime; faking it would cost more than wiring the real services.                                                               |

## Accepted Architecture Summary

Capsule Zero is a mobile-first product with two clients over one self-hosted backend:

- **Web** — Next.js App Router served by the `web` container.
- **Mobile** — React Native iOS/Android app distributed through TestFlight and Google Play internal testing.

A **Go modular monolith** behind **nginx** owns identity (via Kratos), relational data, and signed-URL issuance; later slices add the remaining search and background-job surface. Postgres handles the currently landed auth/profile and original-upload schema; FTS domain tables arrive with their slice, while pgvector is deferred. Redis is the accepted future cache/queue choice but is not in the active compose stack yet. Hetzner Object Storage asset and Object-Locked backup buckets are provisioned; encrypted daily backup automation is active after the spec-047 fixed-header boundary and restore drill. Resend is provisioned as the Kratos SMTP courier. Cloudflare now absorbs the public traffic floor and the origin web firewall accepts only Cloudflare ranges; operator and CI SSH use Tailscale.

Direct presigned URLs are intentionally short-lived bearer capabilities, not
opaque handles: their host/path/query reveal the bucket, object key, and
access-key ID. The founder accepts the bounded original-only residual that an
unexpired PUT URL can be replayed to overwrite the final object and make the
persisted ETag stale after completion. Broader storage use must revisit staging
keys, conditional writes, or an API proxy.

Custom Go services can be extracted out of the monolith later — the first natural extraction is the image-processing worker when the self-hosted Capsule Zero model lands.

## Open Follow-Ups

- Founder approval on the rewritten ADRs (`adr-001-stack.md`, `adr-002-auth.md`, `adr-003-storage.md`, `adr-006-mock-first-mvp-stage-one.md`).
- DigitalOcean droplet upgrade to at least 4 GB / 2 vCPU / 80 GB. (Resolved 2026-07-02 by migrating to a Hetzner CX23 instead — spec 033.)
- ~~Spaceship DNS pointed at Cloudflare nameservers; Cloudflare proxy enabled on `capsulezero.app`.~~ Completed 2026-07-22 with apex + `www`, Full (strict) TLS, DNSSEC, and Cloudflare-only origin ingress (spec 047).
- ~~Resend account created and SPF/DKIM published.~~ Completed 2026-07-03.
- ~~Hetzner Object Storage buckets created with CORS for `capsulezero.app` where browser upload/download flows require it.~~ Buckets, scoped policies, exact-origin asset CORS, absent backup CORS, protected server env, and the redacted signed 10 MiB smoke completed 2026-07-10. Upload activation remains default-off pending quota/cleanup/attachment.
- Ship `.specify/specs/024-production-stack-runtime/`.
- Retire the Supabase provider inside `/app` domain by domain as Go API bounded contexts land; do not introduce a `/web` frontend.
- Configure linting and local commit hooks before the first product-code PR.
- Stage 2: configure Google/Apple OAuth in Kratos; wire Lava.top products/API key/webhook; deliver the self-hosted image model and measure against the 5 second processing gate.
- Stage 2: introduce Sentry and Prometheus when the droplet has headroom or the stack grows past one node.

## Validation

| Check                  | Status   | Notes                                                                                                                                                                              |
| ---------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brief coverage         | Ready    | Covers backend, DB, auth, storage, image processing, hosting, web, React Native mobile, state, API, forms, i18n, coins, catalog search, gateway, queue, email, DNS, observability. |
| Consistency            | Ready    | Decisions align with v0.1 scope, prototypes, and existing devops docs.                                                                                                             |
| Implementation realism | Advisory | The 4 GB droplet is tight; image model and observability expansion are gated on either workload growth or a droplet upgrade.                                                       |
| Risk visibility        | Ready    | Main risks are droplet memory ceiling, the accepted presigned-PUT replay/stale-ETag residual, self-hosted image model build cost, marketplace parser fragility, and deferred backup automation. |
