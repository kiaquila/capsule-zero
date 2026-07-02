# Tasks 034 — Auth Hardening

## Tasks

- [ ] TDD red commit: `TestSessionEndpointsThrottled`, `TestAuthAndSessionBucketsIndependent` (cmd/api), `TestMigrateAcquiresAdvisoryLock` (internal/db)
- [ ] Go: `newMux(...)` route constructor; session limiter 120/min burst 60 around whoami/logout/profile; cleanup loop covers both limiters
- [ ] `api/migrations/0002_profiles_email_unique.sql` (UNIQUE index replaces `profiles_email_idx`)
- [ ] `db.Migrate`: `pg_advisory_lock` held on one pooled connection for the run
- [ ] `infra/kratos/kratos.yml` `iterations: 2`; `docker-compose.dev.yml` pins `HASHERS_ARGON2_ITERATIONS=1`
- [ ] `scripts/check-api-contract.mjs`: Go route registrations ⊆ `openapi.yaml` (fail on zero parsed routes)
- [ ] `infra/postgres/00-kratos-db.sh` provisions optional `capsule_app` role on fresh init; env templates updated
- [ ] Docs: spec 024/033 memory rows point here; `backend-docs.md` migrations/roles notes
- [ ] Prod rollout (operator step, after merge+deploy): create `capsule_app`, transfer ownership, swap API DSN in `/opt/capsule-zero/.env`, `up -d api`, smoke — record evidence here

## Process Memory

### Dead Ends

_(populated as work proceeds)_

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
