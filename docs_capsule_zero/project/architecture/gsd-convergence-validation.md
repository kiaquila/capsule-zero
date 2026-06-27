# GSD Architecture Convergence Validation

## Status

Rerun complete (2026-06-27). Convergence pass concluded with the **production-stack pivot**: Go modular monolith + Traefik + Ory Kratos + PostgreSQL/pgvector + Redis + DigitalOcean Spaces + Cloudflare + Resend + React Native. The previous Supabase + Vercel + Flutter + Photoroom direction is dropped before any code derived from it lands in production.

## Goal

Re-evaluate the Phase 4 architecture against the new founder constraints (single DO droplet, no BaaS lock-in, self-hosted observability under a tight RAM budget, React Native instead of Flutter, self-hosted image model deferred to Stage 2) and record the convergence outcome that produced the new ADRs.

## Source Inputs

- `AGENTS.md`
- `.specify/memory/constitution.md`
- `.specify/specs/003-sprint-0-foundation/{spec,plan,tasks}.md`
- `docs_capsule_zero/project/architecture/phase-4-council.md` (post-pivot)
- `docs_capsule_zero/project/architecture/phase-5-entrance-checklist.md` (post-pivot)
- `docs_capsule_zero/adr/adr-001-stack.md` (rewritten)
- `docs_capsule_zero/adr/adr-002-auth.md` (rewritten)
- `docs_capsule_zero/adr/adr-003-storage.md` (rewritten)
- `docs_capsule_zero/adr/adr-006-mock-first-mvp-stage-one.md` (rewritten — production-first posture)
- `docs_capsule_zero/adr/api-spec.md`
- `docs_capsule_zero/adr/openapi.yaml`
- `docs_capsule_zero/project/backend/backend-docs.md` (Go monolith)
- `docs_capsule_zero/project/frontend/frontend-docs.md` (Next.js against Go API)
- `docs_capsule_zero/project/mobile/mobile-docs.md` (React Native)
- `docs_capsule_zero/project/devops/sprint-0-runtime-provisioning.md` (production runtime)

## Convergence Method

A multi-lens review (software architect, platform architect, mobile architect, AI/data architect, verifier) walked the new constraints against the previous Phase 4 record. Each lens voted on whether the previous stack still satisfied the new constraints. Where it did not, the lens proposed a replacement and the proposal was reviewed for cross-lens coherence (e.g. Go monolith works with Traefik forward-auth into Kratos; React Native consumes the same OpenAPI client; Cloudflare proxy is compatible with Let's Encrypt at the origin).

## Repository Readiness Snapshot

| Area            | Current state                                                                                                              | Evidence                                                                                                                |
| --------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Web baseline    | Next.js App Router app exists under `app/` (legacy, scheduled removal); future home is `/web`                              | `app/package.json`                                                                                                       |
| API contract    | OpenAPI is the implementation source for generated web and mobile clients                                                  | `docs_capsule_zero/adr/openapi.yaml`                                                                                     |
| Schema          | Postgres schema (pgvector, FTS, two-table item ownership) ships via `api/migrations/` in the production runtime spec        | `.specify/specs/024-production-stack-runtime/`                                                                          |
| Mobile shell    | React Native scaffold scheduled in the production runtime spec; previous Flutter scaffold dropped before merge              | `docs_capsule_zero/project/mobile/mobile-docs.md`                                                                       |
| Runtime         | docker-compose runtime with Traefik, Kratos, Postgres, Redis, Go API, Go worker, Next.js web, imgproxy, Grafana             | `docs_capsule_zero/project/devops/docker-compose-deploy.md`                                                              |
| Observability   | Grafana + syslog file logs + OTLP trace export (Sentry and Prometheus → Stage 2)                                            | `docs_capsule_zero/project/architecture/phase-4-council.md` DI-021                                                       |

## Convergence Summary

The previous Phase 4 stack does not satisfy the new founder constraints. Three failure modes drove the pivot:

1. **BaaS lock-in.** Supabase Auth, Storage, RLS, and Edge Functions are tightly coupled. Migrating later is expensive; pivoting now is cheap because none of the Supabase-derived product code is in production.
2. **Operational fit.** The accepted runtime is one DO droplet. Vercel cannot host the API economically without splitting the stack across vendors; Supabase Storage adds another vendor relationship.
3. **Language coherence.** Flutter pulled Dart into a TypeScript-heavy team. React Native keeps web and mobile on the same language and lets the same generated OpenAPI client serve both clients.

### Decision Delta

| Decision area             | Previous Phase 4          | New (2026-06-27)                                                                  | Why the change |
| ------------------------- | ------------------------- | --------------------------------------------------------------------------------- | --------------- |
| Backend                   | Supabase BaaS             | Go modular monolith behind Traefik                                                 | Self-hosted, low memory footprint, no vendor lock-in |
| Database                  | Supabase Postgres + RLS   | Postgres 16 with pgvector + FTS; authorization enforced in Go                      | Same DB engine, no DSL for authz, easier portability |
| Auth                      | Supabase Auth             | Ory Kratos behind Traefik forward-auth                                             | Open-source identity provider we can self-host |
| File storage              | Supabase Storage          | DigitalOcean Spaces (S3-compatible, built-in CDN)                                   | Same provider as compute; built-in CDN |
| Image processing          | Photoroom + remove.bg     | Self-hosted Capsule Zero model (Stage 2; v0.1 stores originals)                    | Vendor cost removal; brand-aligned quality |
| Web                       | Next.js on Vercel         | Next.js in docker-compose behind Traefik                                            | One runtime, one bill, no Vercel-specific code paths |
| Mobile                    | Flutter + Dart            | React Native + TypeScript                                                          | Shared language with web; smaller cognitive surface |
| Email                     | Supabase + provider       | Resend (via Kratos SMTP courier and Go API)                                         | Cheapest credible deliverability |
| API gateway               | Vercel + Supabase Kong    | Traefik v3 (TLS, rate-limit, forward-auth)                                          | Self-hosted, one process for routing + TLS + auth |
| Cache / queue             | Supabase Postgres + ad-hoc | Redis 7 with River/asynq job queue (Kafka deferred)                                | Kafka cannot run on the v0.1 droplet |
| DNS / front-door          | Vercel + Supabase         | Spaceship registrar + Cloudflare proxy                                              | Free DDoS protection + CDN; one front-door |
| Observability             | Sentry first              | Grafana + syslog + traces; Sentry/Prometheus → Stage 2                              | Fits a 4 GB droplet |
| Implementation posture    | Mock-first Stage 1        | Production-first from the first feature slice (see ADR-006)                         | We own the runtime; mocks would now cost more than the real services |
| GSD Core                  | Advisory pilot            | No change                                                                          | GSD outputs remain optional review inputs |

## Remaining Runtime Gates

These are integration gates for product features, not for the runtime itself. The runtime ships in spec 024 with everything below in stub or absent state.

| ID       | Concern                                                              | Required resolution                                                                                                                                                                  |
| -------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GATE-001 | Google / Apple OAuth in Kratos                                       | Configure OIDC providers in Kratos and provider dashboards before the Stage 2 social-auth slice ships.                                                                              |
| GATE-002 | Lava.top live integration                                            | Map products, configure API key and webhook auth, verify a real test purchase end-to-end before the Stage 2 billing slice ships.                                                     |
| GATE-003 | Self-hosted image model                                              | Train or select the model, ship the worker container, measure P99 latency on real wardrobe photos against the 5 second gate before enabling background removal for real users.       |

## Advisory Concerns

| ID      | Concern                                                                                                    | Disposition                                                                                                                |
| ------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| ADV-001 | Single droplet leaves little headroom for spiky AI tagging traffic.                                        | Accept for v0.1; plan early extraction of the image worker or droplet upgrade if memory pressure shows up in Grafana.       |
| ADV-002 | We own Kratos config, Postgres backups, and Spaces CORS — Supabase used to do these for us.                | Accept; the production runtime spec ships the runbook for each.                                                            |
| ADV-003 | Sentry and Prometheus are not in v0.1.                                                                     | Accept; Grafana + syslog + traces is the v0.1 observability surface. Stage 2 expands it.                                   |
| ADV-004 | React Native may need bare-workflow eject if a Stage 2 feature requires a native module Expo cannot wrap.  | Accept; the bare workflow remains available via EAS without losing the Expo Router routing.                                |
| ADV-005 | The legacy `/app` Supabase shell is still in the repo until a follow-up PR removes it.                     | Accept; removal scheduled in the implementation iteration after spec 024 ships.                                            |

## Stack Approval Recommendation

Proceed with the rewritten ADRs and the production-stack runtime spec. Real production-grade implementation begins immediately after Sprint 0 gates close.

Recorded approval posture:

> Founder confirms the Phase 4 production-stack pivot: Go modular monolith behind Traefik, Ory Kratos for identity, PostgreSQL with pgvector and FTS, Redis for cache/queue, DigitalOcean Spaces for object storage, Cloudflare proxy at the edge, Resend for transactional email, Grafana + syslog + traces for v0.1 observability, React Native for mobile, Lava.top stubbed in v0.1 and integrated in v0.2, self-hosted image model deferred to Stage 2. Implementation goes straight to real services (no mock-first stage). Production credentials remain in the droplet's encrypted env and provider dashboards and are not shared with agents.
