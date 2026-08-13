# Spec 038 — Retire the Supabase auth & profile provider paths

## Goal

The `api` provider (Ory Kratos + Go API — specs 024/034/035/037) now owns the
entire auth and profile domain in production. Remove the parallel
Supabase-specific auth code the app no longer needs — the dead edge
session-refresh in the Next proxy, the unused `@supabase/ssr` dependency, the
stale `SUPABASE_*` deploy templates, and the still-live Supabase auth/profile
port implementations — while keeping the frozen Supabase provider's
not-yet-migrated read domains until their Go contexts land (AGENTS §8; Phase 6
of spec 024).

## Scope

**In:**

- `app/src/proxy.ts`: delete the Supabase session-refresh path
  (`refreshSupabaseSession`, `supabaseRefreshTokenUrl`, `SupabaseRefreshResponse`,
  `readExpiresAt`, the proxy copy of `readMetadataName`,
  `maybeRefreshAppSessionCookie`, and the header-override / cookie-upsert
  helpers). The Next 16 proxy (`proxy.ts` is the current middleware entrypoint,
  spec 010) now runs only next-intl locale routing. Session lifetime is owned
  server-side — the `api` provider validates the Kratos session token per
  request via `/api/auth/whoami`. The refresh path only ever called Supabase and
  was already inert in `api`/`mock` modes (the `api` session cookie carries no
  `refreshToken`, so the branch returned early).
- `app/src/lib/providers/supabase/index.ts`: replace the still-live auth methods
  (`getCurrentSession`, `signUpWithPassword`, `signInWithPassword`, `signOut`)
  and the profile port (`getProfile` / `updateProfile`) with loud
  `SUPABASE_AUTH_RETIRED` throws, joining the already-retired
  recovery/verification/change-password methods. Delete the now-orphaned helpers
  (`buildProfileRepository`, `guardProfileRepository`, `mapSession`, `mapUser`,
  `upsertProfileFromAuthUser`). **Keep** `verifyPersistedSession` and the
  session-cookie helpers — they remain the authorize primitive
  (`requireVerifiedProviderUser`) that the provider's still-present read domains
  depend on.
- `app/package.json` + `app/package-lock.json`: drop `@supabase/ssr` (zero
  imports in `app/src`). `@supabase/supabase-js` stays — the provider's read
  domains still use it.
- `app/src/lib/legal-content.ts`: correct the stale "Supabase, Vercel"
  subprocessor row to the then-current real stack (Hetzner Cloud +
  DigitalOcean Spaces; self-hosted authentication). Superseded 2026-07-10 by
  spec 039, which moves storage to Hetzner Object Storage.
- `deploy/prod.env.example` + `deploy/stage.env.example`: delete. They declared
  `CAPSULE_PROVIDER_MODE=supabase` + a full `SUPABASE_*` contract for stage/prod
  VMs that no longer exist; the canonical prod env template is
  `deploy/compose.env.example` (`CAPSULE_PROVIDER_MODE=api`, no `SUPABASE_*`).
- `docker-compose.legacy-supabase.yml`: pin the `web` service to a
  **pre-spec-038** image (`CAPSULE_WEB_IMAGE`, default a non-existent
  `capsule-zero-web:pre-spec-038` tag) and drop the `build: ./app` fallback.
  Retiring Supabase auth in the shared web image would otherwise break this
  rollback silently — a current-source build serves `SUPABASE_AUTH_RETIRED`
  sign-in while `/api/health` still passes (Codex P2 on this PR). The rollback
  runbook `docs_capsule_zero/project/devops/nginx-reverse-proxy.md` is updated
  to require the pinned image.
- Merge-readiness security follow-up: bump the Go API toolchain/build pin from
  `1.25.11` to `1.25.12` in `api/go.mod`, `api/Dockerfile`,
  `docker-compose.yml`, `deploy/compose.env.example`, and
  `.github/workflows/test.yml` to clear OSV `GO-2026-5856` for the stdlib. No
  API behavior changes. **Superseded 2026-08-13:** the same five active pins are
  now `1.26.6`. Go 1.25.13 fixed five later advisories but `GO-2026-5942` has no
  fixed 1.25.x release; the Go vulnerability database identifies 1.26.6 as the
  first fixed stable toolchain.
- Docs actualized in the same PR (AGENTS §9): frontend-docs provider-mode
  wording; rollback runbook; this spec folder.

**Out (explicitly):**

- The Supabase provider's read domains (wardrobe, capsules, catalog, billing,
  storage, methodology) and the shared `verifyPersistedSession` /
  session-cookie helpers — kept until each Go context lands and the whole module
  is deleted in Phase 6 of spec 024.
- `"supabase"` in `ProviderMode`, the registry `mode === "supabase"` branch,
  `@supabase/supabase-js`, and the `SUPABASE_*` keys in `app/.env.local.example`
  / `scripts/check-runtime-env.mjs` — still needed while the read domains remain
  reachable in supabase mode; removed in Phase 6.
- `deploy/supabase/**` — the sanctioned Supabase rollback stack config (keep).
  `docker-compose.legacy-supabase.yml` stays as the rollback artifact but is
  pinned to a pre-spec-038 web image (see In) rather than left to build the
  current, auth-retired source.
- Any change to the `api` or `mock` providers, or to real auth behavior.

## Context (not a user-facing feature)

Engineering cleanup. The auth/profile domain migrated to the Go/Kratos backend
(PR #57 and follow-ups 034/035/037), so the parallel Supabase auth code is dead
weight in the live modes and the stale `SUPABASE_*` deploy config is a
recoupling hazard (AGENTS §8). This slice removes that surface without
disturbing the modes that actually run.

## Acceptance criteria

1. `app/src/proxy.ts` has no Supabase reference; its default export is
   next-intl only. `git grep -i supabase -- app/src/proxy.ts` is empty.
2. In the Supabase provider every `auth` and `profiles` port method throws (the
   four previously-live methods now throw `SUPABASE_AUTH_RETIRED`; recovery /
   verification / change-password keep their existing retired codes). No
   auth/profile method performs a live Supabase call.
3. The provider's read domains are unchanged and still compile;
   `requireVerifiedProviderUser` → `verifyPersistedSession` is intact.
4. `@supabase/ssr` is absent from `app/package.json` and `app/package-lock.json`;
   `npm ci --prefix app` installs cleanly; `@supabase/supabase-js` is retained.
5. The legal subprocessor table names the real infra (no "Supabase, Vercel").
6. `deploy/prod.env.example` and `deploy/stage.env.example` are removed; the
   canonical prod env template `deploy/compose.env.example` remains and carries
   no `SUPABASE_*`.
7. `baseline-checks` green on PR head: `check:repo`, `check:api-contract`,
   `lint`, `lint:css`, `typecheck`, `build`, Docker build, `npm test` (no-op).
8. `test` (Playwright e2e) green — api/mock auth flows are unchanged, proving no
   live-mode regression.
9. `osv-scan` green on PR head — the Go stdlib pin is at the fixed `1.26.6`
   level everywhere the API image/runtime/test version is declared.

## Negative scenario

With `CAPSULE_PROVIDER_MODE=supabase`, any auth or profile call now throws
`SUPABASE_AUTH_RETIRED` (fail-loud) instead of silently running Supabase auth —
the intended, documented end state of the retirement, consistent with the
already-retired recovery/verification/password-change methods.

## TDD waiver

Per constitution §VII the failing-test-first loop governs **new user-visible
product behavior**. This slice introduces none: it removes or stubs code paths
unreachable in the live modes (`api` in prod, `mock` in dev/CI) — the `api`
session cookie carries no Supabase refresh token, and no environment sets
`CAPSULE_PROVIDER_MODE=supabase`. The guarantee is "no regression in the live
modes," evidenced by the unchanged, green `test` e2e suite plus
`typecheck`/`build`, and by grep-proof that the removed helpers have no
remaining caller. Waiver recorded here in lieu of a committed failing test.
