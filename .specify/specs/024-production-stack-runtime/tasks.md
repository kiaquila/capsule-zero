# Tasks 024 — Production Stack Runtime

## Tasks

> Track granular work here as it lands. Each task should resolve to a concrete commit or PR. Phase headers match `plan.md`.

### Phase 1 — nginx + web (current PR)

- [x] Write `infra/nginx/nginx.conf` (main config: events, http, gzip, log format, websocket upgrade map)
- [x] Write `infra/nginx/conf.d/capsulezero.conf` (server :80 with ACME + redirect; server :443 with TLS + ACME + reverse_proxy to `web:3000`)
- [x] Replace top-level `docker-compose.yml` scaffold with `nginx + web` minimal stack
- [x] Remove `docker-compose.dev.yml` (no Phase 1 need; comes back with Postgres/Kratos in Phase 2)
- [x] Slim `deploy/compose.env.example` to Phase 1 contract + documented legacy `/app` Supabase placeholders
- [x] Add `docs_capsule_zero/project/devops/nginx-reverse-proxy.md` (bootstrap, renewal, migration, rollback)
- [x] Update ADR-001 (API-gateway row Traefik → nginx; new "Why nginx and not Traefik or Caddy" section)
- [x] Update Phase 4 council DI-017 (Traefik → nginx revision)
- [x] Update CLAUDE.md, AGENTS.md, constitution.md tech-stack rows
- [x] Update spec.md, plan.md, this tasks.md for the phased delivery model
- [ ] First droplet rollout: stop Caddy, `certbot certonly --standalone`, `docker compose up -d`, smoke `curl https://capsulezero.app/en` (operator-driven; evidence lands on PR after the rollout)

### Phase 2 — Auth vertical slice (working registration/login)

One slice to a **working** end-to-end auth flow on the existing `/app` UI (which is already provider-abstracted). Delivered and verified end-to-end (acceptance 9a–9d, 11–13).

- [x] Add `postgres` (plain `postgres:16`, pgvector deferred by ADR-007) with healthcheck + persistent `pgdata` volume, loopback-bound; PgBouncer deferred by ADR-007
- [x] Add `infra/postgres/00-kratos-db.sh` (provision `kratos` role + database + app DB in one first-init pass)
- [x] Add Postgres/Kratos-DB env keys to `deploy/compose.env.example`; refresh `infra/README.md` to the real nginx + postgres layout
- [x] Add `kratos` service (`oryd/kratos`) + one-shot `kratos-migrate`, attaching to the prepared `kratos` DB
- [x] Add `infra/kratos/` identity schema (`traits.email`, `traits.name.first`, `traits.locale`) + self-service flows; Resend SMTP courier (prod placeholder), MailHog in dev
- [x] Reintroduce `docker-compose.dev.yml` with the MailHog override for the Kratos courier
- [x] Scaffold the Go `api` auth/profile context: `GET /api/health`, Kratos session validation, `profiles` table + `kratos_identity_id → profiles.id` mapping, profile/session endpoints; embedded SQL migrations at boot
- [x] nginx routes `/api/*` to the Go API in both edge paths: Docker nginx → `api:8080`; active host nginx → `127.0.0.1:8080` (`auth_request` snippet lands with the first protected server-rendered route in a later slice — the `api` provider talks to the Go API server-side)
- [x] Add the `api` provider mode in `app/src/lib/providers/api/` (AuthPort + ProfileRepository) against the Go API; register it, default `CAPSULE_PROVIDER_MODE=api`; unmigrated domains inherit mock fixtures rebound to the real session user
- [x] Verify acceptance 9a–9d + 11–13: registration + login work end-to-end on `/app` (Playwright e2e green)

### Phase 3 — Redis + remaining `/api/*` surface
- [ ] Add `redis` service with persistent volume; Redis queue consumer goroutines inside `/api` (standalone `/worker` deferred by ADR-007)
- [ ] Widen the Go API + `api` provider to wardrobe / capsule / catalog / billing, retiring the matching Supabase provider paths per domain

### Phase 4 — Storage + email + imgproxy
- [ ] DigitalOcean Spaces bucket `capsulezero` created with CORS for `https://capsulezero.app`
- [ ] Resend domain verified for `no-reply@capsulezero.app`; SPF + DKIM published
- [ ] Add `imgproxy` service

### Phase 5 — Observability + backups
- [ ] Configure syslog rotation and OTLP trace exporter target; Grafana remains deferred by ADR-007
- [ ] Nightly `pg_dump` cron uploading to `s3://capsulezero/backups/` with 14-day lifecycle

### Phase 6 — Supabase provider retirement (no `/app` rename)
- [ ] Remove `app/src/lib/providers/supabase/` and `@supabase/*`; drop `supabase` from `ProviderMode`
- [ ] Delete the unused `/web` placeholder directory
- [ ] Delete `docker-compose.legacy-supabase.yml`
- [ ] Drop legacy Supabase env keys from `deploy/compose.env.example` and droplet `.env`

## Process Memory

> Write Dead Ends, Decisions, and Known Issues **before** declaring each phase complete. Future agents inherit this on read.

### Dead Ends

- 2026-06-27 PR #48 explored a 10-service compose scaffold (Traefik + Kratos + Postgres + …) shipping in a single iteration. Rejected after the migration plan turned out to need a separate, smaller "swap the reverse proxy" step ahead of any data service. The scaffold becomes the long-term target; this spec now ships it phase by phase.
- 2026-06-28 considered `--standalone` certbot inside a sidecar container so the compose stack would be self-contained for TLS. Rejected: it duplicates what the `certbot` apt package already does on the host with a `certbot.timer`, and forces an extra container running 24/7 to do work that fires twice a day.
- 2026-06-28 considered exporting the existing Caddy ACME state to nginx-readable PEM files. Rejected: Caddy stores certs in a JSON envelope that has to be parsed and rewritten; cleaner to run a fresh `certbot certonly --standalone` during the migration window.
- 2026-06-30 considered creating the Kratos database/role later, alongside the Kratos container. Rejected: Postgres `/docker-entrypoint-initdb.d` scripts run **only** on first init of an empty volume. Provisioning `kratos` in a later commit would skip a populated droplet volume, leaving Kratos pointed at a non-existent database. We provision both databases up front in one pass.
- 2026-06-30 considered a `.sql` init file for the Kratos role. Rejected: plain SQL files in initdb cannot read env vars, so the role password could not come from the droplet `.env`. Used a `.sh` script (`00-kratos-db.sh`) that reads `KRATOS_DB_*` and guards `CREATE DATABASE` via `\gexec`.
- 2026-06-30 (Go API) first submitted Kratos self-service flows to the `ui.action` URL from the flow response. Rejected: that URL is rendered against Kratos's `SERVE_PUBLIC_BASE_URL` (browser-facing, `127.0.0.1:4433`), so from inside the `api` container it resolves to the container's own loopback → `connection refused`. Fixed by building the submit URL from the API's own internal Kratos base (`http://kratos:4433`) + the flow `id`.
- 2026-06-30 (Go API) planned to use `golang-migrate` (per the original backend-docs). Used a minimal embedded idempotent migrator instead (schema_migrations tracking table, per-file transaction): fewer dependencies, and there is no local Go toolchain to run `go mod tidy` against a heavier dep tree — builds happen in a `golang` container. backend-docs "Migrations" line updated to match.
- 2026-06-30 (e2e) the registration spec flaked once: two tests ran on parallel workers and `Date.now()` collided → duplicate email; argon2 `iterations: 2` also pushed sign-up near the 15 s `waitForURL`. Fixed with unique emails (`Date.now()`+random), `argon2 iterations: 1` (Kratos default), and 25 s waits. Green at 3.7 s afterward.

### Decisions

- 2026-06-27 PR #48 review fix: service-level `./.env` references in `docker-compose.yml` use `env_file` object form with `required: false` so `docker compose ... config` works on a fresh checkout before secrets are present.
- 2026-06-27 PR #48 review fix: the insecure Traefik dev dashboard published by `docker-compose.dev.yml` binds to `127.0.0.1:8081`, matching the file comment and avoiding exposure on shared hosts. (Superseded 2026-06-28 — `docker-compose.dev.yml` is dropped until Phase 2 reintroduces MailHog.)
- 2026-06-27 PR #48 review fix: `npm run deploy:compose` now explicitly targets `docker-compose.legacy-supabase.yml`; the production-stack deploy command lands with spec 024 implementation once real Dockerfiles/configs exist.
- 2026-06-27 PR #48 review fix: the production scaffold uses `pgvector/pgvector:pg16` instead of vanilla `postgres:16-alpine` so `CREATE EXTENSION vector` can succeed when migrations land. (**Superseded 2026-06-30** — v0.1 ships plain `postgres:16`; pgvector is deferred to the semantic catalog-search slice per ADR-007, since users/profiles/wardrobe are relational and nothing queries vectors yet.)
- 2026-06-27 PR #48 review fix: Traefik ACME uses Cloudflare DNS-01 via `CF_DNS_API_TOKEN`. (Superseded 2026-06-28 — see nginx decision below.)
- 2026-06-27 PR #48 review fix: API and worker fallback DSNs derive both username and database from `POSTGRES_USER` / `POSTGRES_DB`, matching the compose env template instead of hard-coding `capsule_zero`. (Carries into Phase 3.)
- 2026-06-27 PR #48 review fix: `deploy/compose.env.example` now describes the production-stack env contract instead of the legacy Supabase runtime. Phase 1 slims this further to the `nginx + web` keys plus the legacy `/app` placeholders the bundle still imports at boot.
- 2026-06-27 PR #48 review fix: the OpenAPI security scheme originally modeled the Kratos browser session as a browser cookie, and generated API clients landed in the canonical `/web` and React Native TypeScript paths while mirroring legacy compatibility outputs until the old scaffolds are removed. (**Superseded 2026-07-01** — the Phase 2 Go API consumes a bearer session token or `X-Session-Token`, not the raw Kratos browser cookie.)
- 2026-06-27 PR #48 review fix: the legacy `npm run deploy:compose` helper was retired instead of keeping a second Supabase env contract beside the production-stack `deploy/compose.env.example`.
- 2026-06-27 PR #48 review fix: `check-feature-memory.mjs` now treats `api/`, `worker/`, `web/`, and `mobile/` as product roots alongside legacy `app/`, and the active workflow docs describe the same gate.
- 2026-06-27 PR #48 review fix: Traefik routed browser-visible Kratos self-service paths through a priority-100 router. (Superseded 2026-06-28 — see nginx decision below; nginx will do this via `location ^~ /self-service/` in Phase 2.)
- **2026-06-28 nginx replaces Traefik as the v0.1 reverse proxy.** Rationale: universally understood directives, smallest mental tax for ops engineers joining later, no `docker.sock` mount required on the edge container, first-class `auth_request` for Kratos, first-class `limit_req_zone` for rate-limit. ADR-001 § "Why nginx and not Traefik or Caddy" carries the full reasoning. The Phase 1 PR replaces the previous 10-service compose scaffold with a minimum-shape `nginx + web` stack and keeps `docker-compose.legacy-supabase.yml` in the repo until Phase 6.
- **2026-06-28 Caddy on host is retired during Phase 1 droplet rollout.** Migration sequence in `nginx-reverse-proxy.md`: stop and disable `caddy.service`; `certbot certonly --standalone -d capsulezero.app` (port 80 free because Caddy is down and the new compose is not up yet); `docker compose up -d`. After this, certbot runs as the host renewal manager via `certbot.timer` and the deploy hook reloads nginx in-place.
- **2026-06-28 incremental phased delivery.** Originally spec 024 shipped as a single big PR. The droplet currently has no production traffic, but rolling 10 services at once still risks a multi-day rollback if any one of them has a config bug. Phased delivery makes each PR independently verifiable and revertable.
- **2026-06-28 keep `/app`, defer rename to `/web` to Phase 6.** Phase 1 builds `web` from `app/Dockerfile` to avoid a rename diff that would obscure the actual compose change being reviewed.
- **2026-06-28 retain legacy Supabase env keys in `compose.env.example` as documented placeholders.** The Next.js bundle in `/app` imports `@supabase/ssr` at module load; missing keys would throw at container start. Keys are removed in Phase 6 alongside the `/app` removal.
- **2026-06-28 PR #49 review fix: certbot webroot is host-managed, not a Docker named volume.** Host `certbot.timer` writes HTTP-01 challenge files to `/var/www/certbot`; nginx bind-mounts that path read-only via `CERTBOT_WEBROOT_HOST_DIR` and serves it from both the port-80 and port-443 ACME locations so HTTP-01 renewals still work after an HTTP→HTTPS redirect. The nginx container healthcheck uses `/nginx-health`, a real static endpoint, instead of probing a challenge token that certbot creates only during renewals.
- **2026-06-28 PR #49 review fix: nginx resolves the `web` service dynamically.** Static nginx upstream blocks resolve Docker service names only at config load, so replacing the `web` container can leave nginx proxying to a removed container IP. The Phase 1 config now uses Docker embedded DNS (`127.0.0.11`) plus variable `proxy_pass` to re-resolve `web:3000` with a short TTL.
- **2026-06-29 PR #50 review fix: spec 024 aligns with ADR-007's slim v0.1 runtime.** Phase 2 uses direct Postgres URLs without PgBouncer, Phase 3 runs the Redis queue consumer inside `api` instead of deploying a standalone `worker`, and Phase 5 verifies syslog/OTLP/backups without requiring Grafana. Promotion triggers for all three deferred services stay in ADR-007.
- **2026-06-30 (founder direction) Phase 2 is reshaped into one working auth vertical slice, not a data/identity/API split.** An earlier same-day plan split Phase 2 into "2a data tier / 2b identity tier" and ran the smoke against the Kratos API only, deferring the UI. Rejected by the founder as shipping stubs: the `/app` frontend is **already built** on the provider port/adapter abstraction (`app/src/lib/providers/`, ports in `contracts.ts`; modes `mock` + `supabase`). The slice instead delivers Postgres + Kratos + the Go API auth/profile context + a new `api` provider in `/app`, so **registration/login actually work end-to-end on the existing UI**. The UI is reused, not rebuilt — the auth form (email/password/name, `requiresEmailConfirmation`) maps onto Kratos self-service + verification.
- **2026-06-30 add a third provider mode `api`; retire the Supabase provider domain by domain.** The supabase provider (~2979 lines) is the entire backend integration, not just auth. New mode `api` implements the ports via typed fetch to the Go API + Kratos; each domain slice removes its supabase counterpart. `mock` stays for local dev/tests. `/app` is **not** renamed to `/web` — that was a cosmetic aspiration; the empty `/web` placeholder is dropped when supabase is fully gone.
- **2026-06-30 Postgres ships plain `postgres:16`; pgvector deferred to the semantic-search slice (ADR-007).** v0.1 entities are relational; nothing queries vectors until catalog semantic search (US-012).
- **2026-06-30 Phase 2 keeps the app role as the image superuser (`POSTGRES_USER`).** A dedicated least-privilege app role is deferred as a hardening follow-up; v0.1 uses the entrypoint-managed role for the app DB and a separate `kratos` login role for the Kratos DB.
- **2026-06-30 the `api` provider composes real auth/profiles + mock fixtures for unmigrated domains.** `createApiProviderRegistry()` spreads a mock registry and overrides `auth`, `profiles`, and `health` with real Go-API-backed ports. Keeps the app fully navigable (dashboard/wardrobe render fixtures) while auth is real; each later slice replaces one mock port with its real `api` port. `mock` mode stays for local/tests.
- **2026-06-30 the Go API drives Kratos "API"-type self-service flows server-side.** The `api` provider (Next.js `server-only`) calls the Go API, which calls Kratos — one backend for the frontend. Registration uses a `session` hook so sign-up auto-logs-in (matches the existing UI, which redirects to the dashboard on success). The browser never talks to Kratos directly.
- **2026-06-30 Kratos runs with `--dev` in v0.1.** It is internal-only (Go API is the only caller over the private network), so relaxing its HTTPS assumptions is acceptable for now; hardening to non-dev mode is a Known Issue below.
- **2026-07-01 PR #57 review fix: public `/api/*` is routed at both nginx edges.** The Docker nginx config already routes `/api/` to `api:8080`, but the active production path is host/systemd nginx with compose publishing the Go API on `127.0.0.1:8080`. Added the matching host route and verified the host config pair with `nginx:1.27 nginx -t` using a temporary test cert.
- **2026-07-01 PR #57 review fix: Postgres init quotes env-sourced role, database, and password values before SQL execution.** `00-kratos-db.sh` now passes values as psql variables and uses identifier/literal quoting plus `format('%I'/'%L')` before `\gexec`. Verified with a fresh `postgres:16` container using `KRATOS_DB_USER=kratos.user`, `KRATOS_DB_NAME=kratos-db`, and a password containing a single quote and spaces.
- **2026-07-01 PR #57 review fix: `api` mode rebinds inherited mock wardrobe/capsule fixtures to the real profile UUID.** Real auth/profile now return the Go API profile id, so fallback mock fixtures owned by `MOCK_USER` would otherwise make authenticated dashboards look empty until the wardrobe slice lands. The `api` provider keeps create operations on the real user id and only rebinds inherited fixture reads/updates for not-yet-migrated domains.
- **2026-07-01 PR #57 review fix: profile locales are constrained to EN/RU and profile storage errors stay visible as 5xx.** The auth schema now checks `locale IN ('en', 'ru')`; profile writes normalize/validate the same active locale set; only `profiles.ErrNotFound` returns 404, unsupported locale returns 400, and all other profile repository failures return 500.
- **2026-07-01 PR #57 review fix: profile display-name edits win over stale Kratos traits.** `EnsureForIdentity` still refreshes email and seeds a display name for empty profiles, but it no longer rewrites a user-edited `profiles.display_name` from the original Kratos registration trait on every session/profile resolution.
- **2026-07-01 PR #57 review fix: recovery keeps account enumeration private without hiding infrastructure failures.** Kratos recovery `200` and validation-style `400` remain safe success for the user-facing flow, while unexpected Kratos/courier statuses now return an error; the auth handler surfaces those as `502 INTERNAL_ERROR`.
- **2026-07-01 PR #57 review fix: the web `api` provider surfaces recovery failures instead of reporting false success.** `requestPasswordRecovery` now mirrors sign-in/sign-up status handling and throws `RECOVERY_FAILED` when the Go API returns a 4xx/5xx recovery error.
- **2026-07-01 PR #57 review fix: Kratos compose healthcheck uses Kratos's own CLI instead of shell/wget.** `oryd/kratos:v1.1.0` exposes `kratos remote status`, so the service healthcheck now uses exec form against the admin endpoint (`127.0.0.1:4434`) and no longer depends on `/bin/sh` or `wget` existing in the distroless image.
- **2026-07-01 PR #57 review fix: production Kratos secrets are required indexed env keys.** Base compose now requires `SECRETS_COOKIE_0` and `SECRETS_CIPHER_0` instead of falling back to committed dev constants; the dev override owns local-only defaults. This matches Kratos's list-valued env override semantics and fails fast when the droplet env omits a real secret.
- **2026-07-01 PR #57 review fix: Kratos browser-flow URLs are public app routes.** `infra/kratos/kratos.yml` keeps portable defaults, while compose overrides `SELFSERVICE_*` values from `APP_BASE_URL` for production and from `capsulezero.local` for dev. Verification/recovery emails no longer carry `127.0.0.1` links in production compose.
- **2026-07-01 PR #57 review fix: OpenAPI auth schemes match the implemented token flow.** The canonical contract now advertises `Authorization: Bearer <session token>` and the alternate `X-Session-Token` header consumed by the Go API. Public auth endpoints opt out with `security: []`.
- **2026-07-01 PR #57 review fix: embedded auth migrations use pgx simple protocol.** The boot-time migrator still wraps each SQL file and its `schema_migrations` insert in one transaction, but the file body now runs with `pgx.QueryExecModeSimpleProtocol` so multi-statement migration files such as `0001_initial_auth.sql` are not rejected by pgx's default prepared-statement path.
- **2026-07-01 PR #57 review fix: the implemented auth/profile surface is now in the canonical API contract.** `api-spec.md`, `openapi.yaml`, and generated clients now include `/api/auth/registration`, `/api/auth/login`, `/api/auth/whoami`, `/api/auth/recovery`, and `/api/auth/logout`; the shared `Profile` schema matches the Go/web `api` provider shape, and Go error responses use the documented nested `ErrorResponse` envelope.
- **2026-07-01 PR #57 review fix: auth flow errors no longer collapse into false client success/failure.** Registration returns 400 only for Kratos self-service flow rejections and 502 for unexpected upstream/transport failures; logout now treats non-2xx Kratos responses as errors and surfaces a 502 instead of reporting success while a token may still be active.
- **2026-07-01 PR #57 review fix: session verification and web logout preserve outage signals.** `/api/auth/whoami` still returns an empty 200 response for invalid/expired tokens, but Kratos transport/upstream failures now return 502. The web `api` provider now throws on failed `whoami` / logout responses, so `signOutAction` does not clear the local app cookie after a failed Kratos logout.

### Known Issues

- The legacy `/app` Supabase shell stays in the repo until Phase 6. Reason: keeping the working tree pristine across phases so we can rollback DNS to the old shell if needed.
- React Native scaffold ships in this spec, but real auth integration with Kratos lands in a follow-up auth/profile slice.
- Sentry and Prometheus are deferred to Stage 2. v0.1 observability is syslog + OTLP traces only; Grafana is also deferred by ADR-007 until its promotion trigger fires.
- Lava.top remains stubbed in `/api/billing/*` — the routes exist with stub responses so the OpenAPI contract is stable, but no real money moves until v0.2.
- Self-hosted Capsule Zero image-processing model is deferred to Stage 2 — v0.1 stores originals only and the 5 second processing gate is dormant.
- `npm run check:runtime-env` still validates the legacy Supabase/Lava/Photoroom env contract and fails with local placeholder values on this branch. It is **not** invoked from CI (`ci.yml` runs only `check:repo`, `check:api-contract`, `lint`, `typecheck`, `build`, `docker build`, `npm test`). Phase 6 retires the script alongside the legacy `/app` removal.
- HTTP/3 / QUIC is unavailable at the origin while nginx-alpine ships without the QUIC build. Cloudflare gives HTTP/3 at the edge once the proxy is on. No action expected until then.
- During the Phase 1 droplet rollout there is a brief connection-refused window between `systemctl stop caddy` and `docker compose up -d` while certbot issues the cert. This is acceptable today because the droplet has no production traffic.
- **(Phase 2) `postgres` is added to the root `docker-compose.yml` only, not to `docker-compose.dev-server.yml`.** The remote `dev.capsulezero.app` stack stays web-only until the slice rolls out there; bringing Postgres up on the droplet is an operator rollout step, exactly like the Phase 1 first-rollout row. Local `docker compose up -d postgres` is the evidence.
- **(Phase 2) The app database uses the Postgres superuser role.** Least-privilege separation (a non-superuser `app` role owning the app schema) is a deferred hardening follow-up; tracked here so it is not silently forgotten.
- **(Phase 2) Kratos runs with `--dev`.** Fine while Kratos is internal-only behind the Go API, but it must move to non-dev mode (real HTTPS assumptions, production secrets already via env) before Kratos is ever exposed or before commercial launch. Follow-up.
- **(Phase 2) nginx `/api/*` shadows the Next.js `/api/health` route for browser traffic.** Benign: nothing in the browser calls `/api/*` (the `api` provider talks to the Go API server-side), so only the app's status route is shadowed, and it is reachable directly on the web container. If a future client-side call needs a Next route under `/api`, namespace the Go API (e.g. `/api/v1`) or the Next route.
- **(Phase 2) In `api` mode, unmigrated domains (wardrobe/capsule/catalog/billing) serve mock fixtures even in production builds.** Intentional for the incremental migration — the app is navigable with real auth while those domains move slice by slice. Not a launch state; tracked so it is retired before commercial launch.
- **(Phase 2) nginx `auth_request` is wired for routing but not yet enforcing.** There is no server-rendered protected route to guard yet (the dashboard resolves the session in-app via the Go API). The `auth_request` guard lands with the first route that needs edge-level protection.
