# Plan 024 — Production Stack Runtime

## Implementation Order

Each phase below is its own PR. The phases are intentionally additive — each one keeps `https://capsulezero.app` healthy end-to-end. The droplet never has two competing reverse proxies running.

### Phase 1 — nginx + web (current PR)

1. Add `infra/nginx/nginx.conf` and `infra/nginx/conf.d/capsulezero.conf` with TLS + HTTP→HTTPS redirect + ACME challenge location + reverse_proxy to `web:3000`.
2. Replace the existing `docker-compose.yml` scaffold (10-service Traefik draft) with a minimal compose declaring `nginx` and `web` only. `web` builds from `app/Dockerfile` (the legacy `/app` source is the current frontend; renaming to `/web` ships in Phase 6).
3. Slim `deploy/compose.env.example` to the minimum needed for `nginx + web`. Document the legacy Supabase env keys that the `/app` bundle still imports at boot.
4. Add `docs_capsule_zero/project/devops/nginx-reverse-proxy.md` — operator runbook covering bootstrap, renewal, migration from Caddy, rollback, local dev posture.
5. Update ADR-001 § "Why nginx and not Traefik or Caddy" and Phase 4 council DI-017 to record the API-gateway choice.

### Phase 2 — Auth vertical slice (working registration/login)

The goal is a **working** end-to-end auth flow on the existing `/app` UI, not infrastructure that dangles. `/app` is already built on the provider port/adapter abstraction, so this phase adds a real `api` provider rather than rebuilding any UI.

6. Add `postgres` (plain `postgres:16` — pgvector deferred by ADR-007) to compose with persistent volume and healthcheck. Direct Postgres URLs in v0.1; PgBouncer deferred by ADR-007.
7. `infra/postgres/` init scripts provision the `kratos` role + database (and the app DB) in one first-init pass.
8. Add `kratos` to compose with Resend SMTP courier in prod and MailHog in `docker-compose.dev.yml` (reintroduced this phase). `infra/kratos/` identity schema (`traits.email`, `traits.name.first`, `traits.locale`) + self-service flows for sign-up, sign-in, recovery, settings.
9. Scaffold the Go `api` (built from `/api/Dockerfile`) with the **auth/profile bounded context only**: `GET /api/health`, Kratos session validation, `profiles` table + `kratos_identity_id → profiles.id` mapping on first sign-in, and the profile/session endpoints the frontend provider needs. Migrations via an embedded SQL migrator at boot, idempotent.
10. nginx routes `/api/*` to `api:8080` and runs `auth_request` against Kratos for protected routes.
11. Add the `api` provider mode in `/app` (`app/src/lib/providers/api/`) implementing `AuthPort` + `ProfileRepository` against Kratos self-service + the Go API; register it in the provider registry and default `CAPSULE_PROVIDER_MODE=api` for prod. `mock` stays for local/tests; the Supabase provider's auth/profile paths are removed as this lands.

### Phase 3 — Redis + remaining `/api/*` surface

12. Add `redis` to compose with persistent volume; start the Redis-queue consumer as goroutines inside `api` (standalone `worker` deferred by ADR-007).
13. Widen the Go API and the `api` provider to the next domain slices (wardrobe, capsule, catalog, billing), retiring the matching Supabase provider paths as each domain moves.

### Phase 4 — Storage + email + imgproxy

16. DigitalOcean Spaces bucket `capsulezero` with CORS for `https://capsulezero.app`.
17. Resend domain verified on `capsulezero.app` (SPF + DKIM published).
18. Add `imgproxy` to compose with the Spaces bucket as its origin.

### Phase 5 — Observability + backups

19. Configure syslog rotation on the droplet (daily, 7-day retention).
20. Wire the OpenTelemetry trace exporter target used by the Go API.
21. Nightly `pg_dump` cron (`ofelia`-style sidecar or host cron) uploading to `s3://capsulezero/backups/`. Spaces lifecycle rule for 14-day retention.

### Phase 6 — Supabase provider retirement

`/app` **stays** — no rename. Once every domain is served by the `api` provider:

22. Remove the Supabase provider (`app/src/lib/providers/supabase/`) and the `@supabase/*` dependencies; drop `supabase` from `ProviderMode`.
23. Delete the unused `/web` placeholder directory.
24. Delete `docker-compose.legacy-supabase.yml`.
25. Drop the legacy Supabase env keys from `deploy/compose.env.example` and from the droplet `.env`.

## Verification

Every acceptance criterion below is verifiable by a command, screenshot, or linked check — never by an AI-written summary. The phase column says when the criterion first becomes testable; earlier phases must keep passing as later phases ship.

| # | Phase | Acceptance criterion | Evidence |
|---|-------|----------------------|----------|
| 1 | 1 | `docker-compose.yml` declares `nginx` and `web` as separate `services:` blocks with explicit networks, volumes, and healthchecks | `yq '.services | keys' docker-compose.yml` returns `["nginx", "web"]` |
| 2 | 1 | `docker compose --env-file deploy/compose.env.example config` succeeds on a clean checkout | command output committed to PR; CI runs it in baseline |
| 3 | 1 | `docker compose build web` succeeds against `app/Dockerfile` with `NODE_VERSION=22-bookworm-slim` | CI step `Build Docker image` (already in `.github/workflows/ci.yml`) |
| 4 | 1 | On the droplet: `systemctl is-active caddy` returns `inactive` after migration; `docker compose ps` lists `nginx` and `web` as `(healthy)` within 60 s of `docker compose up -d` | shell output committed to PR description after first droplet rollout |
| 5 | 1 | `curl -fsSI https://capsulezero.app/en` returns HTTP 200, `server: nginx`, and `set-cookie: NEXT_LOCALE=en` | curl output committed to PR description after first droplet rollout |
| 6 | 1 | `curl -fsSI http://capsulezero.app/` returns HTTP 301 redirecting to `https://capsulezero.app/` | curl output committed to PR description |
| 7 | 1 | Negative scenario 2 (`web` exits) → `curl -fsS -o /dev/null -w '%{http_code}\n' https://capsulezero.app/en` returns 502; `docker compose ps` shows `web` unhealthy | shell output collected during droplet smoke |
| 8 | 1 | TLS certificate renewal dry-run succeeds without restarting nginx: `certbot renew --dry-run` exits 0 and the post-deploy hook reloads nginx | command output collected during droplet smoke |
| 9a | 2 | `docker compose up -d postgres` (plain `postgres:16`, no pgvector) reaches healthy; the `kratos` role + database and the app DB are provisioned in one init pass; restart on a populated volume does not re-run init | ✅ local smoke 2026-06-30: image `postgres:16`; `pg_extension` = `plpgsql` only (no `vector` — correctly deferred); `pg_database` lists `capsule_zero` + `kratos`; `pg_roles` lists `capsule` + `kratos`; restart log shows `Skipping initialization` (init not replayed) |
| 9b | 2 | `docker compose up -d postgres kratos` reaches healthy; `kratos-migrate` applies the identity schema idempotently against the prepared `kratos` DB; API connects to Postgres directly | ✅ local smoke 2026-06-30: `kratos-migrate` exits 0; `kratos` `/health/ready` = `{"status":"ok"}`; registration via the Kratos API flow returns an identity + session token |
| 9c | 2 | **Registration + login work end-to-end on the existing `/app` UI** with `CAPSULE_PROVIDER_MODE=api`: sign-up creates a Kratos identity and a mapped `profiles` row; login establishes a session; `/dashboard` is reachable | ✅ Playwright e2e `specs/auth/registration.spec.ts`: sign-up → `/dashboard` (green in mock CI and against the live api-mode stack). Sign-in verified at the Go-API level (login → session, `profile.userId == user.id`; wrong password → `401`) and during the live api-mode e2e run; PATCH `/api/profile` persists `displayName`/`city` |
| 9d | 2 | Smoke sign-up delivers a verification email (MailHog in dev; real Resend gated to Phase 4) and the `api` provider surfaces a safe inline error on a failed flow | ✅ MailHog received "Please verify your email address" for the new identity; wrong-password login → Go API `401 UNAUTHENTICATED`, surfaced inline |
| 9e | 2 | In `api` mode, unmigrated wardrobe/capsule domains keep the app navigable for real auth users by rebinding mock fixture ownership to the session `userId`, while new create operations use the real user id | ✅ `npm run lint`; ✅ `npm run typecheck`; dashboard reachability covered by `tests/e2e/specs/auth/registration.spec.ts` and the live api-mode registration smoke in row 9c |
| 9f | 2 | Profile locale persistence is constrained to active v0.1 locales (`en`, `ru`); profile storage failures return 5xx instead of masquerading as 404 | ✅ `docker run --rm -v "$PWD/api:/src" -w /src golang:1.25.11-bookworm go test ./...` covers `profiles.NormalizeLocale` and `auth.writeProfileError`; ✅ `docker build --build-arg GO_VERSION=1.25.11 -t capsule-zero-api:pr57-review-fixes ./api` |
| 9g | 2 | User-edited `displayName` is not overwritten by stale Kratos traits on the next auth/session profile resolution | ✅ diff in `api/internal/profiles/profiles.go`: `ON CONFLICT` now keeps `profiles.display_name` before falling back to the Kratos trait |
| 9h | 2 | Unexpected Kratos recovery/courier failures surface as a temporary 502 instead of a false success, validation-style recovery responses remain account-enumeration safe, and the current email-only auth UI sends recovery links instead of unrecoverable one-time codes | ✅ `docker run --rm -v "$PWD/api:/src" -w /src golang:1.25.11-bookworm go test ./...` covers recovery status mapping, link-method submission, and handler 502 behavior; ✅ `npm run lint`; ✅ `npm run typecheck` cover the web `api` provider error path |
| 9i | 2 | Kratos compose startup uses production-safe env/health semantics: base compose requires real indexed secrets, production SMTP, and public URLs; the sample cipher secret is exactly 32 characters for `xchacha20-poly1305`; production Kratos does not run with `--dev`; flow UI URLs are public app routes; the healthcheck runs a binary present in `oryd/kratos:v1.1.0` | ✅ Ory docs for `xchacha20-poly1305` require a 32-character `secrets.cipher` value; ✅ `docker run --rm oryd/kratos:v1.1.0 remote status --help`; ✅ `docker run --rm oryd/kratos:v1.1.0 serve --help` documents `--dev` as disabling critical security features; ✅ `docker compose --env-file deploy/compose.env.example config` shows `SECRETS_COOKIE_0`, 32-character `SECRETS_CIPHER_0`, Resend-shaped `COURIER_SMTP_CONNECTION_URI`, `SERVE_PUBLIC_BASE_URL=https://capsulezero.app/`, public `SELFSERVICE_*` URLs, `command: serve --config /etc/config/kratos/kratos.yml --watch-courier`, and exec-form `kratos remote status` healthcheck; ✅ negative compose config without `SECRETS_COOKIE_0` / `SECRETS_CIPHER_0` / `KRATOS_SMTP_CONNECTION_URI` fails before rendering |
| 9j | 2 | Embedded SQL migrations execute multi-statement files without pgx prepared-statement rejection, and the implemented auth/profile API is published in the canonical OpenAPI + generated clients with the implemented bearer / `X-Session-Token` auth contract | ✅ `docker run --rm -v "$PWD/api:/src" -w /src golang:1.25.11-bookworm go test ./...` covers the simple-protocol migration executor; ✅ `npm run check:api-contract` verifies `/api/auth/*`, profile schemas, auth security schemes, and regenerated web/mobile clients |
| 9k | 2 | Auth flow failures are classified by cause: registration flow rejections remain 400 validation errors, unexpected registration/transport failures return 502, stale/invalid logout tokens resolve as signed out, and unexpected Kratos logout failures return 502 instead of false success | ✅ `docker run --rm -v "$PWD/api:/src" -w /src golang:1.25.11-bookworm go test ./...` covers registration error classification, logout status mapping, stale-token logout success, and handler 502 behavior; ✅ `npm run check:api-contract` verifies the registration/logout response contract |
| 9l | 2 | Session verification, protected-route middleware, and web sign-out handle identity-provider outages intentionally: invalid/expired sessions still resolve empty/401, Kratos whoami outages return 502, the web `api` provider throws on failed revocation, and the sign-out action still clears the local app cookie before returning success | ✅ `docker run --rm -v "$PWD/api:/src" -w /src golang:1.25.11-bookworm go test ./...` covers whoami invalid-token vs upstream-error classification, `RequireSession` invalid-token vs upstream-error classification, and handler 502 behavior; ✅ `npm run lint`; ✅ `npm run typecheck`; ✅ `npm run build` cover the web provider status checks |
| 9m | 2 | Registration preserves the active EN/RU route locale in `api` mode instead of defaulting all sign-ups to EN | ✅ `npm run lint`; ✅ `npm run typecheck`; ✅ `npm run build` cover the `useLocale()` → sign-up action → provider request path; Go profile locale validation remains covered by row 9f |
| 9n | 2 | The web container receives only its explicit runtime allowlist, does not inherit backend secrets from the shared compose env file, and the production env contract no longer carries retired `SUPABASE_*` keys | ✅ `docker compose --env-file deploy/compose.env.example config --format json` inspected `services.web.environment` and found no `POSTGRES_*`, `KRATOS_*`, `SECRETS_*`, `*_DATABASE_URL`, or SMTP secrets; ✅ `rg -n "SUPABASE_" deploy/compose.env.example` returns no matches |
| 9o | 2 | Identity session reads do not mutate profile edit timestamps unless Kratos-synced fields actually change | ✅ `docker run --rm -v "$PWD/api:/src" -w /src golang:1.25.11-bookworm go test ./...` covers the guarded `EnsureForIdentity` upsert shape; ✅ live `postgres:16` smoke applied `0001_initial_auth.sql`, executed the upsert twice with identical identity data, and confirmed `updated_at` stayed stable |
| 10 | 2 | nginx routes public `/api/*` traffic to the Go API and Kratos public `/self-service/*` + `/sessions/*` traffic to Kratos in both supported edge paths, and throttles unauthenticated auth write endpoints before proxying: Docker nginx (`api:8080`, `kratos:4433`) and active host/systemd nginx (`127.0.0.1:8080`, `127.0.0.1:4433`) | ✅ `docker compose --env-file deploy/compose.env.example config`; ✅ `nginx:1.27 nginx -t` against `infra/nginx-host/00-capsule-zero.conf` + `infra/nginx-host/capsulezero.app.conf` with a temporary test cert; ✅ config grep verifies `limit_req_zone` plus throttled `/api/auth/(registration|login|recovery)` locations in Docker and host nginx |
| 11 | 2 | `GET /api/health` returns 200 with `postgres` and `kratos` `"ok"` (redis added in Phase 3); web in `api` mode reaches it via the provider | ✅ `curl /api/health` → `{"kratos":"ok","ok":true,"postgres":"ok"}`; web `/api/health` → `providerMode:"api"`, `status:"ok"`, integrations `configured` |
| 12 | 2 | Negative scenario 3 (`docker compose stop postgres`) → `/api/health` returns 503 with `postgres: "error"` | ✅ `http=503`, body `{"kratos":"error","ok":false,"postgres":"error"}` |
| 13 | 2 | Negative scenario 6: repeat `docker compose up -d` is a no-op on a healthy stack (no migration replay) | ✅ repeat `up -d` no-op; `docker logs api | grep -c "migrations applied"` = 1 |
| 14 | 4 | DigitalOcean Spaces bucket `capsulezero` exists with CORS for `https://capsulezero.app`; signed PUT round-trip succeeds | `aws s3api get-bucket-cors` output + signed PUT smoke result |
| 15 | 4 | Resend domain verified: SPF + DKIM published; verification email passes DKIM | DNS dig output + Resend dashboard screenshot |
| 16 | 4 | Negative scenario 4 (forced Resend 5xx) surfaces as inline error in web UI, no orphan identity | test script output + Kratos admin list proving no identity created |
| 17 | 4 | Negative scenario 5 (invalid Spaces CORS) surfaces as inline upload error and `/api/health` reports `storage: "error"` | repro script + curl output |
| 18 | 5 | Nightly `pg_dump` cron landed at `s3://capsulezero/backups/capsule-zero-*.dump` within 24 hours; 14-day lifecycle rule active | Spaces console screenshot + `aws s3api get-bucket-lifecycle-configuration` |
| 19 | 5 | Syslog rotation is active and the Go API trace exporter resolves its configured OTLP endpoint; Grafana remains deferred by ADR-007 | `logrotate -d` output + API trace-export smoke |
| 20 | 6 | `docker-compose.legacy-supabase.yml` removed; `/app` directory no longer present; web service builds from `/web/Dockerfile` | `git ls-tree -r HEAD -- app web docker-compose.legacy-supabase.yml` |

## Risks

- **TLS bootstrap window during Caddy → nginx migration.** Stopping Caddy frees ports 80/443 for the standalone `certbot certonly`, then compose comes up with the new cert. During this window the site returns connection refused. Mitigation: rollout is documented as a single sequence in `nginx-reverse-proxy.md`; the droplet has no production traffic today, so the window is acceptable.
- **Legacy Supabase env keys remain in `deploy/compose.env.example` until Phase 6.** They are retained for rollback / explicit `CAPSULE_PROVIDER_MODE=supabase` use, but the production `web` service no longer imports the shared compose env file wholesale. Mitigation: keep base production on `CAPSULE_PROVIDER_MODE=api`; use the legacy Supabase compose path for rollback rather than leaking provider secrets into the web container.
- **Memory pressure on 4 GB droplet** (returns as data services arrive). Mitigation: monitor syslog and `docker stats` for OOM kills during smoke; document droplet upgrade path if `kratos` + `postgres` + `api` together exceed 70% RAM under idle.
- **Let's Encrypt rate limits.** Mitigation: first issue with staging endpoint when reproducing locally; production droplet issues directly because we have one apex domain and use case is small.
- **Cloudflare DNS API token scope/rotation** (Phase 4 onwards). Mitigation: use a scoped Zone Read + DNS Edit token for `capsulezero.app`, store only in the droplet `.env`, and verify DNS-01 issuance if Cloudflare proxy is later enabled.
- **Spaces CORS misconfiguration silently allowing wildcard origins.** Mitigation: verification step explicitly lists `AllowedOrigins` and rejects `*`.

## Rollback

If a phase smoke fails on the droplet:

1. **Phase 1:** Bring the previous stack back. `docker compose down` on the new compose, `systemctl enable --now caddy`, `docker compose -f docker-compose.legacy-supabase.yml up -d web`. Document the failure mode in `tasks.md` → Process Memory → Known Issues with the exact failed verification row.
2. **Phase 2+:** Stop the newly-added service(s), keep nginx + web (or whatever the previous phase delivered) running. Document the failure mode the same way.

The legacy `/app` Supabase shell and `docker-compose.legacy-supabase.yml` remain in `main` until Phase 6 ships, exactly to make rollback fast.
