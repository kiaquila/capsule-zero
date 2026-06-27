# Tasks 022 — Production Stack Runtime

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
- [ ] Encrypted `.env` placed at `/srv/capsule-zero/.env` with mode `600`
- [ ] `api/migrations/0001_initial_schema.sql` with full schema + methodology seed
- [ ] Traefik config: TLS, rate-limit, forward-auth into Kratos
- [ ] Kratos identity schema + Resend SMTP courier + self-service flows configured
- [ ] Go API skeleton with `GET /api/health` exercising every dependency
- [ ] Go worker skeleton booting and idling cleanly
- [ ] Next.js web skeleton serving landing + Kratos auth flows
- [ ] React Native Expo scaffold with routing and env config
- [ ] Nightly `pg_dump` cron uploading to `s3://capsulezero/backups/` with 14 day lifecycle rule
- [ ] Grafana dashboards provisioned for syslog + OTLP traces
- [ ] Smoke verification on the droplet — all 15 acceptance criteria in `plan.md`

## Process Memory

> Write Dead Ends, Decisions, and Known Issues **before** declaring the spec complete. Future agents inherit this on read.

### Dead Ends

> Approaches tried and rejected, with the reason. Fill in during implementation.

- *(none yet — to be filled during execution)*

### Decisions

> Non-obvious decisions made during implementation, with rationale. Fill in during implementation.

- *(none yet — to be filled during execution)*

### Known Issues

> Limitations or follow-ups accepted as out-of-scope. Fill in before merge.

- The legacy `/app` Supabase shell stays in the repo until a follow-up PR removes it after this spec is green. Reason: keeping the working tree pristine during the runtime bring-up so we can rollback DNS to the old shell if needed.
- React Native scaffold ships in this spec, but real auth integration with Kratos lands in spec 023 (auth/profile slice).
- Sentry and Prometheus are deferred to Stage 2 — observability in v0.1 is Grafana + syslog + OTLP traces only.
- Lava.top remains stubbed in `/api/billing/*` — the routes exist with stub responses so the OpenAPI contract is stable, but no real money moves until v0.2.
- Self-hosted Capsule Zero image-processing model is deferred to Stage 2 — v0.1 stores originals only and the 5 second processing gate is dormant.
