# ADR-001: Stack Overview

## Status

Accepted (rewritten 2026-06-27 for the production-stack pivot).

## Context

Capsule Zero is targeting production-grade v0.1 directly. There is no Stage 1 mock-first posture: the team ships against real services from the first feature slice. The stack must support:

- a premium mobile-first Next.js web frontend matching the HTML prototypes
- a React Native iOS and Android app sharing the same backend
- email/password authentication in v0.1, with Google OAuth and Apple Sign-In deferred to Stage 2
- private user wardrobe data and photos
- three upload methods: photo upload, marketplace link import, semantic catalog search
- self-hosted image processing under a 5 second quality gate (deferred to Stage 2)
- a shared item database for public marketplace imports
- EN and RU from v0.1 day 1, with ES-AR globally deferred to v0.2
- coins-only monetization through Lava.top one-time purchases — coins and image enhancement are in the v0.2 backlog; v0.1 ships with a Lava.top stub
- a single DigitalOcean droplet running docker-compose with every service declared explicitly
- self-hosted observability under tight RAM budget (no Sentry/Prometheus in v0.1)
- a Cloudflare front-door for DDoS protection and CDN

The previous Phase 4 stack (Supabase / Vercel / Flutter / Photoroom / mock-first Stage 1) is dropped before any product code derived from it lands in production. Existing legacy code under `/app` is scheduled for removal in the implementation iteration that follows `.specify/specs/024-production-stack-runtime/`.

## Decision

Adopt the following production stack:

| Layer                   | Decision                                                                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Web frontend            | Next.js App Router, React, TypeScript                                                                                               |
| Mobile                  | React Native (iOS + Android), sharing the same Go API contract                                                                      |
| Styling                 | Tailwind CSS v4 with Capsule Zero glass tokens                                                                                       |
| Backend                 | Go modular monolith (single binary, bounded contexts: auth, wardrobe, capsule, search, billing, moderation)                          |
| API gateway             | Traefik v3 with Let's Encrypt TLS, rate-limit middleware, forward-auth into Ory Kratos                                              |
| Database                | PostgreSQL 16 with pgvector (semantic) and Postgres FTS (full-text), PgBouncer for connection pooling                                |
| Cache / sessions / queue| Redis 7 with a Redis-based job queue (River or asynq) — Kafka is deferred until services split                                       |
| Auth                    | Ory Kratos email/password in v0.1; Google OAuth and Apple Sign-In in Stage 2                                                         |
| File storage            | DigitalOcean Spaces (S3-compatible) with the built-in Spaces CDN                                                                     |
| Image processing        | Self-hosted Capsule Zero model behind a Go worker, deferred to Stage 2                                                               |
| Email                   | Resend for transactional email (verification, password reset, security notifications), MailHog for local dev                         |
| DNS / anti-DDoS         | Spaceship registrar pointed at Cloudflare nameservers; Cloudflare proxy enabled on `capsulezero.app` for DDoS and CDN                |
| Observability           | Grafana dashboards + syslog (file) logs + a tracing exporter; Sentry and Prometheus deferred to Stage 2                              |
| Hosting                 | Single DigitalOcean droplet running docker-compose; minimum 4 GB RAM / 2 vCPU / 80 GB disk                                            |
| Payments                | Lava.top one-time product payments on web; stubbed in v0.1, integrated after core wardrobe and capsule flows ship                    |
| i18n                    | next-intl                                                                                                                            |
| Local web state         | Zustand                                                                                                                              |
| Client server-state     | TanStack Query                                                                                                                       |
| Forms                   | React Hook Form + Zod                                                                                                                |
| API boundary            | Go HTTP API behind Traefik; OpenAPI is the contract source. Web/Next.js Server Actions and Route Handlers call the Go API; mobile consumes the same OpenAPI surface |

### Why a Go modular monolith and not microservices

For v0.1 the team is small and the operational budget is one droplet. A modular monolith gives the architectural cleanliness of microservices (bounded contexts, ownership boundaries, explicit interfaces) with the operational simplicity of one binary, one set of migrations, one deploy. Services can be extracted later when a real bottleneck or independent scaling pattern justifies it; the first natural extraction is the image-processing worker, which uses its own scaling profile.

### Why not Node.js or Python for the API

Go gives small static binaries (~15 MB images), low memory footprint (essential on a 4 GB droplet), goroutine concurrency for the upload/search workload, and a calm operational story (no JVM tuning, no GIL). Node.js would force us to add a process manager and accept a heavier baseline image; Python (FastAPI) is convenient but ships heavy runtimes and is best reserved for ML inference if/when we self-host an image model.

### Why React Native and not Flutter

The previous Phase 4 chose Flutter. The pivot replaces it with React Native: shared TypeScript ecosystem with the web frontend, easier hiring overlap with web engineers, and a faster path to publishing the iOS/Android shell once the core wardrobe API is up. The cost is some platform-specific glue we previously did not need; the benefit is one less language in the stack and a much smaller mental tax for engineers moving between web and mobile.

### Why DigitalOcean Spaces and not Cloudflare R2

Hosting is on DigitalOcean, so Spaces ships in one bill, with one set of credentials, and includes a CDN with no extra wiring. R2 has cheaper egress on paper, but requires gluing two providers together and is a Stage 2 optimization if storage cost becomes a real line item.

### Why no Kafka in v0.1

The droplet cannot host Kafka (JVM eats > 1 GB of RAM) and we do not yet have multiple consumers. A Redis-based job queue covers image processing, embedding generation, marketplace parsing, and webhook fanout. Kafka becomes interesting only when the image worker, the API, and a second downstream consumer all need durable, replayable streams — i.e. when we extract the image worker into its own service.

### Why Cloudflare and not the Traefik bot middleware alone

Cloudflare is free at the level we need, gives DNS, DDoS protection, bot fight mode, CDN, and TLS edge — all in one provider — and lets the droplet stay behind a proxy. Traefik then handles app-level TLS and routing without also having to play "first line of defense".

### Implementation rules

- Every external dependency lives behind an interface inside the Go monolith (`internal/auth`, `internal/storage`, `internal/email`, `internal/billing`, …). Tests substitute fakes; production wires the real client.
- The OpenAPI spec at `docs_capsule_zero/adr/openapi.yaml` is the contract. Web and mobile both consume generated clients from it.
- All services run inside docker-compose. There is one `docker-compose.yml`; environment overrides live in `docker-compose.dev.yml` and (when ready) `docker-compose.prod.yml`. Every service is declared as a separate `services:` block.
- Production secrets live only in the droplet's encrypted `.env` and provider dashboards; never in repo.
- ES-AR stays a deferred locale: active routing, OpenAPI enums, and generated clients carry `en` and `ru` only.

## Consequences

Positive:

- The stack is self-hostable on one droplet, with a clean migration path to multi-node Kubernetes when load justifies it.
- Bounded contexts inside the monolith map directly to future microservice extractions.
- One language (Go) for backend, one (TypeScript) for web + mobile — smaller cognitive surface than Supabase + Flutter + Vercel + RLS DSL.
- No BaaS lock-in. The schema, auth, and storage all run on commodity software the team owns.
- Cloudflare absorbs the noisy traffic floor for free.
- Resend keeps Kratos email flows working without rolling our own SMTP.

Tradeoffs:

- The team owns auth (Ory Kratos config), storage CORS, RLS-equivalent enforcement in the Go layer, observability, migrations, and backups. Supabase used to do most of these for us.
- A 4 GB droplet leaves little headroom; we will hit a wall under spiky AI tagging traffic and must size up or extract the image worker early.
- React Native means writing some native bridges if the camera/upload UX needs deep platform features. Flutter would have given a richer out-of-the-box widget set.
- Self-hosting the image model is a future build cost; until it ships, background removal is best-effort or manual.

## Alternatives Considered

- **Supabase (previous Phase 4 choice):** fast to ship, but locks data, auth, and storage into one vendor. Rejected during the production-stack pivot.
- **Custom Node/NestJS backend:** acceptable, but pays a higher memory tax than Go on a small droplet and forces ProcessManager + cluster discipline.
- **Python/FastAPI backend:** keep on the table for ML inference services only.
- **Microservices from Day 1 with Kafka and API Gateway routing across services:** real overhead for one engineer team with no scaling justification. Rejected; the monolith stays modular so extraction is cheap later.
- **Vercel + serverless:** fast preview deployments, but ties prod to a vendor and complicates background workers and pgvector tuning.
- **Cloudflare R2 + AWS SES + Mailgun:** equivalent feature set, but adds two extra billing relationships compared with Spaces + Resend.
- **Flutter mobile (previous Phase 4 choice):** great DX, dropped to align languages with the web team.
- **Stripe Checkout for payments:** previously accepted, then superseded by the Lava.top constraint.

## References

- Go std library: https://pkg.go.dev/std
- Traefik v3: https://doc.traefik.io/traefik/
- Ory Kratos: https://www.ory.sh/docs/kratos/
- PostgreSQL pgvector: https://github.com/pgvector/pgvector
- DigitalOcean Spaces: https://www.digitalocean.com/products/spaces
- Cloudflare proxy & DDoS: https://developers.cloudflare.com/ddos-protection/
- Resend: https://resend.com/docs
- Lava.top developer API: https://developers.lava.top/en
- next-intl: https://next-intl.dev/
- Production runtime spec: `.specify/specs/024-production-stack-runtime/`
