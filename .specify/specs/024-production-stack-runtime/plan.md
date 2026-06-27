# Plan 024 — Production Stack Runtime

## Implementation Order

1. **Scaffold the repo layout.** Create `/api`, `/worker`, `/web`, `/mobile`, `/infra/{traefik,kratos,postgres}`, `/api/migrations/` per the target layout in `AGENTS.md`. Add a minimal Dockerfile to each of `/api`, `/worker`, `/web` (Go for first two, Node multi-stage for `web`).
2. **Write `docker-compose.yml`.** Each service declared as a separate `services:` block. Add a healthcheck per service. Add explicit named volumes for persistent data.
3. **Write `docker-compose.dev.yml`.** Override `kratos` courier to MailHog SMTP; mount `/api` and `/worker` as volumes for hot-reload; bind MailHog UI to `127.0.0.1:8025`.
4. **Provision infrastructure on the droplet.** Resize to ≥ 4 GB / 2 vCPU / 80 GB. Install Docker + compose plugin. Point Spaceship DNS at Cloudflare; enable Cloudflare proxy and SSL/TLS Full (strict); enable Bot Fight Mode. Create the Spaces bucket and configure CORS. Verify Resend domain (SPF/DKIM) on `capsulezero.app`.
5. **Ship migrations.** `api/migrations/0001_initial_schema.sql` covering the full schema in `backend-docs.md` plus methodology seed. `migrations/0002_kratos_bootstrap.sql` if Kratos needs role/db setup beyond the postgres init script.
6. **Wire Traefik.** TLS via Let's Encrypt, rate-limit middleware, forward-auth into Kratos for `/api/*` (except `/api/health`).
7. **Wire Kratos.** Identity schema with `traits.email`, `traits.name.first`, `traits.locale`; Resend SMTP courier in prod, MailHog in dev; self-service flows for sign-up, sign-in, recovery, settings.
8. **Wire the Go API skeleton.** `GET /api/health` exercises Postgres / Redis / Kratos / Spaces / Resend reachability. A smoke handler resolves the Kratos session for a logged-in user (used by the smoke flow only — full profile routes ship in a later auth/profile slice).
9. **Wire the worker skeleton.** Boots, connects to Redis, idles cleanly, exposes a liveness endpoint Traefik can probe internally.
10. **Wire the web skeleton.** Next.js App Router serving landing + sign-up/sign-in pages rendered against Kratos self-service. No business pages yet.
11. **Wire the mobile scaffold.** Expo project with routing structure (`(auth)` + `(app)` groups) and env config for API base URL and deep-link scheme. No real auth flow yet — that ships with a later mobile auth integration slice.
12. **Backups.** Cron job inside an `ofelia`-style sidecar or host cron that runs nightly `pg_dump` and uploads to `backups/`. Spaces lifecycle rule for 14 day retention.
13. **Observability.** Grafana provisioned with the syslog dashboard and OTLP trace receiver. syslog file rotation set up on the droplet.
14. **Smoke end-to-end on the droplet.** Bring the stack up, run the verification script.

## Verification

Every acceptance criterion below is verifiable by a command, screenshot, or linked check — never by an AI-written summary.

| # | Acceptance criterion | Evidence |
|---|----------------------|----------|
| 1 | `docker-compose.yml` declares each service as a separate `services:` block: traefik, kratos, postgres, pgbouncer, redis, api, worker, web, imgproxy, grafana | `yq '.services | keys' docker-compose.yml` lists all ten; diff against expected list |
| 2 | `docker-compose.dev.yml` overrides courier to MailHog and binds MailHog UI to `127.0.0.1:8025` | `yq '.services.kratos.environment' docker-compose.dev.yml` + `yq '.services.mailhog.ports' docker-compose.dev.yml` |
| 3 | `docker compose up -d` on the droplet brings every service to healthy within 2 minutes | `docker compose ps` output with all `(healthy)`; commit to PR description |
| 4 | `curl -fsS https://capsulezero.app/api/health` returns 200 with `postgres`, `redis`, `kratos`, `storage`, `email` all `"ok"` | `curl` output committed to PR; rerun in CI smoke job |
| 5 | Smoke sign-up via the web UI delivers a real verification email via Resend | screenshot of the inbox + Kratos identity record (admin API JSON) |
| 6 | Negative scenario 1: Postgres unreachable → `/api/health` returns 503 with `postgres: "error"` | `docker compose stop postgres && curl -i …/api/health`; log committed |
| 7 | Negative scenario 5: repeat `docker compose up -d` is a no-op on a healthy stack | second `docker compose ps` shows no recreated containers; `docker compose logs api --tail=20` shows no migration replay |
| 8 | Cloudflare proxy is on; SSL/TLS is Full (strict); Bot Fight Mode is enabled | screenshot of CF dashboard committed to PR |
| 9 | DigitalOcean Spaces bucket `capsulezero` exists with CORS for `https://capsulezero.app`; signed PUT round-trip succeeds | `aws s3api get-bucket-cors` output + signed PUT smoke result |
| 10 | Resend domain verified on `capsulezero.app`: SPF + DKIM published; verification email passes DKIM | DNS dig output + DKIM check via `dig +short TXT default._domainkey.capsulezero.app` and Resend dashboard screenshot |
| 11 | Nightly `pg_dump` cron landed at `s3://capsulezero/backups/capsule-zero-*.dump` within 24 hours; lifecycle rule active for 14 days | Spaces console screenshot + `aws s3api get-bucket-lifecycle-configuration` |
| 12 | Grafana reachable at `https://grafana.capsulezero.app` behind Traefik forward-auth; syslog data source resolves | screenshot of Grafana home dashboard + admin login test |
| 13 | Negative scenario 2: forced Resend 5xx surfaces as inline error in web UI, no orphan identity | test script that swaps Resend env var temporarily + Kratos admin list output proving no identity created |
| 14 | Negative scenario 3: invalid Spaces CORS surfaces as inline upload error and `/api/health` reports `storage: "error"` | repro script + `curl` output |
| 15 | Negative scenario 4: Let's Encrypt first-issue completes with Cloudflare proxy off, then proxy re-enabled without 5xx | Traefik log excerpt showing successful ACME challenge + CF post-enable curl |
| 16 | Compose scaffold validates on a clean checkout without a committed `./.env` | `docker compose --env-file deploy/compose.env.example config` and `docker compose --env-file deploy/compose.env.example -f docker-compose.yml -f docker-compose.dev.yml config` |
| 17 | OpenAPI generated clients stay in sync with `docs_capsule_zero/adr/openapi.yaml` | `npm run check:api-contract` |

## Risks

- **Memory pressure on 4 GB droplet.** Mitigation: monitor Grafana for OOM kills during smoke; document droplet upgrade path if `grafana` + `kratos` + `postgres` together exceed 70% RAM under idle.
- **Let's Encrypt rate limits.** Mitigation: first issue with staging endpoint, then swap to production endpoint after smoke success.
- **Cloudflare proxy + Let's Encrypt HTTP-01 challenge interaction.** Mitigation: documented in negative scenario 4 with the proxy-off-then-on sequence.
- **Spaces CORS misconfiguration silently allowing wildcard origins.** Mitigation: verification step explicitly lists `AllowedOrigins` and rejects `*`.

## Rollback

If the smoke verification fails irrecoverably on the droplet:

1. Stop the stack: `docker compose down`.
2. Restore the previous DNS state (point Cloudflare back at the legacy Vercel hostname if it still exists, otherwise put up a Cloudflare maintenance page).
3. The legacy `/app` Supabase shell remains in `main`; do not delete it until after the runtime spec is green.
4. Document the failure mode in `tasks.md` → Process Memory → Known Issues, including the exact failed verification row above.
