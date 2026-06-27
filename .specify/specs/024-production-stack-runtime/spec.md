# Spec 022 — Production Stack Runtime

## Goal

Bring up the full Capsule Zero production stack on the DigitalOcean droplet via docker-compose so that `https://capsulezero.app` serves a healthy stack with every service declared, configured, and health-checked. After this spec ships, every subsequent feature slice can run against real Kratos / Postgres / Redis / DigitalOcean Spaces / Resend from the first PR with no mock-first layer (see ADR-006).

This spec delivers the **runtime**. It does not implement product features — the Go API ships with `GET /api/health` and the auth/profile bounded contexts wired only enough for the health probe and a smoke sign-up. Product features ship in spec 023 onwards (see `docs_capsule_zero/project/backend/backend-stateful-slices-plan.md`).

## Scope

### In scope

- `docker-compose.yml` (root) declaring every service as a separate `services:` entry:
  - `traefik`, `kratos`, `postgres` (with pgvector), `pgbouncer`, `redis`, `api`, `worker`, `web`, `imgproxy`, `grafana`
- `docker-compose.dev.yml` with overrides: MailHog instead of Resend SMTP, hot-reload for `api` and `worker`, debug logging, MailHog UI bound to `127.0.0.1:8025`
- Service stubs for our own code:
  - `/api` Go skeleton: `cmd/api/main.go` boots an HTTP server with `GET /api/health` reporting reachability of Postgres, Redis, Kratos, Spaces, Resend
  - `/worker` Go skeleton: `cmd/worker/main.go` boots a Redis-queue consumer that idles cleanly
  - `/web` Next.js skeleton in the new `/web` directory: serves the landing page from `html-prototypes/index.html` content with Next.js routing
  - `/mobile` React Native scaffold (Expo project; ships builds locally; deploy to TestFlight/Google Play remains a Stage 2 follow-up)
- Infrastructure configs:
  - `infra/traefik/` — static + dynamic config with Let's Encrypt for `capsulezero.app` and `grafana.capsulezero.app`, rate-limit middleware, forward-auth middleware against Kratos
  - `infra/kratos/` — identity schema, courier (Resend SMTP) configuration, self-service flow config
  - `infra/postgres/` — init scripts: enable `pgvector`, create the Kratos database, create app and Kratos roles
- `api/migrations/0001_initial_schema.sql` shipping the full schema from `docs_capsule_zero/project/backend/backend-docs.md` plus methodology seed (`color_catalog`, `category_catalog`, `compatibility_rules`)
- Cloudflare configuration walkthrough in the runtime spec (DNS, proxy on, SSL/TLS Full strict, Bot Fight Mode)
- DigitalOcean Spaces bucket `capsulezero` with CORS for `https://capsulezero.app` and the dev origin
- Resend account verified for `no-reply@capsulezero.app` with SPF/DKIM published
- Nightly cron uploading `pg_dump` to `backups/` prefix in Spaces with a 14 day lifecycle rule
- Grafana dashboard provisioning for syslog files and the OpenTelemetry trace exporter
- Operator runbook update: `docs_capsule_zero/project/devops/sprint-0-runtime-provisioning.md` and `docker-compose-deploy.md` already rewritten in the documentation pivot PR; this spec verifies them end-to-end on the droplet
- Encrypted `.env` file shipped via the operator's machine to `/srv/capsule-zero/.env` with mode `600`

### Out of scope

- Product features beyond `/api/health` and a smoke sign-up that exercises Kratos email verification through Resend (e.g. the wardrobe domain, capsule engine, catalog search — those are spec 023+)
- Lava.top live integration (v0.2 — Lava.top remains stubbed)
- Self-hosted Capsule Zero image-processing model (Stage 2)
- Google OAuth and Apple Sign-In (Stage 2)
- Sentry and Prometheus (Stage 2)
- Kubernetes / multi-droplet topology (deferred until objective scale demands it)
- Removing the legacy `/app` Supabase shell — that lands in a follow-up PR after this spec is green
- ES-AR locale activation (v0.2)

## Negative Scenarios

The runtime must survive the following without silently degrading. Each is covered by an explicit test, smoke script, or runbook check in `plan.md`.

1. **Postgres unreachable from the Go API.** `GET /api/health` must return HTTP 503 with `postgres: "error"`, not HTTP 200 with stale cached data. Traefik must not serve cached 200 from a previous probe.
2. **Resend rejects an email send.** Kratos verification flow must surface a safe inline error on the web UI; the API must log the failure to syslog with a correlation id; no half-created identity is left orphaned.
3. **Spaces credentials invalid or bucket misconfigured CORS.** Signed PUT round-trip must fail closed; the API health probe must report `storage: "error"`; the web upload UI must show a safe inline error.
4. **Cloudflare proxy off while Traefik is still negotiating Let's Encrypt.** The DNS-01 / HTTP-01 challenge must complete; Traefik must not fall into a serve-without-TLS loop. (Mitigation: pause Cloudflare proxy while issuing certs the first time, then re-enable.)
5. **`docker compose up` on a droplet that already has data volumes.** Migrations must be idempotent — golang-migrate must not double-apply, Kratos migrations must respect their tracking table. A repeated `docker compose up -d` on a healthy stack must be a no-op.

## Constraints

- DigitalOcean droplet ≥ 4 GB RAM / 2 vCPU / 80 GB disk. The runtime fails closed if memory pressure drives any service into OOM during the first-start smoke.
- Spaceship registrar → Cloudflare nameservers → Cloudflare proxy → Traefik on the droplet. No third-party CDN beyond the Cloudflare proxy and the DigitalOcean Spaces CDN for catalog images.
- All secrets live only in the droplet's encrypted `.env` and provider dashboards. Never in git, never in chat with agents.
- Every service in `docker-compose.yml` is its own `services:` block. No consolidating multiple processes into one image.
- syslog files rotate daily with 7 day retention.
- Backups are not optional: the nightly `pg_dump` cron lands in this spec, not in a follow-up.

## Out-of-Spec Follow-Ups

- Delete the legacy `/app` directory in a follow-up PR after this spec is green.
- Move `app/src/styles/tokens.css` to `web/src/styles/tokens.css` in the legacy-removal PR.
- Configure linting and local commit hooks if not already in place before the first product-code PR (spec 023).
- Stage 2: Google / Apple OAuth provider configuration in Kratos; Lava.top live integration; self-hosted image-processing model; Sentry and Prometheus introduction.
