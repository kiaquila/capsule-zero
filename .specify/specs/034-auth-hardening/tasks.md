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
- [ ] Prod rollout (operator step, after merge+deploy): run the `capsule_app` runbook section of `prod-cd-pipeline.md`, smoke `/api/health` + login — record evidence here

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
