# nginx Reverse Proxy — Operator Runbook

> Phase 1 of `.specify/specs/024-production-stack-runtime/` ships the minimum
> stack that can serve the existing Next.js landing on
> `https://capsulezero.app` behind nginx with a Let's Encrypt certificate.
> Everything else (Postgres, Kratos, Go API, worker, Spaces/imgproxy, Grafana)
> arrives in later iterations.

## Why nginx

We chose nginx 1.27 as the production reverse proxy after considering Caddy
(currently on the droplet) and Traefik (initial Phase 4 ADR-001 choice). The
deciding factors:

- **Universally understood.** Any ops engineer can read the config; no
  Docker-label DSL or JSON-encoded ACME state.
- **Predictable surface.** TLS, gzip, rate-limit, websockets, `auth_request`,
  and reverse_proxy are all first-class with stable directives. We will need
  `auth_request` against Kratos in a later iteration.
- **Smallest moving piece.** nginx-alpine is a ~50 MB image; the config is a
  pair of files we own. No daemon labels, no Docker-socket access.

Caddy is fine for one-line reverse proxy duty, but it stores certs in a
JSON-encoded internal format that is harder to share with other tooling.
Traefik shines when you have many services discovered through labels, but in
v0.1 the routing rules fit two files and we do not want a docker.sock mount on
the edge container.

## Topology

```
Cloudflare (later)
    │
    ▼  TCP/443
DigitalOcean droplet
    │  host ports 80/443
    ▼
docker compose stack (network: internal)
    ├── nginx (TLS + reverse_proxy → web:3000 via Docker DNS)
    └── web   (Next.js, listens on :3000 inside the network)
```

TLS material lives on the host at `/etc/letsencrypt/live/capsulezero.app/`
and is mounted read-only into the nginx container. Renewal is driven by
`certbot.timer` on the host, which writes to `/var/www/certbot/` (mounted
read-only into nginx for ACME http-01 challenges) and reloads nginx through a
post-deploy hook.

The nginx config serves `/.well-known/acme-challenge/` before app proxying on
both HTTP and HTTPS. This keeps HTTP-01 renewals valid even if an upstream
Cloudflare rule redirects the original HTTP challenge request to HTTPS.

The app upstream is resolved through Docker's embedded DNS (`127.0.0.11`) with
a short TTL instead of a static nginx upstream block. That lets
`docker compose up -d --build web` replace the `web` container without leaving
nginx pinned to the old container IP.

## First-time bootstrap (one-shot)

Run on the droplet as root.

1. **Stop and disable the old Caddy service.** It owns ports 80/443 today.
   ```bash
   systemctl stop caddy
   systemctl disable caddy
   ```
2. **Install certbot.**
   ```bash
   apt-get update
   apt-get install -y certbot
   ```
3. **Issue the certificate via the standalone challenge.** Ports 80/443 are
   free because Caddy is stopped and the compose stack is not up yet.
   ```bash
   certbot certonly --standalone \
     --non-interactive --agree-tos \
     -m admin@capsulezero.app \
     -d capsulezero.app
   ```
   The cert lands at `/etc/letsencrypt/live/capsulezero.app/{fullchain,privkey}.pem`.
4. **Make sure the webroot path exists** for future webroot-mode renewals:
   ```bash
   install -d -m 755 -o root -g root /var/www/certbot
   ```
5. **Pull the latest repo and start the stack.**
   ```bash
   cd /opt/capsule-zero
   git fetch --all --prune
   git reset --hard origin/main
   docker compose down --remove-orphans
   docker compose up -d --build
   ```
6. **Smoke-check from the droplet.**
   ```bash
   docker compose ps
   curl -fsS http://127.0.0.1/nginx-health
   # expected: ok
   curl -fsS -o /dev/null -w '%{http_code}\n' https://capsulezero.app/en
   # expected: 200
   ```
7. **Smoke-check from anywhere else.**
   ```bash
   curl -fsSI https://capsulezero.app/en | head -5
   ```
   The response should show `HTTP/2 200`, `server: nginx`, and the
   `set-cookie: NEXT_LOCALE=en` header from next-intl.

## Renewal

`certbot.timer` (installed by the `certbot` apt package) runs twice a day and
is fine to leave as the default. We only have to tell it how to reload nginx
after a successful renew.

Create `/etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh`:

```bash
#!/bin/sh
set -eu
docker compose --project-directory /opt/capsule-zero exec -T nginx nginx -s reload
```

`chmod +x` it. The next renewal will reload nginx in-place, no downtime.

Switch certbot to webroot mode for renewals so public traffic can keep flowing
through nginx — edit `/etc/letsencrypt/renewal/capsulezero.app.conf` and set:

```
authenticator = webroot
webroot_path = /var/www/certbot
```

(The first issuance ran in `--standalone` mode because nginx was not up yet.
Renewals do not need that anymore.)

Verify with a dry run:

```bash
certbot renew --dry-run
```

## Migrating from the existing Caddy deploy

The droplet currently runs `caddy.service` on the host fronting a
`capsule-zero-web-only-web-1` container. Migration sequence:

1. SSH into the droplet, become root.
2. `docker compose -f /opt/capsule-zero/docker-compose.legacy-supabase.yml down --remove-orphans` (kills the legacy web-only container).
3. Follow the bootstrap above starting at step 1.

Rollback in case Phase 1 misbehaves before traffic ever arrives:

1. `docker compose down --remove-orphans` in `/opt/capsule-zero`.
2. `systemctl enable --now caddy` to bring the old reverse proxy back.
3. `docker compose -f docker-compose.legacy-supabase.yml up -d web` to bring the legacy container back on `127.0.0.1:3000`.

This rollback is acceptable today because there is no real user traffic yet.
Once we have traffic, rollback becomes a Cloudflare maintenance page and an
incident review.

## Local development

The compose stack assumes a real Let's Encrypt cert; it is not designed for
laptop use. Local web work continues to use the existing flow:

```bash
cd app
npm run dev
```

A local compose dev override will come back in a later PR when there is a
service worth running locally next to the Next.js bundle (Postgres, Kratos,
or the Go API).

## What is intentionally not here yet

- Cloudflare proxy and `real_ip_from` directives — we plug those in when the
  DNS cuts over to Cloudflare nameservers.
- nginx `auth_request` middleware against Kratos — arrives with the Kratos
  PR.
- Rate-limit middleware — arrives once the Go API is in front of nginx.
- HTTP/3 / QUIC — nginx-alpine does not ship the QUIC build; Cloudflare gives
  us HTTP/3 at the edge once the proxy is on.
- Backups — there is no Postgres yet, so the `pg_dump` cron is deferred to
  the Postgres PR.
