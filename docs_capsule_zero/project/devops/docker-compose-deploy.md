# Docker Compose Deployment

Capsule Zero ships a production-shaped Docker Compose runtime that runs the **Go modular monolith API**, the **Next.js web frontend**, and the supporting infrastructure (Ory Kratos, PostgreSQL with pgvector, Redis, Traefik, imgproxy, Grafana) as separate services on a single DigitalOcean droplet. Compose is the only process supervisor; VM-level firewalling, backups, and secret delivery remain outside git.

The full runtime is delivered by `.specify/specs/024-production-stack-runtime/`. This document describes the steady-state operational contract once that spec ships.

## Topology

Each service is declared as a separate `services:` entry in one root `docker-compose.yml`. Environment overrides for local dev (MailHog instead of Resend, hot-reload for `api` and `worker`) live in `docker-compose.dev.yml`.

| Service     | Image                            | Purpose                                                        | Default host exposure         |
| ----------- | -------------------------------- | -------------------------------------------------------------- | ----------------------------- |
| `traefik`   | `traefik:v3`                     | Edge: TLS (Let's Encrypt), rate-limit, forward-auth into Kratos| `80`, `443`                   |
| `web`       | local build of `/web`            | Next.js App Router web frontend                                | internal only (behind Traefik)|
| `api`       | local build of `/api`            | Go modular monolith                                            | internal only (behind Traefik)|
| `worker`    | local build of `/worker`         | Redis-queue consumer (image jobs, embeddings, webhook fanout)  | internal only                 |
| `kratos`    | `oryd/kratos`                    | Identity provider (email/password Stage 1)                     | internal only (behind Traefik)|
| `postgres`  | `pgvector/pgvector:pg16`         | App database + Kratos database (separate logical DBs)          | internal only                 |
| `pgbouncer` | `edoburu/pgbouncer`              | Connection pool in front of Postgres                           | internal only                 |
| `redis`     | `redis:7-alpine`                 | Cache, sessions, job queue                                     | internal only                 |
| `imgproxy`  | `darthsim/imgproxy`              | On-the-fly image resize/WebP for derived sizes                 | internal only (behind Traefik)|
| `grafana`   | `grafana/grafana`                | Dashboards over syslog files and OTLP traces                   | `https://grafana.capsulezero.app` via Traefik |
| `mailhog`   | `mailhog/mailhog`                | Dev-only courier sink; replaced by Resend in prod              | `127.0.0.1:8025` (dev only)   |

Persistent data lives in named Docker volumes:

- `capsule-zero_postgres-data`
- `capsule-zero_redis-data`
- `capsule-zero_kratos-data`
- `capsule-zero_traefik-letsencrypt`
- `capsule-zero_grafana-data`
- `capsule-zero_syslog`

Object storage and email leave the droplet:

- **DigitalOcean Spaces** for user/avatar/catalog assets and Postgres backups.
- **Resend** for transactional email (Kratos verification, password recovery, security notifications).

## Files

| Path                                | Purpose                                                                       |
| ----------------------------------- | ----------------------------------------------------------------------------- |
| `docker-compose.yml`                | Production-shape topology, declared per service                               |
| `docker-compose.dev.yml`            | Local dev overrides (MailHog, hot-reload, debug logs)                          |
| `infra/traefik/`                    | Traefik static + dynamic config: TLS, middlewares, forward-auth               |
| `infra/kratos/`                     | Kratos identity schema, courier (Resend SMTP), self-service flow config       |
| `infra/postgres/`                   | Postgres init scripts (pgvector extension, role grants, Kratos DB creation)   |
| `api/Dockerfile`                    | Go API multi-stage build (distroless runtime image)                           |
| `worker/Dockerfile`                 | Go worker multi-stage build                                                   |
| `web/Dockerfile`                    | Next.js standalone production image                                            |
| `api/migrations/`                   | golang-migrate SQL files; applied at API boot                                  |
| `deploy/compose.env.example`        | Env template for compose interpolation; copy to `.env` and fill secrets        |

## First Start

Prepare env files:

```bash
cp deploy/compose.env.example .env
```

Fill the real values for the droplet's encrypted `.env`. Required keys at minimum:

- `POSTGRES_PASSWORD`, `KRATOS_DSN`, `KRATOS_SECRETS_COOKIE`, `KRATOS_SECRETS_CIPHER`
- `CF_DNS_API_TOKEN` for Traefik DNS-01 ACME against Cloudflare
- `SPACES_ACCESS_KEY`, `SPACES_SECRET_KEY`, `SPACES_BUCKET`, `SPACES_REGION`, `SPACES_CDN_BASE`
- `RESEND_API_KEY`, `RESEND_FROM`
- `APP_BASE_URL`, `MOBILE_DEEP_LINK_SCHEME`
- `GRAFANA_ADMIN_PASSWORD`

Start the stack:

```bash
docker compose up -d
```

For local development against the dev override:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

Schema migrations apply during API startup (golang-migrate runs against `postgres` before the API serves traffic). Kratos manages its own migrations against its own database via its built-in `kratos migrate sql` step run from an init container.

## Health Checks

Primary stack health:

```bash
curl -fsS https://capsulezero.app/api/health
```

The Go API `/api/health` reports:

- API process status
- Postgres reachability (through PgBouncer)
- Redis reachability
- Kratos public API reachability
- Spaces bucket reachability (HEAD probe)
- Resend reachability (lightweight metadata call)

Per-service probes:

```bash
docker compose ps                    # all services healthy
docker compose logs traefik --tail=50
docker compose logs kratos --tail=50
docker compose logs api --tail=100
```

## Migrations

API migrations live in `api/migrations/` and apply via golang-migrate at API boot. The runner records applied versions in a dedicated `schema_migrations` table inside the app schema.

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

1. Read upstream release notes for any image tag changes (Postgres, Kratos, Traefik, Redis, Grafana).
2. Update image tags in `docker-compose.yml` together with any required config changes under `infra/`.
3. Validate config:
   ```bash
   docker compose --env-file deploy/compose.env.example config
   ```
4. Run local smoke checks against a fresh volume set.
5. Back up production Postgres before pulling new images on the droplet.

## Ingress

Public traffic enters through Cloudflare → Traefik on the droplet (ports 80/443). Traefik:

- terminates Let's Encrypt TLS for `capsulezero.app` and `grafana.capsulezero.app`,
- runs a rate-limit middleware per IP,
- runs a forward-auth middleware against Kratos for protected routes,
- routes `/` to `web`,
- routes `/api/*` to `api`,
- routes `/self-service/*` and `/sessions/*` to `kratos` (public API),
- routes `grafana.capsulezero.app` to `grafana`.

Cloudflare proxy provides edge TLS, DDoS protection, Bot Fight Mode, and CDN. Postgres, Redis, and Kratos admin APIs stay internal to the compose network; no host port is exposed.

## Operational Constraints

- Single droplet, single Docker daemon; no Kubernetes, no Docker Swarm in v0.1.
- All secrets live in the droplet's encrypted `.env` and provider dashboards; never in repo or chat.
- syslog files are rotated by the host (`/etc/logrotate.d/capsule-zero-syslog`) with 7 day retention; Grafana reads them through Loki only after Stage 2 (until then, the syslog file is the primary log surface).
- Sentry and Prometheus are deferred to Stage 2.
