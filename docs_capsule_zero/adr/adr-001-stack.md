# ADR-001: Stack Overview

> **Monetization freeze (2026-07-16):** Every coin, balance, Lava.top, billing, payment-product,
> pricing, or purchase-flow statement below is superseded historical context under `PRODUCT-PLAN.md`
> D2. Do not implement, provision, expose, test as a release gate, or use it for a new contract or
> code generation. Stage 4 will delete or replace the retained legacy after choosing a model.
>
> **Shared merchant-catalog freeze (2026-07-24):** Marketplace link import and semantic search
> across user-imported merchant imagery remain accepted product design under `PRODUCT-PLAN.md`
> Q8, but they are not an active runtime contract. Do not add routes, schemas, generated-client
> operations, storage permissions, jobs, migrations, or provider behavior until the
> compliance-scheme spec and external legal review have both landed. The owned preset catalog is
> a separate Stage-2 surface.

## Status

Accepted (rewritten 2026-06-27 for the production-stack pivot; API-gateway row updated 2026-06-28 from Traefik to nginx; v0.1 slim-runtime rows aligned with ADR-007 on 2026-07-01; storage row revised 2026-07-10 from DigitalOcean Spaces to Hetzner Object Storage; Cloudflare/Tailscale production edge activated 2026-07-22 in spec 047).

## Context

Capsule Zero is targeting production-grade v0.1 directly. There is no Stage 1 mock-first posture: the team ships against real services from the first feature slice. The stack must support:

- a premium mobile-first Next.js web frontend matching the HTML prototypes
- a React Native iOS and Android app sharing the same backend
- email/password authentication in v0.1, with Google OAuth and Apple Sign-In deferred to Stage 2
- private user wardrobe data and photos
- three target upload methods: photo upload plus the Q8-gated marketplace link import and
  shared merchant-catalog search
- self-hosted image processing under a 5 second quality gate (deferred to Stage 2)
- a shared item database for public marketplace imports — **retained, with conditions (2026-07-24, [`PRODUCT-PLAN.md`](../../PRODUCT-PLAN.md) §4-Q8, option (б)):** we hold no licence to republish merchant product images, so this requirement stands only on the Polyvore pattern — the user imports, the platform makes no extra copies, every image links back, and notice-and-takedown plus a repeat-infringer policy are live. Gated on a separate compliance-scheme spec **and** external legal review before any implementation
- EN and RU from v0.1 day 1, with ES-AR globally deferred to v0.2
- coins-only monetization through Lava.top one-time purchases — coins and image enhancement are in the v0.2 backlog; v0.1 ships with a Lava.top stub
- a single Hetzner Cloud server running docker-compose with every service declared explicitly (migrated from DigitalOcean on 2026-07-02, spec 033 — the single-server docker-compose shape is unchanged)
- self-hosted observability under tight RAM budget (no Sentry/Prometheus in v0.1)
- an active Cloudflare application front-door for DDoS protection and CDN, without assuming that native Hetzner Object Storage catalog URLs share that CDN

The previous Phase 4 stack (Supabase / Vercel / Flutter / Photoroom / mock-first Stage 1) is dropped before any product code derived from it lands in production. `/app` remains the canonical provider-abstracted Next.js frontend; the retired Supabase provider inside it is removed domain by domain as the Go API absorbs each bounded context.

## Decision

Adopt the following production stack:

| Layer                    | Decision                                                                                                                                                          |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web frontend             | Next.js App Router, React, TypeScript                                                                                                                             |
| Mobile                   | React Native (iOS + Android), sharing the same Go API contract                                                                                                    |
| Styling                  | Tailwind CSS v4 with Capsule Zero glass tokens                                                                                                                    |
| Backend                  | Go modular monolith (single binary; active bounded contexts are added slice by slice). Merchant-catalog search and moderation remain Q8-blocked design until both gates land |
| API gateway              | Host-managed nginx 1.28 with Let's Encrypt TLS (certbot on host), rate-limit (`limit_req_zone`), and `auth_request` into Ory Kratos; nginx 1.31 container for rollback/local dev |
| Database                 | PostgreSQL 16 with Postgres FTS in v0.1; pgvector and PgBouncer are deferred by ADR-007. Shared merchant semantic search additionally requires both Q8 gates before any schema or migration |
| Cache / sessions / queue | Redis 7 with a Redis-based job queue (River or asynq) — Kafka is deferred until services split                                                                    |
| Auth                     | Ory Kratos email/password in v0.1; Google OAuth and Apple Sign-In in Stage 2                                                                                      |
| File storage             | Hetzner Object Storage (S3-compatible); private assets via signed URLs, public catalog via native object URLs until a separate catalog-CDN slice                 |
| Image processing         | Self-hosted Capsule Zero model behind a Go worker, deferred to Stage 2                                                                                            |
| Email                    | Resend for transactional email (verification, password reset, security notifications), MailHog for local dev                                                      |
| DNS / anti-DDoS          | Spaceship registrar; Cloudflare authoritative DNS + proxy on the apex and `www`, Full (strict) TLS, DNSSEC, default WAF/DDoS controls, and Cloudflare-only origin web ingress are active since 2026-07-22 (spec 047) |
| Observability            | syslog file logs + OpenTelemetry trace export in v0.1; Grafana dashboards, Sentry, and Prometheus are deferred                                                    |
| Hosting                  | Single Hetzner Cloud server (CX23: 2 vCPU / 4 GB / 40 GB, Ubuntu 26.04) running docker-compose — migrated from the DigitalOcean droplet 2026-07-02 (spec 033)     |
| Payments                 | Lava.top one-time product payments on web; stubbed in v0.1, integrated after core wardrobe and capsule flows ship                                                 |
| i18n                     | next-intl                                                                                                                                                         |
| Local web state          | Zustand                                                                                                                                                           |
| Client server-state      | TanStack Query                                                                                                                                                    |
| Forms                    | React Hook Form + Zod                                                                                                                                             |
| API boundary             | Go HTTP API behind nginx; OpenAPI is the contract source. Web/Next.js Server Actions and Route Handlers call the Go API; mobile consumes the same OpenAPI surface |

### Why a Go modular monolith and not microservices

For v0.1 the team is small and the operational budget is one droplet. A modular monolith gives the architectural cleanliness of microservices (bounded contexts, ownership boundaries, explicit interfaces) with the operational simplicity of one binary, one set of migrations, one deploy. Services can be extracted later when a real bottleneck or independent scaling pattern justifies it; the first natural extraction is the image-processing worker, which uses its own scaling profile.

### Why not Node.js or Python for the API

Go gives small static binaries (~15 MB images), low memory footprint (essential on a 4 GB droplet), goroutine concurrency for the upload/search workload, and a calm operational story (no JVM tuning, no GIL). Node.js would force us to add a process manager and accept a heavier baseline image; Python (FastAPI) is convenient but ships heavy runtimes and is best reserved for ML inference if/when we self-host an image model.

### Why React Native and not Flutter

The previous Phase 4 chose Flutter. The pivot replaces it with React Native: shared TypeScript ecosystem with the web frontend, easier hiring overlap with web engineers, and a faster path to publishing the iOS/Android shell once the core wardrobe API is up. The cost is some platform-specific glue we previously did not need; the benefit is one less language in the stack and a much smaller mental tax for engineers moving between web and mobile.

### Why Hetzner Object Storage and not local disk, Volumes, or Spaces/R2

The 2026-07-02 hosting migration moved production compute to Hetzner, and the
2026-07-10 founder clarification moved object storage there too. The storage
decision now follows the runtime provider: Hetzner Object Storage is
S3-compatible, available in European locations (`fsn1`, `nbg1`, `hel1`), and
works behind the same Go `internal/storage` adapter boundary planned for S3-compatible object storage.

The server root disk and a one-node MinIO are rejected for canonical user photos:
the current CX23 has enough free space for OS, Docker, Postgres, and logs, but
not for unbounded wardrobe media growth. Hetzner Cloud Volumes are block storage
for mounted server files and bounded scratch/model cache; they are not the
browser/mobile signed-upload boundary and are attachable to only one server at a
time. DigitalOcean Spaces is superseded because it would keep storage in the old
provider after compute moved away. Cloudflare R2 remains a future
catalog/storage candidate, but activating Cloudflare as the application front
door does not justify moving storage again without a measured cost or delivery
benefit.

Two Hetzner constraints shape implementation: Object Storage has no built-in CDN,
so v0.1 public catalog assets use native object URLs until a separate catalog-CDN slice; and there is
no default data-at-rest encryption, so database backups are encrypted client-side
and personal-photo storage requires an explicit privacy/security acceptance or a
later SSE-C/API-proxy design. While Hetzner's current high-traffic advisory
recommends HEL for new buckets, provisioning must re-check status and run a real
signed-upload smoke before creating production buckets.

### Why no Kafka in v0.1

The 4 GB server cannot host Kafka (JVM eats > 1 GB of RAM) and we do not yet have multiple
consumers. A Redis-based job queue covers active image-processing and webhook workloads.
Embedding generation and marketplace parsing are target workloads only: no job types or handlers
for them may enter the active contract before both Q8 gates land. Kafka becomes interesting only
when the image worker, the API, and a second downstream consumer all need durable, replayable
streams — i.e. when we extract the image worker into its own service.

### Why Cloudflare and not nginx rate-limit alone

The 2026-07-02 Stage-2 deferral was superseded by the 2026-07-22 activation
(spec 047). Cloudflare now provides authoritative DNS, DDoS protection, CDN,
strict TLS, and the public proxy boundary; the origin firewalls accept web
traffic only from Cloudflare ranges. nginx still terminates origin TLS and owns
application routing, sustained rate limits, and auth routing. Bot Fight Mode is
deliberately disabled because the unscoped Free-plan control challenged the API
health monitor; scoped edge rate limiting and the default WAF/DDoS controls stay
active.

### Why nginx and not Traefik or Caddy

The pivot ADR originally accepted Traefik v3, then revisited the choice when Phase 1 of spec 024 had to migrate the already-live droplet (Caddy + a single web container) onto the new stack. Three options were back on the table — keep Caddy, take Traefik, or move to nginx:

- **Caddy** is the simplest TLS story (auto Let's Encrypt out of the box), but it stores cert material in a JSON-encoded internal format that is awkward to share with sidecar tooling, and its config DSL is one more thing the team has to learn versus reuse.
- **Traefik** shines when many services are discovered through Docker labels and you want one process to do DNS-01 ACME, forward-auth, and rate-limit. It also wants `docker.sock` on the edge container, which we did not want exposed.
- **nginx** is universally understood, has the smallest mental tax for ops engineers joining later, and its first-class directives (`limit_req_zone`, `auth_request`, `proxy_pass`, `proxy_cache`) cover everything we need for the Go API + Kratos forward-auth in one config file we own. Cert lifecycle moves to `certbot` on the host (the certbot apt package already ships a renewal timer) and a deploy hook reloads nginx in-place.

We chose nginx for v0.1 (originally 1.27). The live Ubuntu host now runs nginx 1.28, while the maintained rollback/local container image is 1.31. Reconsider if and when we add per-service routing for more than ~10 containers, at which point Traefik's label-driven model would start paying off.

### Implementation rules

- Every external dependency lives behind an interface inside the Go monolith (`internal/auth`, `internal/storage`, `internal/email`, `internal/billing`, …). Tests substitute fakes; production wires the real client.
- The OpenAPI spec at `docs_capsule_zero/adr/openapi.yaml` is the contract. Web and mobile both consume generated clients from it.
- All services run inside docker-compose. There is one `docker-compose.yml`; environment overrides live in `docker-compose.dev.yml` (reintroduced when there is a service worth running locally next to Next.js) and (when ready) `docker-compose.prod.yml`. Every service is declared as a separate `services:` block.
- Production secrets live only in the droplet's encrypted `.env` and provider dashboards; never in repo.
- ES-AR stays a deferred locale: active routing, OpenAPI enums, and generated clients carry `en` and `ru` only.

## Consequences

Positive:

- The stack is self-hostable on one droplet, with a clean migration path to multi-node Kubernetes when load justifies it.
- Bounded contexts inside the monolith map directly to future microservice extractions.
- One language (Go) for backend, one (TypeScript) for web + mobile — smaller cognitive surface than Supabase + Flutter + Vercel + RLS DSL.
- No BaaS lock-in. The schema, auth, and storage all run on commodity software the team owns.
- Cloudflare absorbs the noisy traffic floor; the origin is no longer directly exposed for web traffic.
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
- **DigitalOcean Spaces:** previously accepted, but superseded when storage was moved into Hetzner with compute on 2026-07-10.
- **Cloudflare R2 + AWS SES + Mailgun:** equivalent feature set, but adds storage/email provider coupling without a measured benefit; the active application proxy does not require R2.
- **Flutter mobile (previous Phase 4 choice):** great DX, dropped to align languages with the web team.
- **Stripe Checkout for payments:** previously accepted, then superseded by the Lava.top constraint.

## References

- Go std library: https://pkg.go.dev/std
- nginx documentation: https://nginx.org/en/docs/
- certbot (Let's Encrypt client): https://eff-certbot.readthedocs.io/
- Ory Kratos: https://www.ory.sh/docs/kratos/
- PostgreSQL pgvector: https://github.com/pgvector/pgvector
- Hetzner Object Storage overview: https://docs.hetzner.com/storage/object-storage/overview/
- Hetzner Object Storage general FAQ: https://docs.hetzner.com/storage/object-storage/faq/general/
- Hetzner Object Storage supported actions: https://docs.hetzner.com/storage/object-storage/supported-actions/
- Hetzner Object Storage high-traffic status advisory: https://status.hetzner.com/incident/ebd62173-d902-4e75-939a-265c0b3f1ddb
- Cloudflare proxy & DDoS: https://developers.cloudflare.com/ddos-protection/
- Resend: https://resend.com/docs
- Lava.top developer API: https://developers.lava.top/en
- next-intl: https://next-intl.dev/
- Production runtime spec: `.specify/specs/024-production-stack-runtime/`
