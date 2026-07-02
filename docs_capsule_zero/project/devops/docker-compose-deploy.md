# Docker Compose Deployment

Capsule Zero ships a production-shaped Docker Compose runtime that runs the **Go modular monolith API**, the **Next.js web frontend**, and the active v0.1 supporting infrastructure (Ory Kratos, plain PostgreSQL 16, Redis, imgproxy) as separate services on a single Hetzner Cloud server (migrated from DigitalOcean 2026-07-02, spec 033). The public edge is host-managed nginx in the current Phase 1 runtime; the compose-managed nginx service is retained only as a `docker-edge` rollback profile. Compose is the only process supervisor for application containers; VM-level firewalling, host nginx, backups, and secret delivery remain outside git. PgBouncer, pgvector, a standalone worker container, and Grafana dashboards remain deferred by ADR-007.

The full runtime is delivered by `.specify/specs/024-production-stack-runtime/` across six phases. Phase 1 ships host nginx + web (operational runbook: `docs_capsule_zero/project/devops/nginx-reverse-proxy.md`); this document describes the steady-state operational contract once every phase has shipped.

## Topology

Each active v0.1 service is declared as a separate `services:` entry in one root `docker-compose.yml`. Environment overrides for local dev (MailHog instead of Resend, API hot-reload) live in `docker-compose.dev.yml`. By default, `docker compose up -d` starts the application services only; the compose edge starts only when `--profile docker-edge` is explicitly enabled.

| Service    | Image                 | Purpose                                                                | Default host exposure                                 |
| ---------- | --------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------- |
| `nginx`    | `nginx:1.27-alpine`   | Rollback compose edge: TLS, rate-limit, `auth_request` into Kratos     | profile-gated `80`, `443` via `--profile docker-edge` |
| `web`      | local build of `/app` | Next.js App Router web frontend                                        | `127.0.0.1:3000` for host nginx                       |
| `api`      | local build of `/api` | Go modular monolith; also runs Redis queue consumer goroutines in v0.1 | internal only (behind nginx)                          |
| `kratos`   | `oryd/kratos`         | Identity provider (email/password Stage 1)                             | internal only (behind nginx)                          |
| `postgres` | `postgres:16`         | App database + Kratos database (separate logical DBs)                  | internal only                                         |
| `redis`    | `redis:7-alpine`      | Cache, sessions, job queue                                             | internal only                                         |
| `imgproxy` | `darthsim/imgproxy`   | On-the-fly image resize/WebP for derived sizes                         | internal only (behind nginx)                          |
| `mailhog`  | `mailhog/mailhog`     | Dev-only courier sink; replaced by Resend in prod                      | `127.0.0.1:8025` (dev only)                           |

Deferred runtime elements stay out of the active compose topology until ADR-007 promotion triggers fire:

| Runtime element     | Deferred stance                                                                       |
| ------------------- | ------------------------------------------------------------------------------------- |
| `pgbouncer`         | API connects directly to Postgres through `pgx` pooling in v0.1.                      |
| `pgvector`          | Plain `postgres:16` ships first; semantic-search migrations add vectors later.        |
| Standalone `worker` | Redis queue consumer runs as goroutines inside `api` in v0.1.                         |
| `grafana`           | syslog files + traces are the v0.1 observability surface; dashboards come back later. |

Persistent data lives in named Docker volumes:

- `capsule-zero_postgres-data`
- `capsule-zero_redis-data`
- `capsule-zero_kratos-data`
- `capsule-zero_syslog`

TLS certificate material and the ACME webroot are host-managed paths, not
Docker volumes. The host nginx edge reads them directly; the rollback compose
edge bind-mounts `/etc/letsencrypt` and `/var/www/certbot` when the
`docker-edge` profile is active.

Object storage and email leave the droplet:

- **DigitalOcean Spaces** for user/avatar/catalog assets and Postgres backups.
- **Resend** for transactional email (Kratos verification, password recovery, security notifications).

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
| `deploy/compose.env.example` | Env template for compose interpolation; copy to `.env` and fill secrets  |

## First Start

Prepare env files:

```bash
cp deploy/compose.env.example .env
```

Fill the real values for the server's encrypted `.env`. Required keys at minimum for the
current Phase-2 stack — exactly the `${VAR:?…}`-guarded interpolations in
`docker-compose.yml`, which fail fast when missing:

- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `KRATOS_DB_PASSWORD`, `API_DATABASE_URL`, `SESSION_SIGNING_SECRET`
- `KRATOS_DSN`, `KRATOS_PUBLIC_BASE_URL`, `KRATOS_SMTP_CONNECTION_URI`, `SECRETS_COOKIE_0`, `SECRETS_CIPHER_0`
- `APP_BASE_URL`

Later-phase keys — **not** required for the v0.1 bootstrap, listed so the template reads
complete when their slices land:

- `CF_DNS_API_TOKEN` — Stage 2 only: certbot DNS-01 against Cloudflare once the deferred front-door activates (founder decision 2026-07-02); until then certbot uses HTTP-01 directly
- `SPACES_ACCESS_KEY`, `SPACES_SECRET_KEY`, `SPACES_BUCKET`, `SPACES_REGION`, `SPACES_CDN_BASE` — Phase 4 (Spaces storage slice)
- `RESEND_API_KEY`, `RESEND_FROM` — Phase 4 (real Resend courier lands with the recovery/verification slice)
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

Schema migrations apply during API startup (the embedded SQL migrator runs against `postgres` before the API serves traffic). Kratos manages its own migrations against its own database via its built-in `kratos migrate sql` step run from an init container.

## Health Checks

Primary stack health:

```bash
curl -fsS https://capsulezero.app/api/health
```

The Go API `/api/health` reports:

- API process status
- Postgres reachability (direct `postgres:16` connection)
- Redis reachability
- Kratos public API reachability
- Spaces bucket reachability (HEAD probe)
- Resend reachability (lightweight metadata call)

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

## Backups

Database backup (nightly cron — shipped with spec 024):

```bash
docker compose exec postgres pg_dump -U capsule_zero -d capsule_zero --format=custom | \
  aws --endpoint-url "https://${SPACES_REGION}.digitaloceanspaces.com" \
      s3 cp - "s3://${SPACES_BUCKET}/backups/capsule-zero-$(date -u +%Y-%m-%dT%H-%M-%SZ).dump"
```

Retention: 14 days, enforced by a lifecycle policy on the `backups/` prefix.

Object storage durability is provided by DigitalOcean Spaces; no extra backup of Spaces objects is required for v0.1. Restore plans must be exercised on staging at least once per quarter.

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
- returns `404` for `/self-service/*` and `/sessions/*` — the Kratos public API is **not** exposed at the edge this slice. All auth writes go through the Go API (`/api/auth/*`), which drives Kratos over the internal network and owns duplicate-identifier sanitization + the auth rate limit; recovery/verification browser flows are deferred, so no public self-service path is needed yet. The recovery/verification (and Stage 2 OAuth) slice re-exposes only the exact public paths its completion UI needs.
- adds a `grafana.capsulezero.app` route only after ADR-007 promotes Grafana.

The Cloudflare proxy (edge TLS offload, DDoS protection, Bot Fight Mode, CDN) joins at Stage 2; until then host nginx is the sole edge. Postgres, Redis, and both the Kratos public and admin APIs stay internal to the compose network in production; no host port is exposed (the dev override binds Kratos public to `127.0.0.1:4433` for local inspection only).

## Operational Constraints

- Single droplet, single Docker daemon; no Kubernetes, no Docker Swarm in v0.1.
- All secrets live in the droplet's encrypted `.env` and provider dashboards; never in repo or chat.
- syslog files are rotated by the host (`/etc/logrotate.d/capsule-zero-syslog`) with 7 day retention; Grafana/Loki are added only after ADR-007 promotion, so the syslog file is the primary v0.1 log surface.
- Sentry and Prometheus are deferred to Stage 2.
