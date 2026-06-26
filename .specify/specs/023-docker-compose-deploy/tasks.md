# Tasks: Production Docker Compose Supabase Runtime

**Input**: `.specify/specs/023-docker-compose-deploy/spec.md`, `plan.md`

## Phase 1: Setup

- [x] T001 Refresh GitHub state with `git fetch --all --prune`.
- [x] T002 Confirm `gh` is authenticated and inspect PR #45 state.
- [x] T003 Compare current branch with `origin/main`; branch was 0 behind before the production-runtime iteration.
- [x] T004 Inspect prior web-only Compose scope and identify the feature-memory conflict with the new real Supabase scope.
- [x] T005 Use current Supabase self-hosted Docker references for service topology.

## Phase 2: Implementation

- [x] T006 Add Supabase client dependencies to the app.
- [x] T007 Implement `createSupabaseProviderRegistry()` for real provider ports.
- [x] T008 Switch provider registry default to `supabase` and forbid `mock` in production.
- [x] T009 Rename persisted session cookie from mock-specific to app session while keeping legacy read compatibility.
- [x] T010 Add `0003_runtime_provider_alignment.sql` for runtime statuses, Lava invoices, profile trigger, catalog seed, and grants.
- [x] T011 Add Supabase self-host config under `deploy/supabase/`.
- [x] T012 Replace web-only Compose with web plus Supabase services and a one-shot migration runner.
- [x] T013 Update local/stage/prod env examples for Supabase runtime and real external-provider gates.
- [x] T014 Update Docker Compose deployment documentation for topology, health, migrations, backups, upgrades, and cutover.
- [x] T015 Update this feature-memory package to reflect the real Supabase runtime instead of the previous web-only scope.

## Phase 3: Verification

- [x] T016 Run `npm run lint && npm run typecheck` in `app/`.
- [x] T017 Run `docker compose --env-file deploy/compose.env.example config`.
- [x] T018 Run `docker compose --env-file deploy/compose.env.example up -d --build`.
- [x] T019 Verify `docker compose ps -a` shows long-lived services healthy and `migrate` exited 0.
- [x] T020 Verify `/api/health` reports `providerMode: "supabase"`, configured Supabase/storage, and pending external gates.
- [x] T021 Verify Supabase Storage buckets are reachable through Kong with the service role key.
- [x] T022 Verify PostgREST can read seeded catalog/color data with the service role key.
- [x] T023 Verify Supabase Auth signup creates a `public.profiles` row through the trigger.
- [x] T024 Remove temporary smoke-test auth user from the local database.
- [x] T025 Rebuild/recreate the web container after the final provider sign-out fix.
- [x] T026 Reload `/en` in the in-app browser and confirm no console errors.
- [x] T027 Rerun full local preflight after feature-memory update.
- [x] T028 Run runtime env validation for stage/prod examples.
- [x] T029 Run exact CI Docker image build command.
- [x] T030 Run `git diff --check`.
- [x] T031 Stage the intended files and commit with Codex co-author trailer.
- [x] T032 Push branch `codex/docker-compose-prod-stage`.
- [x] T033 Mark PR #45 ready for review and update its description.
- [x] T034 Trigger Codex review with a top-level `@codex review` comment.
- [ ] T035 Watch GitHub checks and fix any failing iteration until merge-ready.
- [x] T036 Address Codex AI Review findings for signed sessions, atomic coin debits, and marketplace confirmation foreign keys.
- [x] T037 Apply `0004_atomic_coin_spend.sql` through the Compose `migrate` service.
- [x] T038 Rerun local preflight and whitespace checks after the AI Review fixes.
- [ ] T039 Commit and push the AI Review fix iteration.
- [ ] T040 Trigger a fresh `@codex review` comment on the final pushed head.

## Process Memory

### Dead Ends

- The original PR scope was web-only Compose. The user's follow-up explicitly expanded the scope to real database/storage/backend operation, so the old feature memory became stale and had to be rewritten.
- Mounting Capsule Zero app migrations directly into the Supabase database init phase caused startup ordering issues for Auth/Storage. The fix was to keep upstream Supabase init files on `db` and apply app migrations in a separate `migrate` service after Supabase core services are healthy.
- `docker compose --env-file deploy/compose.env.example config` succeeds for Compose interpolation, but shell `source deploy/compose.env.example` is not reliable because some Compose values contain spaces. Smoke commands use `awk` to read keys instead.
- A first REST smoke query asked for the wrong profile column name (`id`/`name` instead of `user_id`/`display_name`) and returned 400. Inspecting `public.profiles` confirmed the schema and the corrected query showed the trigger-created row.
- Local feature-memory guard failed after app provider changes because no spec files were modified in the uncommitted worktree; this update touches all three required files.

### Decisions

- Keep `mock` provider source available for non-production fixture development, but throw if it is selected in production.
- Use the official self-hosted Supabase service split and keep Capsule Zero SQL migrations as a separate idempotent operation.
- Keep external provider integrations real and explicit: missing Photoroom, Lava.top, marketplace import, Google OAuth, and Apple Sign-In credentials produce `pending-gate` or integration errors rather than fake success.
- Use named Docker volumes for database, storage, config, and Deno cache so the stack can survive container recreation.
- Keep demo Supabase JWT values only in `deploy/compose.env.example` for local smoke tests and document that every secret must be rotated before shared/stage/prod startup.
- Preserve existing page imports of `readMockSession` through aliases while introducing the real `readAppSession` naming.
- Treat the app session cookie as a signed server artifact. The legacy mock cookie remains readable only for explicit non-production mock mode so Supabase production runtime cannot accept forged JSON identity.
- Move coin spends into a database RPC that serializes idempotency keys and uses a conditional profile balance update, keeping concurrent debits atomic in Postgres instead of in application memory.
- Confirm marketplace imports with the underlying `items.id` from the wardrobe entry so `marketplace_imports.confirmed_item_id` satisfies its real foreign key.

### Known Issues

- `/api/health` remains `ok: false` locally until real external provider credentials are supplied; this is expected and safer than pretending those integrations are live.
- The Compose stack does not configure TLS, public DNS, firewall policy, VM backups, log retention, metrics, or a secret manager.
- Real production Photoroom, Lava.top, marketplace parser, Google OAuth, and Apple Sign-In credentials still need provider-account setup outside git.
- Supabase self-hosted image versions are pinned in Compose and should be upgraded deliberately with database backups.
