# Spec 024 — Production Stack Runtime

## Goal

Bring up Capsule Zero's v0.1 production runtime on the DigitalOcean droplet via docker-compose so that `https://capsulezero.app` serves a healthy stack with every active v0.1 service declared, configured, and health-checked. After the spec ships in full, every subsequent feature slice runs against real Kratos / direct Postgres / Redis / DigitalOcean Spaces / Resend from the first PR with no mock-first layer (see ADR-006 and ADR-007).

This spec delivers the **runtime**. It does not implement product features beyond what is required to prove that each service is wired correctly — the Go API ships with `GET /api/health` and the auth/profile bounded contexts wired only enough for the health probe and a smoke sign-up. Product features ship in later stateful slices (see `docs_capsule_zero/project/backend/backend-stateful-slices-plan.md`).

## Phased delivery

The spec ships in incremental PRs against the same feature folder. Each phase keeps the droplet servable end-to-end; nothing breaks between phases.

| Phase                                        | Scope                                                                                                                                                                 | Status          |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| Phase 1 — nginx + web                        | Replace the host Caddy + legacy Supabase compose with `nginx + web` in `docker-compose.yml`. `https://capsulezero.app/en` keeps serving the existing Next.js landing. | **In progress** |
| Phase 2 — Postgres + Kratos                  | Add plain `postgres:16` and `kratos` to compose. nginx `auth_request` middleware against Kratos. Wire Kratos self-service flows for sign-up/sign-in.                  | Pending         |
| Phase 3 — Go API + Redis + in-process worker | Add `redis` and `api` (Go modular monolith with `GET /api/health` plus Redis queue consumer goroutines). nginx routes `/api/*` to the Go API.                         | Pending         |
| Phase 4 — Storage + email + imgproxy         | DigitalOcean Spaces bucket with CORS for `https://capsulezero.app`. Resend domain verified with SPF + DKIM. `imgproxy` deployed for on-the-fly derivatives.           | Pending         |
| Phase 5 — Observability + backups            | syslog rotation, OTLP trace exporter, and nightly `pg_dump` cron with 14-day Spaces lifecycle. Grafana remains deferred by ADR-007.                                   | Pending         |
| Phase 6 — Supabase provider retirement       | Remove the retired Supabase provider/env surface domain by domain once the Go API owns the matching contexts. `/app` remains the canonical web frontend.              | Pending         |

Each phase ships as its own PR with feature-memory updates against this folder. The `## Verification` table in `plan.md` records acceptance criteria for each phase separately.

## Scope

### In scope across all phases

- A single root `docker-compose.yml` with every active v0.1 container declared as a separate `services:` block.
- A reverse-proxy / API-gateway tier owned by nginx 1.27 (see ADR-001 § "Why nginx and not Traefik or Caddy").
- TLS via Let's Encrypt with certbot on the host. The certificate lives at `/etc/letsencrypt/live/capsulezero.app/` and is mounted read-only into the nginx container.
- Service stubs for our own code:
  - `/api` Go skeleton: `cmd/api/main.go` boots an HTTP server with `GET /api/health` reporting reachability of Postgres, Redis, Kratos, Spaces, Resend, and starts the v0.1 Redis queue consumer goroutines (Phase 3)
  - `/worker` Go skeleton is deferred until ADR-007 promotes the standalone worker container; the Redis queue contract is still introduced in `/api` during Phase 3
  - `/app` Next.js frontend — canonical, provider-abstracted web surface; the retired Supabase provider is removed domain by domain as Go API contexts land
  - `/mobile` React Native scaffold (Expo project; ships builds locally; deploy to TestFlight/Google Play remains a Stage 2 follow-up)
- Infrastructure configs under `/infra/`:
  - `infra/nginx/` — nginx 1.27 config (Phase 1)
  - `infra/kratos/` — identity schema, courier (Resend SMTP) configuration, self-service flow config (Phase 2)
  - `infra/postgres/` — init scripts: create the Kratos database and create app and Kratos roles; pgvector remains deferred by ADR-007 (Phase 2)
- `api/migrations/0001_initial_schema.sql` shipping the full schema from `docs_capsule_zero/project/backend/backend-docs.md` plus methodology seed (`color_catalog`, `category_catalog`, `compatibility_rules`) (Phase 3)
- Cloudflare configuration walkthrough in the runtime spec (DNS, proxy on, SSL/TLS Full strict, Bot Fight Mode) — applied when DNS migration happens (Phase 4 or earlier as separate config work)
- DigitalOcean Spaces bucket `capsulezero` with CORS for `https://capsulezero.app` and the dev origin (Phase 4)
- Resend account verified for `no-reply@capsulezero.app` with SPF/DKIM published (Phase 4)
- Nightly cron uploading `pg_dump` to `backups/` prefix in Spaces with a 14 day lifecycle rule (Phase 5)
- syslog rotation plus OpenTelemetry trace exporter wiring (Phase 5); Grafana dashboard provisioning is deferred by ADR-007
- Operator runbook updates per phase. `docs_capsule_zero/project/devops/nginx-reverse-proxy.md` covers Phase 1; `sprint-0-runtime-provisioning.md` and `docker-compose-deploy.md` are updated as services arrive.
- Encrypted `.env` file shipped via the operator's machine to `/opt/capsule-zero/.env` with mode `600` (kept up to date per phase)

### Out of scope

- Product features beyond `/api/health` and a smoke sign-up that exercises Kratos email verification through Resend (e.g. the wardrobe domain, capsule engine, catalog search — those are later stateful slices)
- Lava.top live integration (v0.2 — Lava.top remains stubbed)
- Self-hosted Capsule Zero image-processing model (Stage 2)
- Google OAuth and Apple Sign-In (Stage 2)
- Sentry and Prometheus (Stage 2)
- pgvector, PgBouncer, a standalone `worker` container, and Grafana dashboards until ADR-007 promotion triggers fire
- Kubernetes / multi-droplet topology (deferred until objective scale demands it)
- HTTP/3 at the origin (Cloudflare provides HTTP/3 at the edge once the proxy is on)
- ES-AR locale activation (v0.2)

## Negative Scenarios

The runtime must survive the following without silently degrading. Each is covered by an explicit test, smoke script, or runbook check in `plan.md`. Some scenarios only become testable after a given phase ships — the phase column lists when each one is checkable.

| #   | Scenario                                                                                                                                                                                                                                                                | First testable in |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| 1   | **nginx starts before the Let's Encrypt cert exists.** First boot must not crash silently; the runbook's bootstrap step requires `certbot certonly --standalone` to land the cert before `docker compose up`.                                                           | Phase 1           |
| 2   | **Web container is unhealthy (Next.js exits or fails its `/en` probe).** nginx must surface a `502 Bad Gateway` page rather than serving a stale 200; `docker compose ps` must show `web` as `(unhealthy)` inside its `start_period`.                                   | Phase 1           |
| 3   | **Postgres unreachable from the Go API.** `GET /api/health` must return HTTP 503 with `postgres: "error"`, not HTTP 200 with stale cached data.                                                                                                                         | Phase 3           |
| 4   | **Resend rejects an email send.** Kratos verification flow must surface a safe inline error on the web UI; the API must log the failure to syslog with a correlation id; no half-created identity is left orphaned.                                                     | Phase 4           |
| 5   | **Spaces credentials invalid or bucket misconfigured CORS.** Signed PUT round-trip must fail closed; the API health probe must report `storage: "error"`; the web upload UI must show a safe inline error.                                                              | Phase 4           |
| 6   | **`docker compose up` on a droplet that already has data volumes.** API-managed SQL migrations must be idempotent and must not double-apply; Kratos migrations must respect their tracking table. A repeated `docker compose up -d` on a healthy stack must be a no-op. | Phase 3           |

## Constraints

- DigitalOcean droplet ≥ 4 GB RAM / 2 vCPU / 80 GB disk. The runtime fails closed if memory pressure drives any service into OOM during the first-start smoke.
- Spaceship registrar → Cloudflare nameservers → Cloudflare proxy → nginx on the droplet. No third-party CDN beyond the Cloudflare proxy and the DigitalOcean Spaces CDN for catalog images. Cloudflare cut-over may land in any phase before Phase 4 because it is an organisational gate independent of compose service rollout.
- All secrets live only in the droplet's encrypted `.env` and provider dashboards. Never in git, never in chat with agents.
- Every deployed v0.1 container in `docker-compose.yml` is its own `services:` block. The one explicit exception is the Redis queue consumer, which runs as goroutines inside `api` until ADR-007 promotes the standalone worker.
- syslog files rotate daily with 7 day retention (Phase 5).
- Backups are not optional: the nightly `pg_dump` cron lands in Phase 5, not in a follow-up.
- Compose scaffolds must validate on a clean checkout before secrets are present: service-level `./.env` references use optional `env_file` entries, while real production secrets still come from the droplet `.env` during deploy.
- Dev-only dashboards and inspection UIs bind to `127.0.0.1` unless explicitly placed behind nginx auth.
- TLS material is managed by the host `certbot` apt package; nginx mounts `/etc/letsencrypt` read-only and reloads via the certbot deploy hook.

## Out-of-Spec Follow-Ups

- Retire the Supabase provider/env surface from `/app` domain by domain as Go API contexts land. Do not introduce a `/web` frontend.
- Configure linting and local commit hooks if not already in place before the first product-code PR after Phase 3 lands.
- Stage 2: Google / Apple OAuth provider configuration in Kratos; Lava.top live integration; self-hosted image-processing model; Sentry and Prometheus introduction.
