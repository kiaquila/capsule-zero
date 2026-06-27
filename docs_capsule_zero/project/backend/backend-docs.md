# Backend Docs

## Stack

Capsule Zero v0.1 backend is a **Go modular monolith** running behind Traefik on a single DigitalOcean droplet. All services are declared as separate `services:` entries in one root `docker-compose.yml`.

| Layer                  | Choice                                                                                                |
| ---------------------- | ----------------------------------------------------------------------------------------------------- |
| API process            | Go monolith (`/api`) — single binary with bounded contexts                                            |
| Background worker      | Go worker (`/worker`) — Redis-queue consumer for image jobs, embeddings, webhook fanout               |
| API gateway / TLS      | Traefik v3 with Let's Encrypt, rate-limit middleware, forward-auth into Ory Kratos                    |
| Auth                   | Ory Kratos email/password (Stage 1); Google OAuth and Apple Sign-In in Stage 2                        |
| Database               | PostgreSQL 16 with `pgvector` and Postgres FTS, PgBouncer pool in front                               |
| Cache / sessions / queue| Redis 7 (cache, idempotency keys, River/asynq job queue)                                             |
| Object storage         | DigitalOcean Spaces (S3-compatible, built-in CDN)                                                     |
| Email                  | Resend (SMTP courier for Kratos; transactional sends from `internal/email`)                           |
| Front-door             | Cloudflare proxy on `capsulezero.app` for DDoS, bot fight, CDN                                        |
| Observability          | Grafana dashboards + syslog file logs + OpenTelemetry trace export (Sentry/Prometheus → Stage 2)      |
| Migrations             | `golang-migrate` SQL files applied at API boot                                                        |

The Go monolith owns all business logic; the database has no RLS. Authorization is enforced in every Go handler against the Kratos session before any data access. Internal interfaces (`internal/auth`, `internal/storage`, `internal/email`, `internal/billing`, …) let tests substitute fakes per call site, but there is **no global mock mode** — production code wires the real client (see ADR-006).

## Module Layout (target after spec 024)

```
/api
  cmd/api/                        ← main.go: wiring + HTTP server
  internal/
    auth/                         ← Kratos session validation, user resolution
    profile/                      ← profiles, language, avatar metadata
    wardrobe/                     ← items, wardrobe_entries, favorites, statuses
    capsule/                      ← capsules, palette, members, outputs
    methodology/                  ← color compatibility, OPR, gap analysis (pure logic)
    upload/                       ← signed PUT URLs, upload_jobs, asset attach
    marketplace/                  ← link parser adapters, import jobs
    catalog/                      ← FTS + pgvector search, public reads
    billing/                      ← Lava.top stub, invoice + webhook handlers, coin ledger
    moderation/                   ← admin moderation queue
    storage/                      ← Spaces client wrapper (S3 SDK)
    email/                        ← Resend client wrapper
    eventbus/                     ← Redis-backed job enqueue / consume
    httpapi/                      ← chi router, OpenAPI-typed handlers, middleware
    obs/                          ← logger, tracer, syslog sink
  migrations/                     ← golang-migrate SQL files
/worker
  cmd/worker/                     ← main.go: queue consumer
  internal/
    jobs/                         ← image jobs (Stage 2), embeddings, webhook fanout
```

## API Surface

OpenAPI (`docs_capsule_zero/adr/openapi.yaml`) is the single contract source. Web and mobile both consume generated clients from it. The Go API uses an OpenAPI-typed router (e.g. `oapi-codegen`) so handler signatures stay in sync with the spec.

Route groups (full list in OpenAPI):

- `GET /api/health` — liveness + dependency probe
- `GET /api/profile`, `PATCH /api/profile`, `POST/DELETE /api/profile/avatar`
- `GET /api/journey/categories`, `POST /api/journey/custom-category/validate`, `POST /api/palette/validate`
- `POST/GET/PATCH /api/capsules`, `/api/capsules/current`, `/api/capsules/{id}/items`, `/outfits`, `/gaps`, `/shopping-list`
- `GET/POST/PATCH/DELETE /api/items`, `/api/items/{id}/favorite`, `/api/items/{id}/status`
- `POST /api/uploads/photo/init`, `POST /api/uploads/photo/complete`, `GET /api/uploads/jobs/{id}`
- `POST /api/imports/marketplace`, `GET /api/imports/{id}`, `POST /api/imports/{id}/confirm`
- `GET /api/catalog/search`, `POST /api/catalog/items/{id}/add`
- `POST /api/billing/invoices`, `GET /api/billing/invoices/{id}`, `POST /api/billing/coins/spend` (stub in v0.1)
- `POST /api/webhooks/lava` (stub in v0.1)
- `GET/POST /api/admin/moderation/items` (admin role required)

Auth: every authenticated route runs through Traefik forward-auth into Kratos and re-validates the session in the handler. Public routes (`health`, `catalog/search` public reads) skip session resolution.

## Database Schema

### Identity And Billing

| Table         | Purpose                                                                                                  |
| ------------- | -------------------------------------------------------------------------------------------------------- |
| `profiles`    | App profile keyed by internal UUID, with `kratos_identity_id` unique reference, display name, avatar, language, country, city, cached coin balance |
| `coin_ledger` | Append-only coin purchase/spend/refund log (table ships in v0.1; coin features in v0.2 backlog)          |
| `lava_events` | Processed Lava.top webhook event IDs for idempotency (table ships in v0.1; integration in v0.2)          |

Canonical ownership column name is `user_id` (referencing `profiles.id`). Shared items use a two-table ownership pattern: `items.visibility` controls catalog exposure, while `wardrobe_entries.user_id` controls each user's relationship to an item.

### Static Methodology Data

| Table                 | Purpose                                                              |
| --------------------- | -------------------------------------------------------------------- |
| `color_catalog`       | Seeded 51-color system with IDs, groups, names, HEX values           |
| `category_catalog`    | Seeded garment categories, wardrobe type applicability, outfit layer |
| `compatibility_rules` | Seeded compatibility matrix for color groups                         |

### Items And Assets

| Table                 | Purpose                                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `items`               | Canonical item metadata: name, category, colors, brand, material, source URL, source type, owner, visibility, moderation state |
| `wardrobe_entries`    | Per-user relationship to an item: active/uncapsulated/for_sale/for_repair, favorite, from catalog, user overrides              |
| `item_assets`         | Storage object metadata for original, processed, thumbnail, marketplace, and avatar variants                                   |
| `upload_jobs`         | Status and error tracking for photo uploads, background removal, marketplace parsing, and embeddings                           |
| `marketplace_imports` | Submitted URLs, parse status, parsed candidates, confirmed item link                                                           |
| `moderation_queue`    | Internal approval flow before marketplace items become public catalog entries                                                  |
| `item_embeddings`     | pgvector vectors and searchable text for public catalog items                                                                  |

### Capsules

| Table                      | Purpose                                                                   |
| -------------------------- | ------------------------------------------------------------------------- |
| `capsules`                 | User capsule: wardrobe type, locked palette flag, item/outfit counts, OPR |
| `capsule_palette_colors`   | Selected immutable color IDs per capsule                                  |
| `capsule_category_targets` | Selected category targets and quantities from Journey Step 2              |
| `capsule_items`            | Wardrobe entries included in a capsule                                    |
| `outfits`                  | Generated static outfit combinations                                      |
| `outfit_items`             | Items included in each generated outfit                                   |
| `gap_recommendations`      | Category/color/priority/impact recommendations                            |

## Authorization Model

There is no Postgres RLS. Authorization is enforced in Go on every request:

- The `auth` middleware resolves `user_id` from the Kratos session cookie before the handler runs and rejects requests without a valid session.
- Repository methods take `user_id` as an explicit parameter; they refuse to return rows that do not belong to that user.
- Public catalog reads use a dedicated read path that is not session-gated but only returns rows where `items.visibility = 'public'`.
- Personal uploads and their assets are never public in v0.1.
- Marketplace-imported items start private or moderation-pending and only become public after explicit approval.
- Coin ledger inserts and Lava.top event writes are only callable from internal billing/webhook handlers — there is no public route that mutates the ledger.
- Admin moderation routes require an admin role claim attached to the Kratos identity.

## Storage

Object storage is DigitalOcean Spaces, with logical buckets implemented as path prefixes inside one `capsulezero` bucket (see ADR-003 for the prefix table). All access is mediated by the Go storage adapter:

- private reads use **signed GET URLs** with TTL ≤ 15 min;
- public catalog images are served by the Spaces CDN through the `catalog-public` prefix;
- uploads use **signed PUT URLs** with TTL ≤ 5 min, issued by the Go API after metadata validation;
- nightly Postgres backups go to the `backups/` prefix with 14 day retention.

## Background Jobs

Job types:

- `marketplace_parse` — fetch + parse a product URL into candidate items
- `item_embedding` — compute embedding for a public catalog item
- `webhook_fanout` — forward a verified Lava.top webhook to downstream handlers (v0.2)
- `background_removal` — Stage 2, when the self-hosted image model ships

Jobs are produced by API handlers and consumed by the `/worker` process. Job queue is Redis-based (River or asynq), with retries and dead-letter handling. Job status writes back to `upload_jobs`.

## Production Runtime

The full runtime is delivered by `.specify/specs/024-production-stack-runtime/`. Running services (each declared as a separate `services:` block in `docker-compose.yml`):

| Service        | Image                            | Role                                                       |
| -------------- | -------------------------------- | ---------------------------------------------------------- |
| `traefik`      | `traefik:v3`                     | API gateway, TLS, rate-limit, forward-auth                 |
| `kratos`       | `oryd/kratos`                    | Identity provider                                          |
| `postgres`     | `pgvector/pgvector:pg16`         | Application database + Kratos database                     |
| `pgbouncer`    | `edoburu/pgbouncer`              | Connection pool in front of Postgres                       |
| `redis`        | `redis:7-alpine`                 | Cache, sessions, job queue                                 |
| `api`          | local build of `/api`            | Go monolith                                                |
| `worker`       | local build of `/worker`         | Background job consumer                                    |
| `web`          | local build of `/web`            | Next.js App Router web frontend                            |
| `imgproxy`     | `darthsim/imgproxy`              | On-the-fly image resize/WebP conversion for derived sizes  |
| `grafana`      | `grafana/grafana`                | Dashboards over syslog and traces                          |
| `mailhog`      | `mailhog/mailhog`                | Dev-only; replaced by Resend in prod                       |

## Environment Variables

| Variable                  | Scope        | Purpose                                                                |
| ------------------------- | ------------ | ---------------------------------------------------------------------- |
| `POSTGRES_URL`            | server       | Postgres connection string (via PgBouncer)                              |
| `CF_DNS_API_TOKEN`        | server       | Cloudflare DNS API token for Traefik DNS-01 ACME                         |
| `REDIS_URL`               | server       | Redis connection string                                                 |
| `KRATOS_PUBLIC_URL`       | server       | Kratos public API base URL                                              |
| `KRATOS_ADMIN_URL`        | server       | Kratos admin API base URL                                               |
| `SPACES_ACCESS_KEY`       | server       | DigitalOcean Spaces access key                                          |
| `SPACES_SECRET_KEY`       | server       | DigitalOcean Spaces secret key                                          |
| `SPACES_BUCKET`           | server       | Bucket name (single bucket, prefixes inside)                            |
| `SPACES_REGION`           | server       | Spaces region (e.g. `fra1`)                                             |
| `SPACES_CDN_BASE`         | server       | Public CDN base URL for `catalog-public` reads                          |
| `RESEND_API_KEY`          | server       | Resend API key for transactional email                                  |
| `RESEND_FROM`             | server       | Verified sender (e.g. `no-reply@capsulezero.app`)                       |
| `LAVA_API_KEY`            | server       | Lava.top API key (v0.2 — stubbed in v0.1)                              |
| `LAVA_WEBHOOK_API_KEY`    | server       | Lava.top webhook auth header (v0.2 — stubbed in v0.1)                  |
| `LAVA_API_URL`            | server       | Lava.top base URL (v0.2)                                                |
| `APP_BASE_URL`            | server/web   | Public app URL (e.g. `https://capsulezero.app`)                         |
| `MOBILE_DEEP_LINK_SCHEME` | server/mobile| Mobile return URL scheme for auth callbacks (Stage 2)                   |
| `EMBEDDING_PROVIDER`      | server       | Catalog embedding provider switch                                       |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | server   | Trace exporter target                                                   |

## Local Development

1. Clone the repo and `git fetch --all --prune`.
2. Copy `.env.example` files into `.env.local` for each service.
3. Run the production-shape stack with the dev override (`docker-compose.dev.yml` swaps Resend for MailHog and enables hot-reload for `api` and `worker`):
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.dev.yml up
   ```
4. Seed methodology data (`color_catalog`, `category_catalog`, `compatibility_rules`) from `docs_capsule_zero/project/methodology/`.
5. Open `http://localhost:3000` for the web frontend; Traefik proxies the API at `http://localhost/api/...`.
6. Kratos UI flows are rendered by the web frontend; MailHog catches verification/recovery emails at `http://localhost:8025`.

## Sprint 0 Backend Gate

Before the first feature slice (slice 01 — auth/session/profile), the production runtime spec must deliver:

- `docker-compose.yml` with every service in the table above declared explicitly;
- `migrations/0001_initial_schema.sql` with all tables, indexes, FKs, enum/check constraints, and seed references;
- `migrations/0002_kratos_schema.sql` for Kratos (or Kratos managing its own migrations against a separate database in Postgres);
- Kratos identity schema, courier (Resend SMTP) configured, sample identity admin script;
- Traefik dynamic config with TLS, rate-limit, and forward-auth middlewares;
- Health-check on every service plus a smoke script that walks the stack end-to-end;
- Cloudflare proxy active on `capsulezero.app`;
- DigitalOcean Spaces bucket with CORS configured;
- Resend account with SPF/DKIM published.

Feature PRs after that must not introduce ad-hoc schema changes outside migrations.

## Seed Data

Seed data must include:

- 51 color records from `docs_capsule_zero/project/methodology/colors.md`
- garment categories from `docs_capsule_zero/project/methodology/categories.md`
- compatibility matrix from `docs_capsule_zero/project/methodology/colors.md`
- coin pack definitions matching market docs (5, 15, 30 coin packs) — wired to Lava.top in v0.2
- a small public catalog fixture for semantic search smoke testing

## References

- Stack ADR: `docs_capsule_zero/adr/adr-001-stack.md`
- Auth ADR: `docs_capsule_zero/adr/adr-002-auth.md`
- Storage ADR: `docs_capsule_zero/adr/adr-003-storage.md`
- Production-first posture ADR: `docs_capsule_zero/adr/adr-006-mock-first-mvp-stage-one.md`
- API spec: `docs_capsule_zero/adr/api-spec.md`
- Production runtime spec: `.specify/specs/024-production-stack-runtime/`
