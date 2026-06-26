# Docker Compose Deployment

Capsule Zero can build and run the web app as a production Next.js standalone
container with Docker Compose. The same image and Compose file are used for
staging and production; environment files decide the domain, provider mode, and
secret values.

This runtime is for the web application container. It does not self-host
Supabase, object storage, OAuth providers, Lava.top, or image-processing
providers.

## Files

| File | Purpose |
| --- | --- |
| `app/Dockerfile` | Builds the Next.js standalone production image. |
| `docker-compose.yml` | Runs the web image with restart policy, port binding, and healthcheck. |
| `deploy/compose.env.example` | Template for Compose interpolation values; copy to `.env` on the VM. |
| `deploy/stage.env.example` | Staging runtime env template; copy to `deploy/runtime.env` on staging. |
| `deploy/prod.env.example` | Production runtime env template; copy to `deploy/runtime.env` on production. |

## One-Command Runtime

On each VM, prepare env files once:

```bash
cp deploy/compose.env.example .env
cp deploy/stage.env.example deploy/runtime.env
```

For production, copy `deploy/prod.env.example` instead:

```bash
cp deploy/prod.env.example deploy/runtime.env
```

Fill real values in `.env` and `deploy/runtime.env`, then start or update the
service:

```bash
docker compose up -d --build
```

Older Docker Compose installations may use:

```bash
docker-compose up -d --build
```

The service binds to `127.0.0.1:3000` by default so a host-level reverse proxy
or load balancer can terminate TLS and forward to the container. Change
`CAPSULE_HOST_BIND` and `CAPSULE_HOST_PORT` in `.env` if the VM should expose
the container directly.

## Image Reuse

The default flow builds locally on the VM. To use a registry-hosted image,
publish the same `app/Dockerfile` target and set `CAPSULE_WEB_IMAGE` in `.env`:

```bash
CAPSULE_WEB_IMAGE=ghcr.io/<owner>/capsule-zero-web:<sha>
```

Then run:

```bash
docker compose pull
docker compose up -d
```

## Healthcheck

Compose checks:

```text
GET /api/health
```

The endpoint reports the active provider mode and provider health. In the
current Stage 1 posture, `CAPSULE_PROVIDER_MODE=mock` is the only mode that can
run successfully on `main`; `supabase` remains an integration gate until the
real provider implementation and evidence are merged.

## Production Boundaries

Before using this as a real production deployment:

- put TLS, compression, and public ingress in Caddy, Nginx, a DigitalOcean Load
  Balancer, or an equivalent edge layer;
- keep real secrets only in VM env files or provider dashboards, never in git;
- configure log retention and host metrics outside the container;
- configure backups in the canonical data provider, not in the web container;
- replace placeholder Supabase, Lava.top, Photoroom, and remove.bg values only
  after each integration gate is approved;
- keep `CAPSULE_PROVIDER_MODE=mock` for screenshot/staging review deployments
  until the Supabase provider path is actually available on `main`.
