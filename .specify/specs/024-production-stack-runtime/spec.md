# Spec 024 — Production Stack Runtime

## Goal

Bring up Capsule Zero's v0.1 production runtime on the production server (a Hetzner CX23 since 2026-07-02, spec 033; originally a DigitalOcean droplet) via docker-compose so that `https://capsulezero.app` serves a healthy stack with every active v0.1 service declared, configured, and health-checked. After the spec ships in full, every subsequent feature slice runs against real Kratos / direct Postgres / Redis / Hetzner Object Storage / Resend from the first PR with no mock-first layer (see ADR-006, ADR-007, and spec 039).

This spec delivers the **runtime** and advances incrementally through stateful
slices. The Go API now ships `GET /api/health`, the auth/profile bounded
contexts, and the spec-040 private-upload foundation; wardrobe attachment,
capsules, catalog search, and the remaining product behavior ship in later
slices (see `docs_capsule_zero/project/backend/backend-stateful-slices-plan.md`).

## Phased delivery

The spec ships in incremental PRs against the same feature folder. Each phase keeps the droplet servable end-to-end; nothing breaks between phases.

| Phase | Scope | Status |
| ----- | ----- | ------ |
| Phase 1 — nginx + web | Replace the host Caddy + legacy Supabase compose with `nginx + web` in `docker-compose.yml`. `https://capsulezero.app/en` keeps serving the existing Next.js landing. | **Shipped** |
| Phase 2 — Auth vertical slice (Postgres + Kratos + Go API auth + `api` provider) | Add `postgres` (plain `postgres:16`) and `kratos` to compose; scaffold the Go `api` with the auth/profile bounded context (`GET /api/health`, Kratos session validation, `profiles` mapping); nginx routes `/api/*`; add the `api` provider mode in `/app` implementing `AuthPort` + `ProfileRepository` against the Go API. Registration/login work end-to-end on the existing `/app` UI. | **Shipped** |
| Phase 3 — Redis + remaining `/api/*` surface | Add `redis` and the Redis queue consumer goroutines inside `api`; widen `/api/*` coverage as the next domain slices land. | Pending |
| Phase 4 — Storage + email + imgproxy | Hetzner Object Storage buckets with CORS for `https://capsulezero.app`. Resend domain verified with SPF + DKIM. `imgproxy` deployed for on-the-fly derivatives. | **Partial** — Resend and the spec-040 default-off storage foundation are complete: buckets, dedicated bucketless runtime/backup key projects, cross-project action policies, exact asset CORS/negative probes, absent backup CORS, protected-env credential rotation, old-key/operator revocation, and the post-revocation signed 10 MiB smoke. `imgproxy` remains. |
| Phase 5 — Observability + backups | syslog rotation, OTLP trace exporter, and nightly encrypted `pg_dump` with Object Lock retention. Grafana remains deferred by ADR-007. | **Partial** — spec 047 activated the root-owned encrypted backup timer after a fixed-header uploader boundary, explicit residual-risk acceptance, retention setup, and a restore drill. syslog/OTLP completion remains. |
| Phase 6 — Supabase provider retirement | `/app` **stays** (it is the real frontend). Once every domain is on the `api` provider, remove the Supabase provider and `@supabase/*`, drop the unused `/web` placeholder, and retire `docker-compose.legacy-supabase.yml` + the Supabase env keys. No `/app` → `/web` rename. | Pending |

Each phase ships as its own PR with feature-memory updates against this folder. The `## Verification` table in `plan.md` records acceptance criteria for each phase separately.

## Scope

### In scope across all phases

- A single root `docker-compose.yml` with every active v0.1 container declared as a separate `services:` block.
- A reverse-proxy / API-gateway tier owned by nginx: host-managed 1.28 on the live edge and a 1.31 container for rollback/local dev (see ADR-001 § "Why nginx and not Traefik or Caddy").
- TLS via Let's Encrypt with certbot on the host. The certificate lives at `/etc/letsencrypt/live/capsulezero.app/` and is mounted read-only into the nginx container.
- Service stubs for our own code:
  - `/api` Go skeleton: `cmd/api/main.go` boots an HTTP server with `GET /api/health` reporting reachability of Postgres, Redis, Kratos, Object Storage, Resend, and starts the v0.1 Redis queue consumer goroutines (Phase 3)
  - `/worker` Go skeleton is deferred until ADR-007 promotes the standalone worker container; the Redis queue contract is still introduced in `/api` during Phase 3
  - The web frontend is the existing `/app` Next.js project (built on the provider port/adapter abstraction); it stays and is served from `/app/Dockerfile`. The unused `/web` placeholder is dropped when the Supabase provider is fully retired. No `/app` → `/web` rename.
  - `/mobile` React Native scaffold (Expo project; ships builds locally; deploy to TestFlight/Google Play remains a Stage 2 follow-up)
- Infrastructure configs under `/infra/`:
  - `infra/nginx/` — nginx 1.31 rollback/local-container config (Phase 1)
  - `infra/kratos/` — identity schema, courier (Resend SMTP) configuration, self-service flow config (Phase 2)
  - `infra/postgres/` — init scripts: provision the Kratos database + role and the app database (Phase 2). pgvector is deferred by ADR-007 to the semantic catalog-search slice.
- `api/migrations/` — SQL migrations applied at boot by the embedded migrator. The auth slice ships `0001_initial_auth.sql` (`profiles`); the wardrobe/capsule/catalog schema plus methodology seed (`color_catalog`, `category_catalog`, `compatibility_rules`) arrive with their domain slices.
- Cloudflare authoritative DNS + proxy on the apex and `www`, Full (strict)
  TLS, DNSSEC, Cloudflare-only origin web ingress, scoped edge rate limiting,
  and default WAF/DDoS controls (activated 2026-07-22 in spec 047). Bot Fight
  Mode stays disabled because it challenged the health monitor.
- Hetzner Object Storage buckets for private uploads, public catalog assets,
  and encrypted backups; bucketless key-only projects for runtime/backup
  credentials with cross-project prefix/action policies; CORS limited to
  `https://capsulezero.app` where browser upload/download flows require it
  (Phase 4)
- Resend account verified for `no-reply@capsulezero.app` with SPF/DKIM published (Phase 4)
- Nightly cron uploading an age-encrypted `pg_dump` to the backup object-storage bucket with a 14 day retention rule (Phase 5)
- syslog rotation plus OpenTelemetry trace exporter wiring (Phase 5); Grafana dashboard provisioning is deferred by ADR-007
- Operator runbook updates per phase. `docs_capsule_zero/project/devops/nginx-reverse-proxy.md` covers Phase 1; `sprint-0-runtime-provisioning.md` and `docker-compose-deploy.md` are updated as services arrive.
- Protected plaintext `.env` installed at `/opt/capsule-zero/.env`, owned by
  `root:root` with mode `600` (kept up to date per phase; filesystem encryption
  is not established)

### Out of scope

- Product features beyond the landed auth/profile and unattached private-upload
  foundations (for example wardrobe attachment, the capsule engine, and catalog
  search — those are later stateful slices)
- **Password recovery and email-verification completion.** The Kratos recovery/verification flows are disabled and the auth UI exposes no recovery affordance in this slice, because there is no flow-aware completion UI (the auth page does not read the Kratos `flow`/`code` params) and no Go settings/verification endpoints yet. Shipping a recovery/verification email that dead-ends on a UI that cannot complete it is worse than deferring; the completion UI + endpoints land in a dedicated follow-up slice. Recovery action/schema/provider/Go-endpoint plumbing is kept dormant for it.
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

| # | Scenario | First testable in |
| - | -------- | ----------------- |
| 1 | **nginx starts before the Let's Encrypt cert exists.** First boot must not crash silently; the runbook's bootstrap step requires `certbot certonly --standalone` to land the cert before `docker compose up`. | Phase 1 |
| 2 | **Web container is unhealthy (Next.js exits or fails its `/en` probe).** nginx must surface a `502 Bad Gateway` page rather than serving a stale 200; `docker compose ps` must show `web` as `(unhealthy)` inside its `start_period`. | Phase 1 |
| 3 | **Postgres unreachable from the Go API.** `GET /api/health` probes Postgres on every request and must return HTTP 503 with `postgres: "error"`, not HTTP 200 from the five-second cache used only for the external Object Storage probe. | Phase 2 |
| 4 | **Resend rejects an email send.** Kratos verification flow must surface a safe inline error on the web UI; the API must log the failure to syslog with a correlation id; no half-created identity is left orphaned. | Phase 4 |
| 5 | **Object Storage credentials invalid or bucket misconfigured CORS.** The API health probe reports `storage: "error"`, init returns no URL when storage is unavailable, and allowed/disallowed production origins are verified by preflight. Frontend error UI is deferred because spec 040 deliberately has no web wiring. | Phase 4 |
| 6 | **`docker compose up` on a droplet that already has data volumes.** Migrations must be idempotent — the embedded SQL migrator must not double-apply, Kratos migrations must respect their tracking table. A repeated `docker compose up -d` on a healthy stack must be a no-op. | Phase 2 |

## Constraints

- Production server ≥ 2 vCPU / 4 GB RAM (current: Hetzner CX23 — 2 vCPU / 4 GB / 40 GB, Ubuntu 26.04; superseded the DigitalOcean droplet requirement 2026-07-02, spec 033). The runtime fails closed if memory pressure drives any service into OOM during the first-start smoke.
- DNS: Spaceship delegates to Cloudflare; proxied apex + `www` records reach the
  Cloudflare-only origin firewall and host nginx. The application front-door
  CDN is active, while public catalog assets continue to use native Hetzner
  Object Storage object URLs until a separate catalog-CDN slice.
- All secrets live only in protected plaintext `/opt/capsule-zero/.env`
  (`root:root`, mode `600`) and provider dashboards. Filesystem encryption is
  not established. Never in git, never in chat with agents.
- Every deployed v0.1 container in `docker-compose.yml` is its own `services:` block. The one explicit exception is the Redis queue consumer, which runs as goroutines inside `api` until ADR-007 promotes the standalone worker.
- syslog files rotate daily with 7 day retention (Phase 5).
- Backups are not optional: the nightly `pg_dump` cron lands in Phase 5, not in a follow-up.
- Compose scaffolds must validate on a clean checkout before secrets are present: the droplet `.env` / `--env-file` is used for Compose interpolation, while each service receives only an explicit runtime `environment:` allowlist. Backend secrets must not be imported wholesale into the web container.
- Dev-only dashboards and inspection UIs bind to `127.0.0.1` unless explicitly placed behind nginx auth.
- TLS material is managed by the host `certbot` apt package; nginx mounts `/etc/letsencrypt` read-only and reloads via the certbot deploy hook.

## Out-of-Spec Follow-Ups

- Configure linting and local commit hooks if not already in place before the first product-code PR after Phase 3 lands.
- Stage 2: Google / Apple OAuth provider configuration in Kratos; Lava.top live integration; self-hosted image-processing model; Sentry and Prometheus introduction.
