# Plan 024 — Production Stack Runtime

## Implementation Order

Each phase below is its own PR. The phases are intentionally additive — each one keeps `https://capsulezero.app` healthy end-to-end. The droplet never has two competing reverse proxies running.

### Phase 1 — nginx + web (current PR)

1. Add `infra/nginx/nginx.conf` and `infra/nginx/conf.d/capsulezero.conf` with TLS + HTTP→HTTPS redirect + ACME challenge location + reverse_proxy to `web:3000`.
2. Replace the existing `docker-compose.yml` scaffold (10-service Traefik draft) with a minimal compose declaring `nginx` and `web` only. `web` builds from `app/Dockerfile` (the legacy `/app` source is the current frontend; renaming to `/web` ships in Phase 6).
3. Slim `deploy/compose.env.example` to the minimum needed for `nginx + web`. Document the legacy Supabase env keys that the `/app` bundle still imports at boot.
4. Add `docs_capsule_zero/project/devops/nginx-reverse-proxy.md` — operator runbook covering bootstrap, renewal, migration from Caddy, rollback, local dev posture.
5. Update ADR-001 § "Why nginx and not Traefik or Caddy" and Phase 4 council DI-017 to record the API-gateway choice.

### Phase 2 — Postgres + Kratos

6. Add `postgres` (pgvector image) and `pgbouncer` to compose with persistent volume and healthcheck.
7. Add `kratos` to compose with Resend SMTP courier in prod and MailHog in `docker-compose.dev.yml` (reintroduced this phase).
8. Wire `infra/postgres/` init scripts to enable `pgvector`, create the Kratos database, and create app + Kratos roles.
9. Wire `infra/kratos/` identity schema with `traits.email`, `traits.name.first`, `traits.locale`; self-service flows for sign-up, sign-in, recovery, settings.
10. Add nginx `auth_request` middleware that calls the Kratos session API for protected routes (`/dashboard`, future `/api/*` non-public endpoints).

### Phase 3 — Go API + worker + Redis

11. Add `redis` to compose with persistent volume.
12. Add `api` to compose: Go monolith built from `/api/Dockerfile`, exposing `GET /api/health` that probes Postgres / Redis / Kratos.
13. Add `worker` to compose: Redis-queue consumer that idles cleanly.
14. Ship `api/migrations/0001_initial_schema.sql` (full schema + methodology seed). Migrations run via `golang-migrate` invoked by the API on boot, idempotent.
15. Update nginx to route `/api/*` to `api:8080`.

### Phase 4 — Storage + email + imgproxy

16. DigitalOcean Spaces bucket `capsulezero` with CORS for `https://capsulezero.app`.
17. Resend domain verified on `capsulezero.app` (SPF + DKIM published).
18. Add `imgproxy` to compose with the Spaces bucket as its origin.

### Phase 5 — Observability + backups

19. Add `grafana` to compose with provisioning for syslog and OTLP traces.
20. Configure syslog rotation on the droplet (daily, 7-day retention).
21. Nightly `pg_dump` cron (`ofelia`-style sidecar or host cron) uploading to `s3://capsulezero/backups/`. Spaces lifecycle rule for 14-day retention.

### Phase 6 — Legacy `/app` removal

22. Rename `/app` → `/web` (`git mv`), preserving history. Update `docker-compose.yml` build context.
23. Move `app/src/styles/tokens.css` → `web/src/styles/tokens.css`.
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
| 9 | 2 | `docker compose up -d postgres pgbouncer kratos` reaches healthy within 90 s; pgvector extension present in Postgres | `docker compose ps` + `psql -c '\dx vector'` output |
| 10 | 2 | Smoke sign-up via Kratos self-service flow delivers a real verification email via Resend | screenshot of inbox + Kratos identity record (admin API JSON) |
| 11 | 3 | `curl -fsS https://capsulezero.app/api/health` returns 200 with `postgres`, `redis`, `kratos` all `"ok"` | curl output committed to PR |
| 12 | 3 | Negative scenario 3 (`docker compose stop postgres`) → `/api/health` returns 503 with `postgres: "error"` | log committed |
| 13 | 3 | Negative scenario 6: repeat `docker compose up -d` is a no-op on a healthy stack (no migration replay) | `docker compose ps` and `docker compose logs api --tail=20` |
| 14 | 4 | DigitalOcean Spaces bucket `capsulezero` exists with CORS for `https://capsulezero.app`; signed PUT round-trip succeeds | `aws s3api get-bucket-cors` output + signed PUT smoke result |
| 15 | 4 | Resend domain verified: SPF + DKIM published; verification email passes DKIM | DNS dig output + Resend dashboard screenshot |
| 16 | 4 | Negative scenario 4 (forced Resend 5xx) surfaces as inline error in web UI, no orphan identity | test script output + Kratos admin list proving no identity created |
| 17 | 4 | Negative scenario 5 (invalid Spaces CORS) surfaces as inline upload error and `/api/health` reports `storage: "error"` | repro script + curl output |
| 18 | 5 | Nightly `pg_dump` cron landed at `s3://capsulezero/backups/capsule-zero-*.dump` within 24 hours; 14-day lifecycle rule active | Spaces console screenshot + `aws s3api get-bucket-lifecycle-configuration` |
| 19 | 5 | Grafana reachable at `https://grafana.capsulezero.app` behind nginx `auth_request`; syslog data source resolves | screenshot of Grafana home dashboard + admin login test |
| 20 | 6 | `docker-compose.legacy-supabase.yml` removed; `/app` directory no longer present; web service builds from `/web/Dockerfile` | `git ls-tree -r HEAD -- app web docker-compose.legacy-supabase.yml` |

## Risks

- **TLS bootstrap window during Caddy → nginx migration.** Stopping Caddy frees ports 80/443 for the standalone `certbot certonly`, then compose comes up with the new cert. During this window the site returns connection refused. Mitigation: rollout is documented as a single sequence in `nginx-reverse-proxy.md`; the droplet has no production traffic today, so the window is acceptable.
- **`/app` boot still requires legacy Supabase env keys.** The Next.js bundle initialises the Supabase SSR client at module load, so missing keys can throw at boot. Mitigation: keep the keys with placeholder values in `deploy/compose.env.example` until Phase 6.
- **Memory pressure on 4 GB droplet** (returns in Phase 5). Mitigation: monitor Grafana for OOM kills during smoke; document droplet upgrade path if `grafana` + `kratos` + `postgres` together exceed 70% RAM under idle.
- **Let's Encrypt rate limits.** Mitigation: first issue with staging endpoint when reproducing locally; production droplet issues directly because we have one apex domain and use case is small.
- **Cloudflare DNS API token scope/rotation** (Phase 4 onwards). Mitigation: use a scoped Zone Read + DNS Edit token for `capsulezero.app`, store only in the droplet `.env`, and verify DNS-01 issuance if Cloudflare proxy is later enabled.
- **Spaces CORS misconfiguration silently allowing wildcard origins.** Mitigation: verification step explicitly lists `AllowedOrigins` and rejects `*`.

## Rollback

If a phase smoke fails on the droplet:

1. **Phase 1:** Bring the previous stack back. `docker compose down` on the new compose, `systemctl enable --now caddy`, `docker compose -f docker-compose.legacy-supabase.yml up -d web`. Document the failure mode in `tasks.md` → Process Memory → Known Issues with the exact failed verification row.
2. **Phase 2+:** Stop the newly-added service(s), keep nginx + web (or whatever the previous phase delivered) running. Document the failure mode the same way.

The legacy `/app` Supabase shell and `docker-compose.legacy-supabase.yml` remain in `main` until Phase 6 ships, exactly to make rollback fast.
