# Docker Compose Deployment

Capsule Zero ships a production-shaped Docker Compose runtime on one Hetzner
Cloud server (migrated from DigitalOcean 2026-07-02, spec 033). At the spec-040
slice, the active stack is the **Go modular monolith API**, **Next.js web**,
Ory Kratos, plain PostgreSQL 16, and external Hetzner Object Storage; Redis and
imgproxy are later spec-024 phases. The public edge is host-managed nginx; the
compose-managed nginx service is retained only as a `docker-edge` rollback
profile. Compose is the only process supervisor for application containers;
VM-level firewalling, host nginx, backups, and secret delivery remain outside
git. PgBouncer, pgvector, a standalone worker container, and Grafana dashboards
remain deferred by ADR-007.

The full runtime is delivered by `.specify/specs/024-production-stack-runtime/` across six phases. Phase 1 ships host nginx + web (operational runbook: `docs_capsule_zero/project/devops/nginx-reverse-proxy.md`); this document describes the steady-state operational contract once every phase has shipped.

## Topology

Each active v0.1 service is declared as a separate `services:` entry in one root `docker-compose.yml`. Environment overrides for local dev (MailHog instead of Resend, API hot-reload) live in `docker-compose.dev.yml`. By default, `docker compose up -d` starts the application services only; the compose edge starts only when `--profile docker-edge` is explicitly enabled.

| Service    | Image                 | Purpose                                                                | Default host exposure                                 |
| ---------- | --------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------- |
| `nginx`    | `nginx:1.27-alpine`   | Rollback compose edge: TLS, rate-limit, `auth_request` into Kratos     | profile-gated `80`, `443` via `--profile docker-edge` |
| `web`      | local build of `/app` | Next.js App Router web frontend                                        | `127.0.0.1:3000` for host nginx                       |
| `api`      | local build of `/api` | Go modular monolith: auth/profile plus storage/upload foundation       | internal only (behind nginx)                          |
| `kratos-migrate` | `oryd/kratos`   | One-shot Kratos schema migration                                      | internal one-shot job                                 |
| `kratos`   | `oryd/kratos`         | Identity provider (email/password Stage 1)                             | internal only (behind nginx)                          |
| `postgres` | `postgres:16`         | App database + Kratos database (separate logical DBs)                  | internal only                                         |
| `mailhog`  | `mailhog/mailhog`     | Dev-only courier sink; replaced by Resend in prod                      | `127.0.0.1:8025` (dev only)                           |

Deferred runtime elements stay out of the active compose topology until ADR-007 promotion triggers fire:

| Runtime element     | Deferred stance                                                                       |
| ------------------- | ------------------------------------------------------------------------------------- |
| `pgbouncer`         | API connects directly to Postgres through `pgx` pooling in v0.1.                      |
| `pgvector`          | Plain `postgres:16` ships first; semantic-search migrations add vectors later.        |
| `redis`             | Pending spec-024 phase; there is no Redis service or queue consumer in the current stack. |
| `imgproxy`          | Pending derivative-image phase; spec 040 stores originals only.                       |
| Backup automation  | Bucket/key are provisioned; Object Lock header sanitization/risk acceptance, encryption, scheduling, retention, and restores are Phase 5. |
| Standalone `worker` | Deferred by ADR-007; no in-process Redis consumer has landed either.                  |
| `grafana`           | syslog files + traces are the v0.1 observability surface; dashboards come back later. |

The only current named data volume is Compose volume `pgdata` for PostgreSQL;
Kratos uses its separate logical database inside that same Postgres service.

TLS certificate material and the ACME webroot are host-managed paths, not
Docker volumes. The host nginx edge reads them directly; the rollback compose
edge bind-mounts `/etc/letsencrypt` and `/var/www/certbot` when the
`docker-edge` profile is active.

Object storage and email leave the droplet:

- **Hetzner Object Storage** for private originals and the provisioned future
  public-catalog/backup boundaries. The backup bucket is not evidence that
  encrypted backup automation has landed.
- **Resend** for the provisioned Kratos SMTP courier (verification and password recovery).

## Files

| Path                         | Purpose                                                                  |
| ---------------------------- | ------------------------------------------------------------------------ |
| `docker-compose.yml`         | Production-shape topology, declared per service                          |
| `docker-compose.dev.yml`     | Local dev overrides (MailHog, hot-reload, debug logs)                    |
| `infra/nginx-host/`          | host nginx server blocks for the default droplet edge                    |
| `infra/nginx/`               | rollback compose nginx config used only with `--profile docker-edge`     |
| `infra/kratos/`              | Kratos identity schema, courier (Resend SMTP), self-service flow config  |
| `infra/postgres/`            | Postgres init scripts (role grants, Kratos DB creation)                  |
| `api/Dockerfile`             | Go API multi-stage build (distroless runtime image)                      |
| `worker/Dockerfile`          | Go worker multi-stage build, introduced when ADR-007 promotes the worker |
| `app/Dockerfile`             | Next.js standalone production image                                      |
| `api/migrations/`            | Embedded SQL migration files; applied at API boot                          |
| `deploy/object-storage/`     | Redacted policy templates and exact production CORS documents              |
| `deploy/compose.env.example` | Env template for compose interpolation; copy to `.env` and fill secrets  |

## First Start

Prepare env files:

```bash
cp deploy/compose.env.example .env
```

On production, install the real values in the canonical protected plaintext
file `/opt/capsule-zero/.env`, owned by `root:root` with mode `600`. Encryption
at rest has not been established. Required keys at minimum for the current
stack are exactly the `${VAR:?…}`-guarded interpolations in
`docker-compose.yml`, which fail fast when missing:

- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `KRATOS_DB_PASSWORD`, `API_DATABASE_URL`, `SESSION_SIGNING_SECRET`
- `KRATOS_DSN`, `KRATOS_PUBLIC_BASE_URL`, `KRATOS_SMTP_CONNECTION_URI`, `SECRETS_COOKIE_0`, `SECRETS_CIPHER_0`
- `APP_BASE_URL`
- `OBJECT_STORAGE_ENDPOINT`, `OBJECT_STORAGE_REGION`, `OBJECT_STORAGE_ACCESS_KEY_ID`, `OBJECT_STORAGE_SECRET_ACCESS_KEY`, `OBJECT_STORAGE_PRIVATE_BUCKET`

Provisioned policy-boundary and later-phase keys are also present in the
template, but are not consumed by the spec-040 private upload path:

- `CF_DNS_API_TOKEN` — Stage 2 only: certbot DNS-01 against Cloudflare once the deferred front-door activates (founder decision 2026-07-02); until then certbot uses HTTP-01 directly
- `OBJECT_STORAGE_PUBLIC_BUCKET`, `OBJECT_STORAGE_PUBLIC_BASE_URL` — provisioned catalog boundary; public-catalog application behavior remains deferred
- `BACKUP_S3_ENDPOINT`, `BACKUP_S3_REGION`, `BACKUP_S3_BUCKET`, `BACKUP_S3_ACCESS_KEY_ID`, `BACKUP_S3_SECRET_ACCESS_KEY` — Phase 5 encrypted Postgres backups
- `RESEND_API_KEY`, `RESEND_FROM` — reserved for a future direct email client;
  the provisioned Kratos courier already uses `KRATOS_SMTP_CONNECTION_URI`
- `MOBILE_DEEP_LINK_SCHEME` — React Native slice

Grafana-specific secrets are introduced only after ADR-007 promotes the dashboard service back into the active runtime.

Start the stack:

```bash
docker compose up -d
```

To exercise the rollback compose edge instead of the host-managed nginx edge, stop host nginx first — the compose edge publishes the same host ports 80/443 and cannot bind while systemd nginx is active:

```bash
sudo systemctl stop nginx
docker compose --profile docker-edge up -d nginx
```

For local development against the dev override (the `--env-file` supplies dev
credentials; the base file fails fast on missing production secrets, which an
override default cannot rescue):

```bash
docker compose --env-file deploy/compose.dev.env \
  -f docker-compose.yml -f docker-compose.dev.yml up
```

Schema migrations apply during API startup (the embedded SQL migrator runs against `postgres` before the API serves traffic). The current files are `0001_initial_auth.sql`, `0002_profiles_email_unique.sql`, and `0003_object_storage_uploads.sql`. Kratos manages its own migrations against its own database via its built-in `kratos migrate sql` step run from an init container.

## Health Checks

The API container healthcheck calls internal `/livez`, which only proves the
HTTP process is serving. It deliberately does not wait on Postgres, Kratos, or
Object Storage, so a dependency stall cannot restart-loop the API or block web
startup. Full release readiness remains fail-closed on the public probe below.

Primary stack health:

```bash
curl -fsS https://capsulezero.app/api/health
```

The Go API `/api/health` reports:

- overall `ok` plus the link-time `commit`/`builtAt` deployment identity;
- Postgres reachability (direct `postgres:16` connection);
- Kratos public API reachability;
- the configured private Hetzner Object Storage bucket (HEAD probe).

Any failed dependency returns HTTP 503 with its field set to `error`. Redis and
email probes are added only when their runtime slices land; this runbook does
not claim fields the current API does not emit.

Per-service probes:

```bash
docker compose ps                    # active/default services healthy
docker compose --profile docker-edge logs nginx --tail=50
docker compose logs kratos --tail=50
docker compose logs api --tail=100
```

## Migrations

API migrations live in `api/migrations/` and apply via the embedded SQL migrator at API boot. The runner records applied versions in a dedicated `schema_migrations` table inside the app schema.

Rules:

- Add a new timestamped SQL file for every schema change; do not edit applied migrations.
- Never run destructive `down` migrations against staging or production unless a restore plan has been tested.
- Kratos schema changes follow Kratos's own migration tool; do not hand-edit Kratos tables.

For a destructive local reset only:

```bash
docker compose down -v
docker compose up -d
```

## Backups (deferred Phase 5)

The isolated Object-Locked bucket and its writer credential from bucketless
key-only project `15302925` are provisioned, but the nightly job, client-side
encryption, Object Lock header sanitization/risk acceptance, retention
enforcement, and restore drills have not landed. The following pipeline is the
Phase-5 target, not a currently scheduled command:

```bash
docker compose exec postgres pg_dump -U capsule_zero -d capsule_zero --format=custom | \
  age -r "${BACKUP_AGE_RECIPIENT}" | \
  aws --endpoint-url "${BACKUP_S3_ENDPOINT}" \
      s3 cp - "s3://${BACKUP_S3_BUCKET}/postgres/capsule-zero-$(date -u +%Y-%m-%dT%H-%M-%SZ).dump.age"
```

Retention: at least 14 days, enforced by lifecycle policy and/or Object Lock on
the backup bucket. Object Lock must be enabled when the bucket is created; it
cannot be switched on later.

The production backup bucket is `capsulezero-prod-backups` in FSN under
isolated Hetzner project `15296835`; Object Lock was enabled at creation. Its
writer belongs to bucketless key-only project `15302925`, separate from the HEL
application-asset project (`15203114`) and bucketless runtime-key project
(`15302873`). The hybrid cross-project policy allows normal `s3:PutObject`
under `postgres/*`. Its explicit denies were live-proven for object/version
reads, ACL get/put, retention/legal-hold get/put, object/version deletes,
governance bypass, bucket/version/multipart listing, and
policy/CORS/Object-Lock-configuration reads. Header conditions reject dangerous
canned ACLs and AllUsers grant-read.

Hetzner/RGW nevertheless accepts `PutObject` carrying Object Lock mode,
retain-until, or legal-hold headers. This does not expose or permit deletion of
existing objects, but it can create newly locked objects, producing a bounded
storage-DoS/cost-amplification risk. The Phase-5 uploader must forbid/sanitize
those headers and receive explicit residual-risk acceptance or wait for a
provider fix. These provisioning facts also do not authorize plaintext
uploads: backup automation must encrypt with age before the first database
object is stored.

Object storage durability is provided by Hetzner Object Storage, but it is not a
complete backup strategy by itself. Database restores must be exercised on a
temporary database at least once per quarter; cross-location asset replication is
a later resilience task after deletion/privacy semantics are defined.

## Upgrades

1. Read upstream release notes for any image tag changes (Postgres, Kratos, nginx, Redis).
2. Update image tags in `docker-compose.yml` together with any required config changes under `infra/`.
3. Validate config:
   ```bash
   docker compose --env-file deploy/compose.env.example config
   ```
4. Run local smoke checks against a fresh volume set.
5. Back up production Postgres before pulling new images on the droplet.

## Ingress

Public traffic enters via direct DNS -> host nginx on the server (ports 80/443); the Cloudflare front-door is deferred to Stage 2 (founder decision 2026-07-02, spec 033). The rollback compose nginx profile preserves the same routing contract when `docker-edge` is enabled:

- terminates Let's Encrypt TLS for `capsulezero.app` (certs issued by host certbot, mounted from `/etc/letsencrypt`),
- carries the `realip` config for Cloudflare (`set_real_ip_from` Cloudflare ranges + `real_ip_header CF-Connecting-IP`) — inert until the Stage-2 Cloudflare activation; with direct DNS, `$remote_addr` is already the true client,
- runs a per-IP `limit_req_zone` rate-limit (keyed on the realip-corrected client),
- runs an `auth_request` against Kratos for protected routes,
- routes `/` to `web`,
- routes `/api/*` to `api`,
- returns `404` for `/self-service/*` and `/sessions/*` — the Kratos public API is **not** exposed at the edge. All auth writes go through the Go API (`/api/auth/*`), which drives Kratos over the internal network and owns duplicate-identifier sanitization + the auth rate limit; recovery emails contain code only and verification email links land on app routes via custom Kratos courier templates, so no public self-service path is needed in v0.1.
- adds a `grafana.capsulezero.app` route only after ADR-007 promotes Grafana.

The Cloudflare proxy (edge TLS offload, DDoS protection, Bot Fight Mode, CDN) joins at Stage 2; until then host nginx is the sole edge. Postgres, Redis, and both the Kratos public and admin APIs stay internal to the compose network in production; no host port is exposed (the dev override binds Kratos public to `127.0.0.1:4433` for local inspection only).

## Operational Constraints

- Single droplet, single Docker daemon; no Kubernetes, no Docker Swarm in v0.1.
- All server secrets live in the protected plaintext
  `/opt/capsule-zero/.env` (`root:root`, mode `600`) or provider dashboards;
  never in repo or chat. Do not claim filesystem encryption without evidence.
- The application Object Storage credential belongs to bucketless key-only
  project `15302873`. Its cross-project private policy permits bucket listing
  plus put/get/delete only under `item-originals/*` and `smoke/spec-040/*`; the
  public bucket explicitly denies it `s3:*`. The backup writer belongs to
  bucketless key-only project `15302925` and uses the caveated hybrid policy
  described above; backup CORS is absent. It cannot read/delete existing data,
  but Put-time Object Lock headers remain a bounded storage-DoS/cost residual
  and block backup automation pending header sanitization plus explicit
  acceptance/provider fix.
- Policy/CORS readback, the runtime audit, the backup hybrid-policy audit with
  its recorded Object Lock header exception, bucketless-project checks, and the
  protected env rotation passed. `/opt/capsule-zero/.env`
  remained `root:root` mode `600`, with uploads disabled. The superseded
  runtime/backup keys and both temporary policy operators were deleted; only the new
  cross-project keys remain. The post-revocation standalone Go smoke passed
  readiness, signed PUT of `10485760` bytes, HEAD, signed GET checksum match,
  and cleanup. Exact-origin private/public CORS probes returned `200` with the
  expected headers/max-age `300`; attacker probes and backup preflight returned
  `403` without `Access-Control-Allow-Origin`.
- A presigned URL is a short-lived bearer capability whose host/path/query
  reveal the bucket, key, and access-key ID; never log or retain it as evidence.
  Completion requires both `jobId` and `assetId`. Until PUT expiry, replay can
  overwrite the final object and leave a completed asset's stored ETag stale;
  this is an accepted bounded residual for private originals only.
- syslog files are rotated by the host (`/etc/logrotate.d/capsule-zero-syslog`) with 7 day retention; Grafana/Loki are added only after ADR-007 promotion, so the syslog file is the primary v0.1 log surface.
- Sentry and Prometheus are deferred to Stage 2.
