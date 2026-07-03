# Spec 034 — Auth Hardening Before Real-Provider QA

## Goal

Close the five auth-hardening follow-ups carried in spec 024 `tasks.md` Known Issues and
spec 033 `tasks.md` Follow-ups, so the auth surface deployed to `https://capsulezero.app`
is ready for real-provider QA:

1. **Throttle the session-validation surface.** `GET /api/auth/whoami`,
   `POST /api/auth/logout`, `GET /api/profile`, `PATCH /api/profile` are today outside
   every rate limit (the Go limiter covers only registration/login/recovery; the edge
   `limit_req` covers only the same three writes). A bot with any string as a bearer token
   can drive Kratos `WhoAmI` lookups unthrottled.
2. **Raise Kratos Argon2 cost to OWASP.** Production password hashing runs
   `iterations: 1` (below the OWASP `t ≥ 2` minimum for Argon2id).
3. **Guard the `openapi.yaml ↔ Go` contract.** Nothing fails CI when a route registered
   by the Go API drifts from (or never lands in) `docs_capsule_zero/adr/openapi.yaml`.
4. **Make `profiles.email` UNIQUE and serialize the boot migrator.** The column is only
   indexed, and concurrent API replicas could interleave boot migrations (no
   `pg_advisory_lock`).
5. **Move the app off the Postgres superuser.** The API connects as the image-managed
   `POSTGRES_USER` superuser; a dedicated least-privilege `capsule_app` role should own
   exactly the app database.

## Scope

**In:**

- Go API: second, higher-rate token-bucket limiter (reusing `api/internal/ratelimit`)
  wired around whoami/logout/profile; route table extracted into a testable constructor.
- `infra/kratos/kratos.yml`: `hashers.argon2.iterations: 2`; local-dev override keeps
  `1` via env in `docker-compose.dev.yml` (e2e speed; prod truth lives in the base file).
- `scripts/check-api-contract.mjs`: new check — every route the Go binary registers must
  exist in `openapi.yaml` with the same method + path (fails on zero parsed routes).
- `api/migrations/0002_profiles_email_unique.sql` + advisory-lock serialization in
  `api/internal/db.Migrate` (single lock key, held on one pooled connection for the whole
  run).
- `infra/postgres/00-kratos-db.sh`: fresh-init provisioning of the `capsule_app`
  least-privilege role (optional env — populated volumes skip initdb entirely);
  `deploy/compose.env.example` + dev env updated; prod rollout runbook for the
  already-initialized volume (operator step, recorded in tasks.md when executed).
- Docs actualization in the same change (spec 024/033 memory rows, backend docs).

**Out:**

- Recovery / email verification / settings flows (next slice; decision 2026-07-02:
  auto-login stays, verification is async — the registration status-code enumeration
  residual remains accepted for v0.1).
- Cloudflare front-door and CF-ranges refresh (deferred to Stage 2, founder decision
  2026-07-02).
- Shared (Redis-backed) rate-limit store — single-droplet topology keeps the in-memory
  limiter; revisit on scale-out.
- nginx edge changes: the Go limiter is the single chokepoint both edge-direct and
  web-action traffic funnel through, so no new edge zone is added for the session
  surface.

## Acceptance criteria

1. Flooding `GET /api/auth/whoami` (or logout/profile) from one client past the session
   burst returns `429 RATE_LIMITED` + `Retry-After` (negative), while the per-request
   budget stays high enough that normal app navigation (server-side `whoami` per page
   render) is unaffected; auth writes keep their strict 10/min bucket, and the two
   buckets are independent.
2. Production Kratos config hashes with Argon2 `iterations: 2`; the local-dev stack
   overrides to `1` and the CI e2e lane (mock provider, no Kratos) is unaffected.
3. `npm run check:api-contract` fails when the Go API registers a route absent from
   `openapi.yaml` (negative: synthetic drift trips it) and passes on the real tree.
4. A second profile row with a duplicate email is rejected by the database (negative);
   two concurrent `Migrate` runs serialize on the advisory lock and apply each migration
   exactly once.
5. The API boots and serves auth/profile traffic connected as `capsule_app` (not the
   superuser); the role cannot access the `kratos` database (negative). Fresh-init
   volumes provision the role automatically; the populated prod volume gets a one-time
   operator rollout.

## Negative scenarios

Covered inside the acceptance criteria: 429 on session-surface flood (1), contract-guard
tripping on synthetic drift (3), duplicate-email rejection (4), `capsule_app` denied on
the Kratos DB (5).

## TDD scope

Criteria 1 and 4 are Go application behavior — failing tests are committed first
(`go test` red) and the implementation follows. Criteria 2, 3, and 5 are infra/tooling
(Kratos config, a Node check script, initdb provisioning): per the constitution §VII
scope rule they are verified by config validation, script runs, and live
`postgres:16`/compose smokes recorded in `plan.md` instead of committed failing tests.
