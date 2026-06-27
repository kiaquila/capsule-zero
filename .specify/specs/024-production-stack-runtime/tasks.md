# Tasks 024 — Production Stack Runtime

## Tasks

> Track granular work here as it lands. Each task should resolve to a concrete commit or PR comment.

- [ ] Scaffold `/api`, `/worker`, `/web`, `/mobile`, `/infra/{traefik,kratos,postgres}` directories
- [ ] Add minimal `Dockerfile` to `/api`, `/worker`, `/web`
- [ ] Write `docker-compose.yml` with all ten services as separate `services:` blocks and named volumes
- [ ] Write `docker-compose.dev.yml` (MailHog, hot-reload, debug logs)
- [ ] DigitalOcean droplet resized to ≥ 4 GB / 2 vCPU / 80 GB; Docker + compose plugin installed
- [ ] Spaceship DNS pointed at Cloudflare nameservers
- [ ] Cloudflare proxy on `capsulezero.app`; SSL/TLS Full (strict); Bot Fight Mode on
- [ ] DigitalOcean Spaces bucket `capsulezero` created with CORS for `https://capsulezero.app`
- [ ] Resend account verified for `no-reply@capsulezero.app`; SPF + DKIM published
- [ ] Encrypted `.env` placed at `/srv/capsule-zero/repo/.env` with mode `600`
- [ ] `api/migrations/0001_initial_schema.sql` with full schema + methodology seed
- [ ] Traefik config: TLS, rate-limit, forward-auth into Kratos
- [ ] Kratos identity schema + Resend SMTP courier + self-service flows configured
- [ ] Go API skeleton with `GET /api/health` exercising every dependency
- [ ] Go worker skeleton booting and idling cleanly
- [ ] Next.js web skeleton serving landing + Kratos auth flows
- [ ] React Native Expo scaffold with routing and env config
- [ ] Nightly `pg_dump` cron uploading to `s3://capsulezero/backups/` with 14 day lifecycle rule
- [ ] Grafana dashboards provisioned for syslog + OTLP traces
- [ ] Smoke verification on the droplet — all 17 acceptance criteria in `plan.md`

## Process Memory

> Write Dead Ends, Decisions, and Known Issues **before** declaring the spec complete. Future agents inherit this on read.

### Dead Ends

> Approaches tried and rejected, with the reason. Fill in during implementation.

- *(none yet — to be filled during execution)*

### Decisions

> Non-obvious decisions made during implementation, with rationale. Fill in during implementation.

- 2026-06-27 PR #48 review fix: service-level `./.env` references in `docker-compose.yml` use `env_file` object form with `required: false` so `docker compose ... config` works on a fresh checkout before secrets are present.
- 2026-06-27 PR #48 review fix: the insecure Traefik dev dashboard published by `docker-compose.dev.yml` binds to `127.0.0.1:8081`, matching the file comment and avoiding exposure on shared hosts.
- 2026-06-27 PR #48 review fix: `npm run deploy:compose` now explicitly targets `docker-compose.legacy-supabase.yml`; the production-stack deploy command lands with spec 024 implementation once real Dockerfiles/configs exist.
- 2026-06-27 PR #48 review fix: the production scaffold uses `pgvector/pgvector:pg16` instead of vanilla `postgres:16-alpine` so `CREATE EXTENSION vector` can succeed when migrations land.
- 2026-06-27 PR #48 review fix: Traefik ACME uses Cloudflare DNS-01 via `CF_DNS_API_TOKEN`, so Cloudflare proxy can stay enabled for issuance and renewal; the encrypted `.env` is installed in the Compose project directory so `env_file: ./.env` is actually loaded.
- 2026-06-27 PR #48 review fix: API and worker fallback DSNs derive both username and database from `POSTGRES_USER` / `POSTGRES_DB`, matching the compose env template instead of hard-coding `capsule_zero`.

### Known Issues

> Limitations or follow-ups accepted as out-of-scope. Fill in before merge.

- The legacy `/app` Supabase shell stays in the repo until a follow-up PR removes it after this spec is green. Reason: keeping the working tree pristine during the runtime bring-up so we can rollback DNS to the old shell if needed.
- React Native scaffold ships in this spec, but real auth integration with Kratos lands in a follow-up auth/profile slice.
- Sentry and Prometheus are deferred to Stage 2 — observability in v0.1 is Grafana + syslog + OTLP traces only.
- Lava.top remains stubbed in `/api/billing/*` — the routes exist with stub responses so the OpenAPI contract is stable, but no real money moves until v0.2.
- Self-hosted Capsule Zero image-processing model is deferred to Stage 2 — v0.1 stores originals only and the 5 second processing gate is dormant.
- `npm run check:runtime-env` still validates the legacy Supabase/Lava/Photoroom env contract and fails with local placeholder values on this branch. Spec 024 must replace or retire that checker when the production-stack env contract lands.
