# Tasks 034 — Auth Hardening

## Tasks

- [x] TDD red commit: `TestSessionEndpointsThrottled`, `TestAuthAndSessionBucketsIndependent` (cmd/api), `TestMigrationLockWrapsBody` / `TestMigrationLockReleasesOnBodyError` (internal/db)
- [x] Go: `newMux(...)` route constructor; session limiter 120/min burst 60 around whoami/logout/profile; cleanup loop covers both limiters
- [x] `api/migrations/0002_profiles_email_unique.sql` (UNIQUE index replaces `profiles_email_idx`)
- [x] `db.Migrate`: `pg_advisory_lock` held on one pooled connection for the run
- [x] `infra/kratos/kratos.yml` `iterations: 2`; `docker-compose.dev.yml` pins `HASHERS_ARGON2_ITERATIONS=1`
- [x] `scripts/check-api-contract.mjs`: Go route registrations ⊆ `openapi.yaml` (fail on zero parsed routes)
- [x] `infra/postgres/00-kratos-db.sh` provisions optional `capsule_app` role on fresh init + revokes PUBLIC CONNECT on both databases; env templates updated
- [x] Docs: spec 024/033 memory rows point here; `backend-docs.md` migrations/roles notes; `prod-cd-pipeline.md` one-time role rollout runbook
- [x] Prod rollout (operator step, 2026-07-03, after PR #66 merged `b881a34` + CD deploy): ran the `capsule_app` runbook on `cz` (Hetzner), swapped the API DSN, smoked `/api/health` — evidence in "Prod rollout evidence" below

## Process Memory

### Dead Ends

- **"Role separation is enough" was not enough:** Postgres grants CONNECT on every new
  database to PUBLIC by default, so `capsule_app` (and any future role) could connect to
  the `kratos` database even with no table grants. The init script and the prod runbook
  now `REVOKE CONNECT ... FROM PUBLIC` on both databases; owners keep implicit access.
- An 11-request *sequential* curl probe never trips a `rate=10r/m burst=10 nodelay`
  limiter (nginx rejects from request 12, and per-request TLS round-trips refill the
  bucket) — discovered while attaching spec 033 evidence; throttle probes must be
  parallel bursts.

### Decisions

- **2026-07-02 session-validation endpoints get their own 120/min bucket, not the
  10/min auth-write bucket.** The web app resolves the session server-side via `whoami`
  on page renders, so reusing the strict write bucket would throttle normal navigation.
  120/min per client keys on the same trusted `X-Capsule-Client-IP` derivation.
- **2026-07-02 no new nginx edge zone for the session surface.** The Go limiter is the
  single chokepoint for both edge-direct and web-action paths (same argument as the
  spec 024 Codex P2 fix); an edge zone would double-maintain the same policy.
- **2026-07-02 dev keeps Argon2 `iterations: 1` via env override.** Prod truth lives in
  `kratos.yml` (`iterations: 2`, OWASP t≥2); the dev override preserves local e2e
  timings (spec 024 dead-end 2026-06-30). CI e2e runs the mock provider and never
  hashes.
- **2026-07-02 contract guard checks the implemented→documented direction only.**
  Documented-but-unimplemented routes are expected during the domain-by-domain
  migration (wardrobe/capsule/billing are contract-first); the failure mode being
  closed is a Go route shipping without a contract entry.
- **2026-07-02 prod role rollout is post-deploy, not initdb.** The prod volume is
  already initialized, so `/docker-entrypoint-initdb.d` never re-runs (spec 024
  dead-end 2026-06-30); the operator step transfers ownership after migration `0002`
  has applied under the superuser DSN, keeping the deploy itself boring.

### Known Issues

- The in-memory limiter stays per-process (accepted spec 024 residual; Redis store on
  scale-out).
- Registration status-code enumeration residual stays accepted for v0.1 (founder
  decision 2026-07-02: auto-login + async verification in the next slice).

## Prod rollout evidence (2026-07-03)

Operator step executed on the Hetzner host (`cz`, `/opt/capsule-zero`) after PR #66 merged
to `main` (`b881a34`) and CD Prod deployed the pinned images. `.env` was backed up before
the DSN swap; the app password was generated on the host and never left it.

- **Preconditions:** api on `ghcr.io/kiaquila/capsule-zero-api:sha-b881a344…` (healthy);
  `schema_migrations` = `0001`, `0002` (migration `0002` already applied under the
  superuser DSN); `capsule_app` absent; `datacl` NULL on both DBs (PUBLIC could connect).
  kratos verified as owner of its own DB, so `REVOKE CONNECT … FROM PUBLIC` cannot lock it out.
- **Rollout:** `CREATE ROLE capsule_app LOGIN` (attrs `rolsuper|rolcreatedb|rolcreaterole|rolcanlogin`
  = `f|f|f|t`); ownership of `capsule_zero`, schema `public`, `profiles`, `schema_migrations`
  transferred to `capsule_app`; `REVOKE CONNECT … FROM PUBLIC` on `capsule_zero` + `kratos`;
  API DSN switched to `capsule_app`; api recreated on the same CD-pinned image (`--no-build`).
- **Positive:** `psql -U capsule_app -d capsule_zero -c 'SELECT current_user'` → `capsule_app`;
  `pg_stat_activity` shows the api pool connected as `capsule_app`;
  `https://capsulezero.app/api/health` → `{"kratos":"ok","ok":true,"postgres":"ok"}`.
- **Negative (least-privilege):** `psql -U capsule_app -d kratos` →
  `FATAL: permission denied for database "kratos" (User does not have CONNECT privilege)`;
  post-revoke `datacl` = `capsule_zero:{=T/capsule_app,capsule_app=CTc/capsule_app}`,
  `kratos:{=T/kratos,kratos=CTc/kratos}` (PUBLIC keeps only `T`/TEMP, loses `c`/CONNECT).
- **Negative (throttle):** 250 parallel `GET /api/auth/whoami` from one client →
  74×`200` + 176×`429`; the `429` carries `retry-after: 60` (session bucket 120/min burst 60).

### Runbook fix applied in this change

The one-time rollout block ran `docker compose … up -d api` without `--no-build`. Because
the `api` service in `docker-compose.yml` is
`image: ${CAPSULE_API_IMAGE:-capsule-zero-api:local}` with a `build:` fallback and the
manual step never sets `CAPSULE_API_IMAGE`, compose compiled the image on the host
(`capsule-zero-api:local`) — violating the "prod never host-builds / CI-provenance only"
rule. Recovered by recreating api from the CD-pinned `ghcr.io/…:sha-b881a344…` (still
cached) with `--no-build`. The runbook now captures the pinned image first and restarts
with `CAPSULE_API_IMAGE="$PIN" … --no-build`, backs up `.env`, and pins
`psql -v ON_ERROR_STOP=1`.
