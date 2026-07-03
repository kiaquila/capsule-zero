# Plan 034 — Auth Hardening

## Approach

One PR, five hardening items, smallest-diff shape:

- **Session-surface throttle** reuses `api/internal/ratelimit.Limiter` with a second,
  higher-rate instance (120/min, burst 60 — roomy for server-side `whoami` per page
  render, still two orders of magnitude below an unthrottled flood). Route registration
  moves from inline `run()` statements into a `newMux(...)` constructor so wiring is
  testable; both limiters share the existing cleanup goroutine loop.
- **Argon2** flips one line in `infra/kratos/kratos.yml` (prod truth); the dev override
  file pins `HASHERS_ARGON2_ITERATIONS=1` so local full-stack e2e keeps its measured
  timings (spec 024 dead-end: `iterations: 2` once pushed local sign-up near a 15 s
  wait on the old droplet).
- **Contract guard** extends `scripts/check-api-contract.mjs` (already in CI via
  `npm run check:api-contract`): parse `mux.HandleFunc("METHOD /path"` registrations
  from the Go tree and require each in `openapi.yaml`; fail hard on zero parsed routes
  so a refactor cannot silently disarm the check.
- **DB integrity**: migration `0002` swaps `profiles_email_idx` for a UNIQUE index;
  `db.Migrate` acquires `pg_advisory_lock` on one pooled connection for the whole run
  (fresh snapshot per statement is preserved — the lock wraps, it does not batch).
- **Least-priv role**: fresh-init provisioning goes into the existing
  `infra/postgres/00-kratos-db.sh` (reuse — same initdb pass, same quoting pattern);
  the populated prod volume gets a one-time operator rollout (role + ownership transfer
  + `.env` DSN swap + `up -d api`) executed right after this PR deploys, evidence
  recorded below. Migration files from `0002` on must stay runnable by a
  non-superuser owner role (no superuser-only DDL; `pgcrypto` is a trusted extension
  in PG16, so `IF NOT EXISTS` re-runs are safe).

Rollout order for item 5 on prod: merge → CD deploys (migration `0002` applies under
the current superuser DSN) → operator step switches role/ownership and the API DSN →
`/api/health` + login smoke. Rollback = restore the previous DSN line and `up -d api`.

## Verification

| # | Acceptance criterion | Evidence |
|---|---|---|
| 1 | Session surface throttled (whoami/logout/profile → 429 past burst; auth writes keep 10/min; buckets independent) | Failing-first Go test `TestSessionEndpointsThrottled` + `TestAuthAndSessionBucketsIndependent` (commit red → green); post-deploy prod probe: parallel whoami flood → ≥ 1 `429` |
| 2 | Argon2 `iterations: 2` in prod config; dev override keeps 1 | `kratos.yml` diff; `docker compose --env-file deploy/compose.dev.env -f docker-compose.yml -f docker-compose.dev.yml config` shows the env override; prod login smoke past deploy (latency sanity) |
| 3 | Contract guard trips on Go↔OpenAPI drift (negative) and passes on the real tree | `npm run check:api-contract` green on the branch; red run with a synthetic unregistered route (output pasted in PR) |
| 4 | `profiles.email` UNIQUE + advisory-locked migrator | Failing-first Go test `TestMigrateAcquiresAdvisoryLock` (red → green); live `postgres:16` smoke: fresh migrate → duplicate-email insert rejected (23505); two concurrent `Migrate` runs → single applied set |
| 5 | API runs as least-priv `capsule_app`; role denied on `kratos` DB (negative) | Local fresh-init compose smoke: init script provisions role, API boots healthy on the `capsule_app` DSN; `psql` as `capsule_app` → `\c kratos` denied; prod rollout evidence (commands + `/api/health` + login smoke) appended to tasks.md when executed |
| 6 | Docs actualized in the same change | Diffs: spec 024/033 memory rows, `backend-docs.md`, `compose.env.example`, this spec folder |
