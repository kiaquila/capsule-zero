# Spec 038 — Plan & Verification

## Approach

One cleanup slice on branch `refactor/038-retire-supabase-auth-provider`. No new
product behavior, so no failing-test-first loop (TDD waiver in spec.md §"TDD
waiver"): the change removes/stubs code that is unreachable in the live provider
modes (`api` in prod, `mock` in dev/CI). Safety comes from the unchanged, green
`test` e2e suite (api/mock auth flows) plus the static gates, and from a
grep-proof that every removed helper had no remaining caller.

Order: proxy dead-code removal → Supabase auth/profile port stubs + orphan-helper
deletion → dependency + lockfile → deploy templates + legal copy → docs → local
gates → PR with SENAR gate → operator review + Codex review.

Key entanglement handled: in the monolithic Supabase provider, session
verification (`verifyPersistedSession`) is shared — `requireVerifiedProviderUser`
uses it as the authorize primitive for **every** still-present read domain
(wardrobe/capsules/catalog/billing/storage/methodology). So the auth *port* is
retired (public methods throw) but the verification helper and session-cookie
helpers are deliberately retained; they leave with the whole module in Phase 6.

## Verification

| # | Acceptance criterion | Evidence |
|---|---|---|
| 1 | `proxy.ts` is Supabase-free, next-intl only | `git grep -in supabase -- app/src/proxy.ts` → empty (local, 2026-07-09); build registers `ƒ Proxy (Middleware)` |
| 2 | Every Supabase `auth`/`profiles` port method throws (no live Supabase auth call) | Source review: `buildAuthPort` 4 methods → `retiredSupabaseAuth(...)`, recovery/verification/change-password keep prior retired throws; `buildRetiredProfileRepository` both methods throw; `git grep "clients.anon.auth\|clients.service.auth" app/src/lib/providers/supabase/index.ts` shows only the retained `verifyPersistedSession` authorize path |
| 3 | Read domains unchanged; authorize primitive intact | `verifyPersistedSession` + `requireVerifiedProviderUser` retained and still referenced; `npm --prefix app run typecheck` exits 0 (local, 2026-07-09) |
| 4 | `@supabase/ssr` gone, installs clean, `supabase-js` kept | `grep -c "@supabase/ssr" app/package-lock.json` → 0; `@supabase/supabase-js` → 3; `npm ci --prefix app` exit 0 (local, 2026-07-09) |
| 5 | Legal subprocessor row corrected | `git grep -n "Supabase, Vercel" app/src` → empty; row now "Hetzner Cloud, Hetzner Object Storage" after the 2026-07-10 spec 039 storage revision |
| 6 | Deploy templates removed; canonical prod env carries no `SUPABASE_*` | `git rm deploy/prod.env.example deploy/stage.env.example`; `git grep -n SUPABASE_ deploy/compose.env.example` → empty |
| 7 | `baseline-checks` green on PR head | Local 2026-07-09: `typecheck` exit 0, `lint` 0 errors (90 pre-existing warnings), `lint:css` 0 errors (101 warnings < 102 cap), `build` exit 0, `npm ci --prefix app` exit 0. `check:repo` / `check:api-contract` recorded in tasks.md; full run reconfirmed by the `baseline-checks` check on the PR head SHA |
| 8 | `test` (Playwright e2e) green — no live-mode regression | The api/mock auth specs are untouched; evidence is the required `test` check green on PR head SHA (e2e browsers not run locally — CI is canonical for this gate) |
| 9 | `osv-scan` green on PR head | Merge-readiness follow-up after CI found `GO-2026-5856`: `api/go.mod`, `api/Dockerfile`, `docker-compose.yml`, `deploy/compose.env.example`, and `.github/workflows/test.yml` pinned Go `1.25.12` (fixed stdlib level at the time). Local 2026-07-09: `osv-scanner scan source --recursive --experimental-exclude worktrees .` → `No issues found`; `docker build --build-arg GO_VERSION=1.25.12 ... ./api` exits 0. CI `osv-scan` was the canonical PR-head evidence. Historical note: the 2026-08-13 advisories superseded this patch with 1.25.13 in the spec-050 merge-readiness follow-up |

## Risks

- **Retiring the Supabase auth *port* effectively bricks supabase mode** (no
  sign-in → no session → read domains unreachable in that mode). Accepted: no
  environment runs `CAPSULE_PROVIDER_MODE=supabase` (prod=`api`, dev/CI=`mock`),
  and the mode's rollback path is the separate `docker-compose.legacy-supabase.yml`
  artifact, which is out of scope and unchanged. Documented in tasks.md.
- **Spec-023 historical evidence references the deleted deploy templates.** Those
  are point-in-time verification notes for a grandfathered spec; they are not
  live CI and are intentionally left as history (not rewritten). Noted in
  tasks.md Dead Ends.
- **proxy.ts no longer participates in the app-session codec (spec-023 FR-055).**
  Superseded here: session lifetime is server-side (Kratos whoami). The codec is
  still shared by the server actions / `session.ts`; only the middleware stops
  refreshing. Recorded in tasks.md Decisions.
