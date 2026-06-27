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
- [x] T039 Commit and push the AI Review fix iteration.
- [x] T040 Trigger a fresh `@codex review` comment on the pushed fix iterations.
- [x] T041 Address second Codex AI Review findings for upload asset attach, Lava purchase credits, and processed image polling.
- [x] T042 Apply `0005_atomic_coin_credit.sql` through the Compose `migrate` service.
- [x] T043 Verify `credit_coins_atomic` idempotency through PostgREST RPC smoke.
- [x] T044 Address third Codex AI Review findings for verified protected-route sessions, preserved profile sync fields, and idempotent upload completion.
- [x] T045 Rerun local preflight and Docker build after third AI Review fixes.
- [x] T046 Address fourth Codex AI Review findings for refreshable sessions, inline auth errors, catalog filters, and no-match search behavior.
- [x] T047 Apply `0006_catalog_search_filters.sql` through the Compose `migrate` service and smoke SQL filter/no-match results.
- [x] T048 Rerun local preflight and Docker build after fourth AI Review fixes.
- [x] T049 Address fifth Codex AI Review findings for optional runtime env files, refreshed session persistence, marketplace external image paths, and ID-based color post-filtering.
- [x] T050 Rerun local preflight, Compose config, whitespace, and Docker image checks after fifth AI Review fixes.
- [x] T051 Commit and push the fifth AI Review fix iteration.
- [x] T052 Trigger a fresh `@codex review` comment on the pushed fifth fix iteration.
- [x] T053 Address sixth Codex AI Review findings for service-role-only billing RPC grants, render-safe session reads, and public health count redaction.
- [x] T054 Rerun local preflight, whitespace, and focused migration grant checks after sixth AI Review fixes.
- [x] T055 Address seventh Codex AI Review findings for Compose env precedence and render-safe Supabase token refresh.
- [x] T056 Rerun local preflight, Compose config, whitespace, and Docker image checks after seventh AI Review fixes.
- [x] T057 Commit and push the seventh AI Review fix iteration.
- [x] T058 Trigger a fresh `@codex review` comment on the pushed seventh fix iteration.
- [x] T059 Address eighth Codex Review findings for cross-user private storage paths and non-UUID Lava invoice IDs.
- [x] T060 Rerun local preflight, whitespace, focused code checks, and Docker image checks after eighth Codex fixes.
- [x] T061 Commit and push the eighth Codex fix iteration.
- [x] T062 Trigger fresh Codex and selected-gate review comments on the pushed eighth fix iteration.
- [x] T063 Address ninth Codex Review findings for writable refreshed-token persistence, upload target storage paths, marketplace external images, and category alias post-filtering.
- [x] T064 Rerun local preflight, whitespace, focused code checks, Compose config, and Docker image checks after ninth Codex fixes.
- [x] T065 Commit and push the ninth Codex fix iteration.
- [x] T066 Trigger a fresh `@codex review` comment and rerun/watch the selected AI Review gate on the pushed ninth fix iteration.
- [x] T067 Address tenth Codex Review finding for avoiding refresh-token rotation during read-only Server Component renders.
- [x] T068 Rerun local preflight, whitespace, focused code checks, Compose config, and Docker image checks after tenth Codex fix.
- [x] T069 Commit and push the tenth Codex fix iteration.
- [x] T070 Trigger a fresh `@codex review` comment and rerun/watch the selected AI Review gate on the pushed tenth fix iteration.
- [x] T071 Address eleventh Codex Review findings for proxy-level expired-session refresh and PostgREST JWKS validation.
- [x] T072 Rerun local preflight, whitespace, focused code checks, Compose config, and Docker image checks after eleventh Codex fixes.
- [x] T073 Commit and push the eleventh Codex fix iteration.
- [x] T074 Trigger a fresh `@codex review` comment and rerun/watch the selected AI Review gate on the pushed eleventh fix iteration.
- [x] T075 Address twelfth Codex Review findings for background-removal timeout persistence and marketplace provider fetch failure handling.
- [x] T076 Rerun local preflight, whitespace, focused code checks, Compose config, and Docker image checks after twelfth Codex fixes.
- [x] T077 Commit and push the twelfth Codex fix iteration.
- [x] T078 Trigger a fresh `@codex review` comment and rerun/watch the selected AI Review gate on the pushed twelfth fix iteration.

## Process Memory

### Dead Ends

- The original PR scope was web-only Compose. The user's follow-up explicitly expanded the scope to real database/storage/backend operation, so the old feature memory became stale and had to be rewritten.
- Mounting Capsule Zero app migrations directly into the Supabase database init phase caused startup ordering issues for Auth/Storage. The fix was to keep upstream Supabase init files on `db` and apply app migrations in a separate `migrate` service after Supabase core services are healthy.
- `docker compose --env-file deploy/compose.env.example config` succeeds for Compose interpolation, but shell `source deploy/compose.env.example` is not reliable because some Compose values contain spaces. Smoke commands use `awk` to read keys instead.
- A first REST smoke query asked for the wrong profile column name (`id`/`name` instead of `user_id`/`display_name`) and returned 400. Inspecting `public.profiles` confirmed the schema and the corrected query showed the trigger-created row.
- Local feature-memory guard failed after app provider changes because no spec files were modified in the uncommitted worktree; this update touches all three required files.
- The first `0006_catalog_search_filters.sql` migration attempt failed because Postgres does not allow a CTE field directly inside `LIMIT`. The migration now uses a scalar subquery for the dynamic limit and applied cleanly.

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
- Attach completed photo-upload assets with an upsert by `(bucket, object_path)` because the upload-completion step already owns the storage object row before an item is created from it.
- Move Lava purchase credits into a sibling database RPC to keep webhook retries idempotent under concurrent delivery.
- Resolve processed image URLs from persisted storage coordinates during upload-job polling so a reload does not lose the processed asset URL.
- Keep `readMockSession` as a compatibility export, but route it through provider auth verification in Supabase mode so protected pages do not bypass token validation.
- Preserve existing profile display name and locale during Supabase auth sync; sign-in should refresh email/metadata without discarding user-edited preferences.
- Upsert upload-completion assets by storage object identity so retrying completion after the asset exists still reaches the job update.
- Keep raw signed-cookie parsing behind `readSignedAppSession`; `readAppSession` and `readMockSession` now return only provider-verified sessions in Supabase mode.
- Persist Supabase refresh tokens in the signed app session and refresh near-expired/expired sessions before calling trusted `getUser()`.
- Apply catalog filters both in SQL and after mapping results locally so Supabase mode cannot return items outside requested category/color/wardrobe criteria.
- Treat `deploy/runtime.env` as an optional operator override in Compose so a fresh checkout using committed env templates can render before local/stage/prod secrets are supplied.
- Return refreshed Supabase access and refresh tokens from provider session reads in memory, while leaving cookie persistence to explicit route/action boundaries.
- Reject external marketplace image URLs as Supabase Storage paths; provider image ingestion can be added later as an explicit import step instead of creating broken signed URLs.
- Normalize color filter IDs through the color catalog before local post-filtering so catalog IDs and HEX values match SQL filter behavior.
- Keep session reads side-effect free during Server Component rendering; token refresh persistence needs a route/action boundary rather than `cookies().set` inside provider reads.
- Revoke atomic billing RPC execution from `anon` and `authenticated` explicitly because default privileges grant routines to client roles in the base schema.
- Redact public health fixture counts in Supabase mode so unauthenticated health checks expose status booleans instead of live user or wardrobe totals.
- Leave external provider secrets out of the Compose `environment` block so optional `deploy/runtime.env` can supply them without being shadowed by empty Compose interpolation values.
- Refresh expired or near-expired Supabase sessions before trusted `getUser()` verification even when the read path cannot mutate cookies.
- Reject private Supabase Storage paths that are not namespaced under the current user id before using service-role asset upserts or signed URLs.
- Treat Lava provider invoice ids as text unless they are valid UUIDs, so webhook replay can match `lava_invoice_id` without triggering a UUID cast error on `lava_invoices.id`.
- Persist refreshed Supabase access and refresh tokens opportunistically when the current route/action boundary can write cookies, while treating read-only Server Component cookies as a safe no-op.
- Return the concrete upload storage path from provider upload-target calls so clients can complete uploads without reconstructing hidden provider paths.
- Store imported marketplace HTTP image URLs as explicit external asset references instead of trying to sign retailer/CDN URLs through Supabase Storage.
- Normalize catalog category aliases through the same UI-to-DB mapping before local post-filtering so SQL-matched aliases are not dropped after result hydration.
- Probe cookie mutability before calling Supabase `setSession()` so read-only Server Component renders do not rotate refresh tokens they cannot persist back to the browser.
- Refresh expired or near-expired Supabase app sessions in Next proxy before protected Server Components read cookies, then propagate the refreshed signed app cookie through middleware request-header overrides.
- Configure PostgREST JWT verification with `${JWT_JWKS:-${JWT_SECRET}}` because PostgREST v14 accepts JWK/JWKS JSON through `jwt-secret`/`PGRST_JWT_SECRET`, while local legacy JWTs still use the shared secret fallback.
- Enforce one 5 second abort budget across the background-removal source image fetch and Photoroom provider call, and persist `timeout` when that quality gate is exceeded.
- Mark marketplace imports `failed` when the provider fetch throws before a response is received so created import rows cannot remain permanently `processing`.

### Known Issues

- `/api/health` remains `ok: false` locally until real external provider credentials are supplied; this is expected and safer than pretending those integrations are live.
- The Compose stack does not configure TLS, public DNS, firewall policy, VM backups, log retention, metrics, or a secret manager.
- Real production Photoroom, Lava.top, marketplace parser, Google OAuth, and Apple Sign-In credentials still need provider-account setup outside git.
- Supabase self-hosted image versions are pinned in Compose and should be upgraded deliberately with database backups.
