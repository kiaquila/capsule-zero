# Docker Compose Deployment

Capsule Zero now ships a production-shaped Docker Compose runtime: the Next.js
web app runs against self-hosted Supabase core services instead of fixture
mocks. Compose is the single local/stage/prod process supervisor; VM-level TLS,
firewalling, backups, and secret delivery remain outside git.

## Topology

| Service | Purpose | Default host exposure |
| --- | --- | --- |
| `web` | Next.js standalone app, `CAPSULE_PROVIDER_MODE=supabase` | `127.0.0.1:3000` |
| `kong` | Supabase API gateway for Auth, REST, Storage, Realtime, Functions | `127.0.0.1:8000`, `127.0.0.1:8443` |
| `db` | Supabase PostgreSQL 17 with pgvector and Capsule Zero migrations | internal only |
| `auth` | Supabase Auth / GoTrue | via Kong |
| `rest` | PostgREST over `public,storage,graphql_public` | via Kong |
| `storage` | Supabase Storage file backend | via Kong |
| `imgproxy` | Storage image transformation backend | internal only |
| `realtime` | Supabase Realtime tenant `realtime-dev` | via Kong |
| `meta` | Postgres metadata service for Studio | internal only |
| `studio` | Supabase Studio admin UI | `127.0.0.1:3001` |
| `supavisor` | Postgres pooler | `127.0.0.1:54329`, `127.0.0.1:6543` |
| `functions` | Supabase Edge Runtime shell for future functions | via Kong |
| `migrate` | One-shot Capsule Zero SQL migration runner | none |

Persistent data lives in named Docker volumes:

- `capsule-zero_supabase-db-data`
- `capsule-zero_supabase-db-config`
- `capsule-zero_supabase-storage`
- `capsule-zero_deno-cache`

## Files

| File | Purpose |
| --- | --- |
| `app/Dockerfile` | Builds the Next.js standalone production image. |
| `docker-compose.yml` | Runs web plus Supabase core services, volumes, dependencies, healthchecks. |
| `deploy/compose.env.example` | Compose interpolation template; copy to `.env` and rotate secrets. |
| `deploy/runtime.env` | Non-secret local runtime defaults for the web container. |
| `deploy/stage.env.example` | Staging web runtime template. |
| `deploy/prod.env.example` | Production web runtime template. |
| `deploy/supabase/` | Upstream Supabase self-host config files and migration runner used by Compose. |
| `supabase/migrations/` | Capsule Zero schema, storage buckets/RLS, provider runtime alignment. |

## First Start

Prepare env files:

```bash
cp deploy/compose.env.example .env
cp deploy/stage.env.example deploy/runtime.env
```

For production, use:

```bash
cp deploy/prod.env.example deploy/runtime.env
```

Before starting any shared environment, rotate all values in `.env` marked as
secret: `POSTGRES_PASSWORD`, `JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY`,
`DASHBOARD_PASSWORD`, `SECRET_KEY_BASE`, `VAULT_ENC_KEY`,
`PG_META_CRYPTO_KEY`, S3 protocol keys, SMTP credentials, and external provider
keys.

Start or deploy the stack:

```bash
docker compose up -d --build --wait db auth rest storage realtime functions kong imgproxy meta studio supavisor
docker compose up --force-recreate --no-deps migrate
docker compose up -d --build web
```

For a local port override:

```bash
CAPSULE_HOST_PORT=3100 docker compose up -d --build --wait db auth rest storage realtime functions kong imgproxy meta studio supavisor
CAPSULE_HOST_PORT=3100 docker compose up --force-recreate --no-deps migrate
CAPSULE_HOST_PORT=3100 docker compose up -d --build web
```

Always recreate the canonical `migrate` service before starting `web` on any
deploy that may include SQL changes. A plain `docker compose up -d --build` can
reuse an already-exited `migrate` container when only files under
`supabase/migrations/` changed, which lets `web` start against a database that
has not applied the new migration yet.

## Health Checks

Primary app health:

```bash
curl -fsS http://127.0.0.1:3000/api/health
```

Supabase gateway checks:

```bash
curl -fsS http://127.0.0.1:8000/auth/v1/health
curl -fsS http://127.0.0.1:8000/storage/v1/status
```

Expected app health uses:

- `providerMode: "supabase"`
- `providerHealth.integrations.supabase: "configured"`
- `providerHealth.integrations.storage: "configured"`

`backgroundRemoval`, `marketplaceImport`, and `lavaTop` stay `pending-gate`
until real Photoroom, marketplace import, and Lava.top credentials are supplied.
They are no longer mocked inside the app runtime.

## Migrations

The first database initialization mounts official Supabase init scripts from
`deploy/supabase/db/`. Capsule Zero migrations run separately in the one-shot
`migrate` service after Auth, PostgREST, and Storage are healthy. This keeps app
schema changes after Supabase has created `auth` and `storage` internals.

The migration runner records applied files in:

```text
capsule_zero_internal.schema_migrations
```

The tracking table lives outside the PostgREST-exposed `public` schema. On
stacks that already created the earlier public tracking table, the runner copies
its rows into `capsule_zero_internal.schema_migrations` and drops the public
table before applying pending migrations.

Do not delete or reorder existing migration files after a volume has been
initialized. For schema changes, add a new timestamped or numbered SQL file.

Apply pending migrations explicitly during every deploy:

```bash
docker compose up -d --wait db auth rest storage
docker compose up --force-recreate --no-deps migrate
docker compose up -d --build web
```

This keeps the `web` dependency on `migrate: service_completed_successfully`
meaningful for the current release instead of relying on a previously completed
one-shot container.

For a destructive local reset only:

```bash
docker compose down -v
docker compose up -d --build --wait db auth rest storage realtime functions kong imgproxy meta studio supavisor
docker compose up --force-recreate --no-deps migrate
docker compose up -d --build web
```

Never use `down -v` on staging or production unless a restore plan has already
been tested.

## Backups

Production backups must cover both database and object storage.

Database backup:

```bash
docker compose exec db pg_dump -U postgres -d postgres --format=custom > capsule-zero.dump
```

Storage backup:

```bash
docker run --rm \
  -v capsule-zero_supabase-storage:/storage:ro \
  -v "$PWD/backups:/backup" \
  alpine tar czf /backup/capsule-zero-storage.tgz -C /storage .
```

Restore into an empty stack by restoring Postgres first, then the storage
volume, then starting `web`.

## Upgrades

1. Read upstream Supabase self-host release notes before changing image tags.
2. Update `docker-compose.yml` image tags and refreshed files under
   `deploy/supabase/` together.
3. Validate config:

```bash
docker compose --env-file deploy/compose.env.example config
```

4. Run local smoke checks against a fresh volume set.
5. Back up staging/production before pulling new images.

## Ingress

Compose binds public-facing ports to localhost by default. Put Caddy, Nginx,
a load balancer, or another TLS layer in front of:

- web app: `http://127.0.0.1:3000`
- Supabase API: `http://127.0.0.1:8000`

Keep Studio and Postgres/pooler ports private unless an operator explicitly
opens them through a VPN or bastion.
