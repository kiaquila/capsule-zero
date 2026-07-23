# Backend Docs

> **Monetization freeze (2026-07-16):** Every coin, balance, Lava.top, billing, payment-product,
> pricing, or purchase-flow statement below is superseded historical context under `PRODUCT-PLAN.md`
> D2. Do not implement, provision, expose, test as a release gate, or use it for a new contract or
> code generation. Stage 4 will delete or replace the retained legacy after choosing a model.

## Stack

Capsule Zero v0.1 backend is a **Go modular monolith** running behind nginx on a single Hetzner Cloud server (migrated from DigitalOcean 2026-07-02, spec 033). Every deployed v0.1 container is declared as a separate `services:` entry in one root `docker-compose.yml`. The current API contains the auth/profile, storage, and uploads packages; Redis and any queue consumer are deferred to a later spec-024 phase.

| Layer                    | Choice                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| API process              | Go monolith (`/api`) — single binary with bounded contexts                                                          |
| Background worker        | Not landed; a future Redis consumer may run inside `/api`, while a standalone `/worker` remains deferred by ADR-007 |
| API gateway / TLS        | nginx 1.27 with host-managed Let's Encrypt certbot, rate-limit middleware, `auth_request` into Ory Kratos           |
| Auth                     | Ory Kratos email/password + Google sign-in (spec 037, native-flow OIDC); Apple Sign-In in Stage 2                                      |
| Database                 | PostgreSQL 16 with Postgres FTS; API connects directly in v0.1 as the least-privilege `capsule_app` role (spec 034), PgBouncer and pgvector are deferred by ADR-007 |
| Cache / sessions / queue | Redis 7 planned for a later spec-024 phase; no Redis service or queue consumer is active in the current slice       |
| Object storage           | Hetzner Object Storage (S3-compatible; no built-in CDN in v0.1)                                                      |
| Email                    | Resend SMTP courier for Kratos is provisioned; there is no `internal/email` transactional client in the current API |
| Front-door               | Cloudflare proxy → Cloudflare-only origin firewall → host nginx; scoped edge rate limit + default WAF/DDoS controls (spec 047) |
| Observability            | syslog file logs + OpenTelemetry trace export; Grafana dashboards deferred by ADR-007 (Sentry/Prometheus → Stage 2) |
| Migrations               | Embedded SQL migration files applied at API boot, serialized behind a `pg_advisory_lock` (spec 034); files from `0002` on must be runnable by the non-superuser `capsule_app` owner role |

The Go monolith owns all business logic; the database has no RLS. Authorization is enforced in every Go handler against the Kratos session before any data access. The implemented auth, storage, and uploads boundaries accept narrow interfaces so package tests can substitute fakes per call site, but there is **no global mock mode** — production code wires the real clients (see ADR-006).

## Module Layout

```
/api
  cmd/api/                        ← main.go: wiring + HTTP server
  cmd/storage-smoke/              ← redacted signed upload/read/cleanup probe
  internal/
    auth/                         ← Kratos session validation, user resolution
    config/                       ← fail-closed runtime configuration
    db/                           ← pgx pool and embedded migration runner
    httpx/                        ← JSON request/response helpers
    kratos/                       ← Kratos client
    profiles/                     ← profile repository and handlers
    ratelimit/                    ← in-process request throttling
    storage/                      ← S3-compatible Object Storage client wrapper
    uploads/                      ← signed PUT + owner-bound init/complete lifecycle
  migrations/                     ← embedded SQL migration files
```

Wardrobe, capsule, methodology, marketplace, catalog, billing, moderation,
Redis/event-bus, and standalone-worker packages are target bounded contexts;
they have not landed in the current API tree.

## API Surface

OpenAPI (`docs_capsule_zero/adr/openapi.yaml`) is the client contract source. Web and mobile consume generated clients from it. The current Go API uses the standard-library `net/http` `ServeMux`, not an OpenAPI-generated router. `scripts/check-api-contract.mjs` is a textual guard between `api-spec.md` and OpenAPI; Go package tests separately verify the manually registered routes and handler behavior.

The implemented router currently exposes health, auth/profile, and these two
authenticated upload routes:

- `POST /api/uploads/photo/init`
- `POST /api/uploads/photo/complete`

The broader target surface (full list in OpenAPI) remains:

- `GET /api/health` — public dependency readiness and build identity
- `GET /livez` — internal dependency-free container liveness (documented as a
  server-only operations route)
- `GET /api/profile`, `PATCH /api/profile`, `POST/DELETE /api/profile/avatar`
- `GET /api/journey/categories`, `POST /api/journey/custom-category/validate`, `POST /api/palette/validate`
- `POST/GET/PATCH /api/capsules`, `/api/capsules/current`, `/api/capsules/{id}/items`, `/outfits`, `/gaps`, `/shopping-list`
- `GET/POST/PATCH/DELETE /api/items`, `/api/items/{id}/favorite`, `/api/items/{id}/status`
- `GET /api/uploads/{jobId}` after a later job-status slice (init/complete are already implemented)
- `POST /api/imports/marketplace`, `GET /api/imports/{id}`, `POST /api/imports/{id}/confirm`
- `GET /api/catalog/search`, `POST /api/catalog/items/{id}/add`
- `POST /api/billing/invoices`, `GET /api/billing/invoices/{id}`, `POST /api/billing/coins/spend` (stub in v0.1)
- `POST /api/webhooks/lava` (stub in v0.1)
- `GET/POST /api/admin/moderation/items` (admin role required)

Auth: every authenticated route runs through nginx `auth_request` into Kratos and re-validates the session in the handler. Public routes (`health`, `catalog/search` public reads) skip session resolution.

## Database Schema

The physical application schema currently consists of exactly three embedded
migrations:

- `0001_initial_auth.sql` creates `profiles` for the auth/profile slice;
- `0002_profiles_email_unique.sql` replaces its email lookup index with a
  unique index;
- `0003_object_storage_uploads.sql` adds owner-bound `upload_jobs` and
  unattached `item_assets` for the original-photo foundation.

The tables in the remaining subsections describe the target domain model unless
they are named in that migration inventory; later bounded-context slices must
add them through new migrations.

### Identity And Billing

| Table         | Purpose                                                                                                                                            |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `profiles`    | App profile keyed by internal UUID, with `kratos_identity_id` unique reference, display name, avatar, language, country, city, cached coin balance |
| `coin_ledger` | Planned append-only coin purchase/spend/refund log; not present in the current migrations                                                       |
| `lava_events` | Planned processed Lava.top webhook event IDs for idempotency; not present in the current migrations                                             |

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
| `item_assets`         | Currently only unattached private `original` asset metadata; other variants arrive in later slices                            |
| `upload_jobs`         | Currently only owner-bound `photo_upload` rows with `queued` or `completed` status                                             |
| `marketplace_imports` | Submitted URLs, parse status, parsed candidates, confirmed item link                                                           |
| `moderation_queue`    | Internal approval flow before marketplace items become public catalog entries                                                  |

Deferred by ADR-007: `item_embeddings` stores pgvector vectors and searchable text when the semantic-search slice promotes pgvector. v0.1 catalog search uses FTS-ready item text on plain Postgres.

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

Object storage is Hetzner Object Storage (see ADR-003). The production asset
buckets are provisioned in HEL under project `15203114`; the Object-Locked
backup bucket is isolated in FSN under project `15296835`. All application
access is mediated by the Go storage adapter:

- private reads use **signed GET URLs** with TTL ≤ 15 min;
- public catalog images are served from the public catalog bucket's native object URL until a separate catalog-CDN slice is wired;
- uploads use **signed PUT URLs** with TTL ≤ 5 min, issued by the Go API after metadata validation;
- browser/mobile uploads require explicit `/api/uploads/photo/complete` with both
  the issued `jobId` and `assetId`; the API verifies the object by `HeadObject`
  and the completion endpoint is idempotent;
- nightly Postgres backups encrypt client-side before writing to the isolated
  Object-Locked bucket through a fixed-header uploader. The root-owned timer,
  off-server private key, retention posture, and restore drill are recorded in
  spec 047.

Spec 040 provides the private-bucket adapter and unattached original-photo
metadata only. It requires explicit static credentials, probes the private
bucket in `/api/health`, fails startup on invalid configuration, and reports
readiness `503` when the bucket is unavailable. Dependency-free `/livez` owns
container liveness so a slow external probe cannot restart-loop the API or
block web startup; release verification still requires `/api/health` to pass.
Postgres and Kratos are probed on every health request;
only the serialized Object Storage result is cached for at most five seconds,
preventing request bursts from amplifying into one S3 probe per caller. Upload
init performs a fresh storage probe before issuing a URL. Init returns the URL/header/expiry capability and public
job/asset identifiers; it has no separate `storagePath` field. A presigned URL
is nevertheless not opaque: its host, path, and signature query necessarily
reveal the bucket, object key, and access-key ID. It is a short-lived bearer
capability and must never enter logs, chat, screenshots, or committed evidence.
The runtime key lives in bucketless key-only project `15302873`. Its
cross-project policy grants `s3:ListBucket` on the private bucket and
`s3:PutObject`, `s3:GetObject`, and `s3:DeleteObject` only under
`item-originals/*` and `smoke/spec-040/*`; the public-catalog bucket explicitly
denies that principal `s3:*` while retaining anonymous `s3:GetObject`. The
backup writer lives in bucketless key-only project `15302925`. Its hybrid
policy allows normal `s3:PutObject` under `postgres/*`. Live probes confirmed
explicit denies for object/version reads, ACL get/put, retention/legal-hold
get/put, object/version deletes, governance bypass, bucket/version/multipart
listing, and policy/CORS/Object-Lock-configuration reads. Put header conditions
also reject dangerous canned ACLs and AllUsers grant-read.

The same audit found a bounded provider exception: Hetzner/RGW accepts
`PutObject` with Object Lock mode, retain-until, or legal-hold headers despite
the dedicated action denies. It does not let the writer read or delete existing
data, but it can create newly locked objects and amplify storage cost or denial
of service. Spec 047 accepts that residual behind a root-owned uploader that
constructs a fixed local header set with no caller-controlled metadata. Daily
`age`-encrypted backups, Object Lock retention, and a full restore drill passed
before activation; the private key stays off-server. Policy readback and the caveated live audits passed
before the server env was atomically rotated, preserving `root:root` mode `600`
and `OBJECT_STORAGE_UPLOADS_ENABLED=false`. The superseded runtime and backup
keys plus both temporary policy-operator keys were revoked; only the new
cross-project keys remain. A post-revocation standalone Go smoke then passed
readiness, signed PUT of `10485760` bytes, HEAD, signed GET with matching
checksum, and cleanup.

Anyone holding an unexpired PUT URL can replay it and overwrite the same final
object with bytes that satisfy the signed size/content-type constraints. If
that happens after completion, the persisted ETag can become stale because an
idempotent repeated completion does not re-read the object. The founder accepts
this bounded residual for the private original-only foundation; staging keys,
conditional writes, or an API-proxy alternative must be revisited before
broader storage use.

`OBJECT_STORAGE_UPLOADS_ENABLED` defaults to `false`: a route-level gate runs
before session resolution, so implemented init/complete routes return
`503 FEATURE_UNAVAILABLE` without a Kratos, profile-database, Object Storage, or
upload-job/asset repository operation. The handlers repeat the same check for
defense in depth. The dedicated key-only policy hardening is complete;
activation still waits for owner quota, abandoned-upload cleanup, and wardrobe
attachment.

Hetzner Object Storage has no default data-at-rest encryption. Backups must be encrypted before upload; personal-photo storage follows the ADR-003 direct-upload security posture unless a later SSE-C/API-proxy design supersedes it.

## Background Jobs

The current slice does not enqueue background work and has no Redis consumer.
Its only durable job type is `photo_upload`, which transitions from `queued` to
`completed` when the verified original asset is materialized. Planned async job
types are:

- `marketplace_parse` — fetch + parse a product URL into candidate items
- `item_embedding` — deferred until ADR-007 promotes pgvector and the semantic-search slice
- `webhook_fanout` — forward a verified Lava.top webhook to downstream handlers (v0.2)
- `background_removal` — Stage 2, when the self-hosted image model ships

When the Redis phase lands, async jobs may be produced by API handlers and
consumed by queue-worker goroutines inside `/api`; a standalone `/worker`
remains behind ADR-007's promotion trigger. That future queue design must not
be inferred from the current `photo_upload` state row.

## Production Runtime

The v0.1 runtime is delivered by `.specify/specs/024-production-stack-runtime/`. Active v0.1 services are declared as separate `services:` blocks in `docker-compose.yml`; deferred rows remain in the catalog only to document their promotion path:

| Service     | Image                    | Role                                                                                                             | v0.1                                                                     |
| ----------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `nginx`     | `nginx:1.27-alpine`      | Rollback compose edge (TLS, redirect, rate-limit, Kratos `auth_request`); the default edge is host-managed nginx | rollback-only — profile-gated `docker-edge`                              |
| `kratos`    | `oryd/kratos`            | Identity provider                                                                                                | yes                                                                      |
| `postgres`  | `postgres:16`            | Application database + Kratos database                                                                           | yes                                                                      |
| `pgbouncer` | `edoburu/pgbouncer`      | Connection pool in front of Postgres                                                                             | deferred — see [ADR-007](../../adr/adr-007-v01-slim-runtime.md)          |
| `redis`     | `redis:7-alpine`         | Cache, sessions, job queue                                                                                       | pending — spec 024 Phase 3                                                |
| `api`       | local build of `/api`    | Go monolith; no Redis worker goroutines in the current slice                                                      | yes                                                                      |
| `worker`    | local build of `/worker` | Background job consumer                                                                                          | folded into `api` — see [ADR-007](../../adr/adr-007-v01-slim-runtime.md) |
| `web`       | local build of `/app`    | Next.js App Router web frontend                                                                                  | yes                                                                      |
| `imgproxy`  | `darthsim/imgproxy`      | On-the-fly image resize/WebP conversion for derived sizes                                                        | pending — spec 024 Phase 4; spec 040 stores originals only                |
| `grafana`   | `grafana/grafana`        | Dashboards over syslog and traces                                                                                | deferred — see [ADR-007](../../adr/adr-007-v01-slim-runtime.md)          |
| `mailhog`   | `mailhog/mailhog`        | Dev-only; replaced by Resend in prod                                                                             | dev only                                                                 |

For v0.1 the runtime ships with **`pgbouncer`, `grafana`, and the standalone
`worker` container deferred**. Each has an explicit promotion trigger in
[ADR-007](../../adr/adr-007-v01-slim-runtime.md). Redis and imgproxy are still
planned v0.1 services but have not landed at the spec-040 slice. No Redis queue
implementation has landed yet; its contract and deployment topology remain
later-slice work.

## Environment Variables

| Variable                      | Scope         | Purpose                                                                                               |
| ----------------------------- | ------------- | ----------------------------------------------------------------------------------------------------- |
| `POSTGRES_URL`                | server        | Direct Postgres connection string for v0.1 (PgBouncer DSN is introduced only after ADR-007 promotion) |
| `CF_DNS_API_TOKEN`            | server        | Cloudflare DNS API token only if a future DNS-01 automation path replaces v0.1 HTTP-01 certbot        |
| `REDIS_URL`                   | later phase   | Redis connection string once the Redis runtime slice lands                                             |
| `KRATOS_PUBLIC_URL`           | server        | Kratos public API base URL                                                                            |
| `KRATOS_ADMIN_URL`            | server        | Kratos admin API base URL                                                                             |
| `AUTH_GOOGLE_ENABLED`         | server        | Gates `/api/auth/google/*` + the provider probe (spec 037); mirrors the Kratos OIDC env switch        |
| `OBJECT_STORAGE_ENDPOINT`     | server        | Hetzner Object Storage S3 endpoint (for example `https://hel1.your-objectstorage.com`)                 |
| `OBJECT_STORAGE_REGION`       | server        | Application Object Storage region (`hel1` in the provisioned production topology)                       |
| `OBJECT_STORAGE_ACCESS_KEY_ID` | server        | Runtime key from bucketless key-only project `15302873`; access is granted cross-project by bucket policy |
| `OBJECT_STORAGE_SECRET_ACCESS_KEY` | server   | Runtime key secret from bucketless key-only project `15302873`                                         |
| `OBJECT_STORAGE_PRIVATE_BUCKET` | server      | Private assets bucket (avatars, item originals, processed variants, marketplace imports)               |
| `OBJECT_STORAGE_UPLOADS_ENABLED` | server      | Default-off activation gate; key hardening is complete, but quota/cleanup/attachment still block enablement |
| `OBJECT_STORAGE_PUBLIC_BUCKET` | server       | Public catalog bucket, introduced when moderated catalog imagery is served                             |
| `OBJECT_STORAGE_PUBLIC_BASE_URL` | server     | Native public object URL base until a separate catalog-CDN slice                                       |
| `BACKUP_S3_ENDPOINT`          | host backup   | Isolated endpoint (`https://fsn1.your-objectstorage.com` in production)                                |
| `BACKUP_S3_REGION`            | host backup   | Backup bucket region (`fsn1` in production)                                                           |
| `BACKUP_S3_BUCKET`            | host backup   | Object-Locked bucket used by the active encrypted daily backup timer                                  |
| `BACKUP_S3_ACCESS_KEY_ID`     | host backup   | Writer key from bucketless key-only project `15302925`; never passed to the API                        |
| `BACKUP_S3_SECRET_ACCESS_KEY` | host backup   | Writer key secret from bucketless key-only project `15302925`; never passed to the API                 |
| `KRATOS_SMTP_CONNECTION_URI`  | server        | Active Resend SMTP courier connection for Kratos                                                      |
| `RESEND_API_KEY`              | later phase   | Future direct transactional-email client; Kratos currently uses SMTP                                  |
| `RESEND_FROM`                 | later phase   | Future direct-client sender (for example `no-reply@capsulezero.app`)                                  |
| `LAVA_API_KEY`                | server        | Lava.top API key (v0.2 — stubbed in v0.1)                                                             |
| `LAVA_WEBHOOK_API_KEY`        | server        | Lava.top webhook auth header (v0.2 — stubbed in v0.1)                                                 |
| `LAVA_API_URL`                | server        | Lava.top base URL (v0.2)                                                                              |
| `APP_BASE_URL`                | server/web    | Public app URL (e.g. `https://capsulezero.app`)                                                       |
| `MOBILE_DEEP_LINK_SCHEME`     | server/mobile | Mobile return URL scheme for auth callbacks (Stage 2)                                                 |
| `EMBEDDING_PROVIDER`          | server        | Catalog embedding provider switch, introduced when ADR-007 promotes pgvector/semantic search          |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | server        | Trace exporter target                                                                                 |

## Local Development

1. Clone the repo and `git fetch --all --prune`.
2. Generate the local mkcert files per `nginx-reverse-proxy.md` and use the
   committed throwaway `deploy/compose.dev.env` values.
3. Run the production-shape stack with its local TLS/MailHog override:
   ```bash
   docker compose --env-file deploy/compose.dev.env \
     -f docker-compose.yml -f docker-compose.dev.yml up --build
   ```
4. Seed methodology data (`color_catalog`, `category_catalog`, `compatibility_rules`) from `docs_capsule_zero/project/methodology/`.
5. Open `https://capsulezero.local`; nginx proxies the landed API routes under
   the same origin. Disabled Object Storage placeholders keep uploads closed
   and make the dependency health field fail closed until a gitignored local
   env copy supplies dedicated non-production Hetzner credentials.
6. Kratos UI flows are rendered by the web frontend; the dev override routes
   verification/recovery mail to MailHog at `http://localhost:8025`.

## Landed Runtime Foundation And Remaining Gates

The auth/profile and object-storage foundations have delivered:

- `docker-compose.yml` with the active web, API, Postgres, and Kratos services;
- `0001_initial_auth.sql`, `0002_profiles_email_unique.sql`, and
  `0003_object_storage_uploads.sql`; Kratos manages its own database migrations;
- Kratos identity schema and the provisioned Resend SMTP courier;
- nginx config with TLS, rate-limit, and Kratos `auth_request` middleware;
- API health checks for Postgres, Kratos, and private Object Storage;
- Cloudflare proxy active on the apex + `www`, with Cloudflare-only origin web ingress and Tailscale-only SSH (spec 047);
- Hetzner Object Storage asset/backup buckets, bucketless runtime/backup key
  projects, cross-project policies, and exact-origin asset CORS;
  policy readback, the runtime audit, the caveated backup hybrid-policy audit,
  and protected env rotation passed. The backup writer cannot read/delete
  existing data, but Put-time Object Lock headers remain a bounded
  storage-DoS/cost risk. Spec 047 accepts it behind a root-owned fixed-header
  uploader; encrypted scheduling, retention, and a restore drill are complete. The old same-project
  runtime/backup keys and both temporary policy operators were revoked, and the
  post-revocation signed 10 MiB
  PUT/HEAD/GET/checksum/delete smoke passed with checksum verification and
  cleanup. Exact-origin private/public probes succeeded, attacker origins and
  backup preflight failed closed without an allow-origin header. Uploads still
  wait for owner quota, orphan cleanup, and wardrobe attachment.

Redis, async queue consumers, and imgproxy remain later spec-024 phases.
Encrypted database-backup automation landed in spec 047; personal-photo upload
activation remains separate.

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
