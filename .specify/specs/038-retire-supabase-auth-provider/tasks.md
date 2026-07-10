# Spec 038 — Tasks & Process Memory

## Tasks

1. `app/src/proxy.ts`: remove the Supabase session-refresh path; reduce the
   Next 16 proxy to next-intl routing only.
2. `app/src/lib/providers/supabase/index.ts`: stub the `auth` port
   (`getCurrentSession`/`signUpWithPassword`/`signInWithPassword`/`signOut` →
   `retiredSupabaseAuth`) and the `profiles` port
   (`buildRetiredProfileRepository`); delete orphaned helpers
   (`buildProfileRepository`, `guardProfileRepository`, `mapSession`, `mapUser`,
   `upsertProfileFromAuthUser`) and now-unused imports (`User`, `ProfileUpdate`);
   keep `verifyPersistedSession` + session-cookie helpers as the authorize
   primitive for the read domains.
3. `app/package.json` + `app/package-lock.json`: drop `@supabase/ssr`.
4. `deploy/prod.env.example` + `deploy/stage.env.example`: delete.
5. `app/src/lib/legal-content.ts`: fix the stale subprocessor row.
6. Docs: frontend-docs provider-mode wording; this spec folder.
7. Merge-readiness follow-up: bump the Go API toolchain/runtime pin from
   `1.25.11` to `1.25.12` across `api/go.mod`, `api/Dockerfile`,
   `docker-compose.yml`, `deploy/compose.env.example`, and
   `.github/workflows/test.yml` after `osv-scan` reported `GO-2026-5856`.
8. Local gates per plan.md → PR with SENAR gate → operator + Codex review.

## Process Memory

### Decisions

- **2026-07-09:** Retire the Supabase **auth port** by making its public methods
  throw, joining the recovery/verification/change-password methods that already
  threw "retired". The `api` provider (Kratos + Go, specs 024/034/035/037) is the
  sole real auth backend; there is no reason to keep a second, live auth path.
- **2026-07-09:** **Keep** `verifyPersistedSession` and the session-cookie
  helpers even though the auth port is retired. In the monolithic Supabase
  provider, `requireVerifiedProviderUser` (the `authorizeUser` passed into every
  guarded read domain) calls `verifyPersistedSession` directly — it is the
  authorize primitive, not part of the public auth port. It leaves with the whole
  module in Phase 6 of spec 024, not now.
- **2026-07-09:** `proxy.ts` stops refreshing sessions and no longer uses the
  app-session codec. This supersedes spec-023 FR-055's "proxy shares the codec"
  clause for the middleware layer: session lifetime is owned server-side (the
  `api` provider validates the Kratos session token via `/api/auth/whoami`). The
  codec is still shared by the server actions and `session.ts`. The removed
  refresh only ever called Supabase and was already inert in `api`/`mock` modes
  (the `api` session cookie has no `refreshToken`, so the branch returned early).
- **2026-07-09:** Delete `deploy/prod.env.example` + `deploy/stage.env.example`
  rather than rewrite them. They described stage/prod Supabase VMs that no longer
  exist; the canonical prod env template is `deploy/compose.env.example`
  (`CAPSULE_PROVIDER_MODE=api`, no `SUPABASE_*`). Deleting them removes the last
  committed `SUPABASE_*` drift outside the frozen provider and its sanctioned
  rollback artifact (`docker-compose.legacy-supabase.yml`), per AGENTS §8.
- **2026-07-09:** Legal subprocessor row updated to the then-current real stack
  (Hetzner Cloud compute/DB + DigitalOcean Spaces storage/CDN; self-hosted
  Kratos auth) instead of the stale "Supabase, Vercel". Kept minimal — only the
  one factually wrong row; the other subprocessor rows (payment, email,
  analytics, etc.) are unchanged. Superseded 2026-07-10 by spec 039, which moves
  storage to Hetzner Object Storage and removes the CDN claim.

- **2026-07-09 (Codex P2 on PR #75):** retiring Supabase auth in the shared web
  image broke the documented legacy rollback —
  `docker-compose.legacy-supabase.yml` ran `CAPSULE_PROVIDER_MODE=supabase` and
  fell back to `build: ./app`, so a rollback would build current source and
  every sign-in would throw `SUPABASE_AUTH_RETIRED` while `/api/health` still
  passed. Fix: dropped the `build: ./app` fallback and pinned the `web` service
  to a pre-spec-038 image (`CAPSULE_WEB_IMAGE`, default `capsule-zero-web:pre-spec-038`
  so an unset tag fails fast), and updated the rollback runbook
  (`nginx-reverse-proxy.md`) to require that pinned image. The Supabase-backend
  rollback is inherently a pre-pivot code+data path, so pinning pre-retirement
  code is the correct shape — not keeping dead Supabase auth in current source.
- **2026-07-09:** The PR's non-required but visible `osv-scan` failed on
  `GO-2026-5856` because `api/go.mod` declared stdlib `1.25.11` while OSV marks
  `1.25.12` as fixed. Bumped the Go patch pin consistently in the module, API
  Dockerfile, root compose build arg default, canonical compose env example, and
  test workflow container image. This is a security/CI hygiene follow-up, not a
  behavior change to the Go API.

### Dead Ends

- **Full Supabase retirement now (delete the module + `"supabase"` mode + env +
  `@supabase/supabase-js`) — rejected.** The provider's read domains
  (wardrobe/capsules/catalog/billing/storage/methodology) still have no Go
  replacement (`api` mode serves them from mock fixtures), and AGENTS §8 mandates
  retiring domain by domain. Full removal is Phase 6 of spec 024, after the Go
  contexts land.
- **Rewriting the deleted deploy templates' historical references in spec 023 —
  rejected.** Spec 023 is grandfathered; its `## Verification` notes are
  point-in-time evidence, not live CI. Left as history; the templates they cite
  are simply gone.

### Known Issues

- `app/.env.local.example` and `scripts/check-runtime-env.mjs` still declare the
  `SUPABASE_*` keys (client URL/anon/service-role), because the frozen provider's
  read domains still read them in `supabase` mode. Removed in Phase 6 together
  with the module and the `"supabase"` `ProviderMode`.
- Supabase mode is now non-functional for auth (sign-in throws), so the mode as a
  whole is effectively unusable for authenticated flows. This is intended; the
  rollback path is the separate `docker-compose.legacy-supabase.yml` (unchanged).

## Verification Log (2026-07-09, pre-PR, local)

- `npm --prefix app run typecheck` → exit 0 (clean).
- `npm --prefix app run lint` → 0 errors, 90 warnings (all pre-existing
  module-size / a11y soft-gate warnings; the two transient `no-unused-vars` for
  `User`/`ProfileUpdate` were cleared by pruning those imports).
- `npm --prefix app run lint:css` → 0 errors, 101 warnings (< 102 cap).
- `npm ci --prefix app` → exit 0 (lockfile valid without `@supabase/ssr`).
- `npm --prefix app run build` → exit 0; build output lists `ƒ Proxy
  (Middleware)` (gutted proxy still registers).
- `grep -c "@supabase/ssr" app/package-lock.json` → 0; `@supabase/supabase-js`
  → 3.
- `git grep -in supabase -- app/src/proxy.ts` → empty.
- `node scripts/check-repo-baseline.mjs` and `node scripts/check-api-contract.mjs`
  → recorded below.
- `osv-scan` initially failed on CI for Go stdlib `1.25.11`
  (`GO-2026-5856`, fixed in `1.25.12`); PR follow-up bumps all API Go version
  pins to `1.25.12`, including the workflow test container image, with the next
  CI `osv-scan` run as canonical evidence.
- `go test ./...` in `/api` → exit 0 after the Go patch-level bump.
- `docker run --rm -v "$PWD/api:/src" -w /src golang:1.25.12-bookworm sh -c 'go vet ./... && go test ./...'`
  → exit 0, matching the updated required `test` workflow's API step.
- `docker compose --env-file deploy/compose.env.example config --quiet` → exit 0
  (plain `docker compose config --quiet` requires real local secrets and is not
  the canonical env path).
- `docker run --rm -v "$PWD:/github/workspace" -w /github/workspace ghcr.io/google/osv-scanner-action:v2.3.5 scan source --recursive --experimental-exclude worktrees .`
  → `No issues found` after excluding local in-repo worktree copies that are not
  present in GitHub's clean checkout.
- `docker build --build-arg GO_VERSION=1.25.12 --build-arg GIT_SHA=local-osv-fix --build-arg BUILD_TIME=2026-07-09T00:00:00Z -t capsule-zero-api:go-1.25.12-check ./api`
  → exit 0.
- Playwright e2e not run locally (browser install is heavy and the api/mock auth
  specs are untouched); the required `test` check on the PR head SHA is the
  canonical evidence for AC 8.
