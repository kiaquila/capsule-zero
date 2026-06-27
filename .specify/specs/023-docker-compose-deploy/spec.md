# Feature Specification: Production Docker Compose Supabase Runtime

**Feature Branch**: `codex/docker-compose-prod-stage`
**Created**: 2026-06-26
**Updated**: 2026-06-27
**Status**: Ready for PR verification
**Input**: User description: "Add all production-operation components to compose: database, storage, etc.; make everything real and remove mocks/emulations."

## Goal

Capsule Zero operators can run a production-shaped web stack with Docker Compose where the Next.js app uses real self-hosted Supabase services for auth, Postgres, storage, REST, realtime, and migrations instead of fixture-backed mock providers.

## Scope

In scope:

- Expand `docker-compose.yml` from a web-only runtime to a Supabase-backed stack.
- Run Postgres, GoTrue Auth, PostgREST, Storage, Realtime, Kong, Supabase Studio, Supavisor, imgproxy, Edge Runtime, and a one-shot Capsule Zero migration service.
- Add real Supabase provider code for auth, profiles, wardrobe data, storage uploads, catalog search, billing records, capsules, methodology, and health.
- Make Compose/web production runtime set `CAPSULE_PROVIDER_MODE=supabase` explicitly, keep unset local checkout mode on fixture-backed `mock`, and disable `mock` in production.
- Keep external SaaS calls real but gated: Photoroom, Lava.top, marketplace import, Google OAuth, and Apple Sign-In must require real credentials instead of falling back to local mocks.
- Add migration-backed runtime alignment for statuses, Lava invoices, auth profile creation, and public catalog seed data.
- Harden real-runtime follow-ups from AI Review: signed and verified app sessions, Supabase token verification and refresh state, writable refresh-token persistence, proxy-level expired-token refresh before Server Component renders, proxy refresh network-failure fallback, read-only refresh avoidance, auth form error handling, profile sync preservation, atomic coin ledger mutations, atomic capsule creation, capsule item ownership validation, upload target storage paths, upload asset attachment/completion idempotency, background-removal timeout persistence, processed image polling, marketplace provider failure persistence, marketplace malformed-response persistence, marketplace confirmation foreign keys, catalog search filtering/no-match behavior, catalog contributor privacy, optional local runtime env files, render-safe session reads, marketplace external image preservation, category/color post-filter normalization, PostgREST JWKS validation for opaque keys, service-role-only billing RPC access, and redacted public health counts.
- Preserve operator-supplied external-provider secrets from optional runtime env files and refresh expired Supabase sessions in memory without mutating cookies during Server Component rendering.
- Reject cross-user private Supabase Storage paths before any service-role asset upsert/signing path and keep Lava webhook invoice matching safe for non-UUID provider invoice IDs.
- Document deploy startup as an ordered Compose sequence that explicitly recreates the one-shot `migrate` service before starting `web`, so migration-only releases cannot reuse a stale completed migration container.
- Keep migration tracking metadata outside the PostgREST-exposed `public` schema and migrate any earlier public tracking table into the private ledger.
- Resolve Supabase color catalog references by stable palette/catalog color IDs when they are supplied, falling back to HEX matching only for legacy or ad hoc color points.
- Harden critic/architect/OMX review boundaries for confirmation-required Supabase signups, Lava product IDs, dedicated app-session signing, verified user-scoped service-role access, JWT-verified Edge Functions, JSON-aware health checks, and scripted ordered Compose deploys.
- Update env examples and deployment docs for local, staging, and production operation.
- Preserve local smoke-testability with clearly marked demo Supabase JWT values that must be rotated outside local runs.

Out of scope:

- Supplying real production secrets or provider accounts in git.
- Provisioning DNS, TLS, VM firewalling, observability, backups, or a managed secret store.
- Implementing Google OAuth, Apple Sign-In, Photoroom, Lava.top, or marketplace provider credentials.
- Removing the mock provider source used for non-production fixture development; production runtime must not use it.
- Changing product UI flows beyond the provider/session wiring needed for real runtime operation.

## User Scenarios & Testing

### User Story 1 - Run A Real Local Production Stack (Priority: P1)

An operator can run the documented Docker Compose deploy sequence and get the web app plus real Supabase core services without starting separate local emulators.

**Independent Test**: Run the documented Compose deploy sequence with `deploy/compose.env.example`, then verify every long-lived service is healthy and `migrate` exits 0.

**Acceptance Scenarios**:

1. **Given** `.env` values are supplied from the Compose template, **When** Compose starts, **Then** `web`, `db`, `auth`, `rest`, `storage`, `realtime`, `kong`, `studio`, `meta`, `supavisor`, `imgproxy`, and `functions` start in one project.
2. **Given** Capsule Zero SQL migrations exist, **When** the `migrate` service runs, **Then** all unapplied migrations are recorded and subsequent runs skip already applied files.
3. **Given** the web service starts, **When** `/api/health` is requested, **Then** the provider mode is `supabase` and Supabase/storage integrations are reported as configured.
4. **Given** a later release adds only files under `supabase/migrations/`, **When** the operator follows the documented deploy sequence, **Then** the canonical `migrate` service is recreated before `web` starts so pending SQL is applied for the current release.

### User Story 2 - Use Real Auth, Database, And Storage Boundaries (Priority: P1)

The app can create users through Supabase Auth, persist profiles in Postgres, and address Supabase Storage buckets through the same provider contract used by product pages.

**Independent Test**: Create a user through `/auth/v1/signup` and verify `public.profiles` receives the row through the database trigger.

**Acceptance Scenarios**:

1. **Given** a new email/password signup reaches Supabase Auth, **When** the user is created, **Then** a `public.profiles` row is created or updated with email and display name.
2. **Given** the app session is persisted, **When** server routes read it, **Then** they use the real app session cookie and retain the Supabase access token when available.
3. **Given** storage buckets are queried through Kong, **When** the service role key is used, **Then** Capsule Zero buckets are visible and governed by committed storage policies.
4. **Given** a protected route reads a session cookie, **When** the cookie is unsigned, expired, or mismatched with Supabase Auth, **Then** it is rejected instead of being trusted as user identity.

### User Story 3 - Keep External Provider Gates Honest (Priority: P2)

Operators can see which real external integrations still need credentials, and the app does not silently substitute fake provider responses in production.

**Independent Test**: Leave external provider env values blank and verify `/api/health` reports `pending-gate` for those services while Supabase remains configured.

**Acceptance Scenarios**:

1. **Given** Photoroom, Lava.top, or marketplace import credentials are missing, **When** those provider methods are invoked, **Then** they fail with explicit integration-not-configured errors instead of returning mock data.
2. **Given** production runs with `NODE_ENV=production`, **When** `CAPSULE_PROVIDER_MODE=mock` is requested, **Then** provider registry initialization throws.
3. **Given** real credentials are supplied later, **When** health is recalculated, **Then** the corresponding integration can move from `pending-gate` to `configured`.

## Negative Scenarios

1. **Given** real production secrets are needed, **When** repository files are committed, **Then** only placeholders or local demo values are present and docs require rotation before shared/stage/prod use.
2. **Given** app product paths changed, **When** the PR is validated, **Then** `.specify/specs/023-docker-compose-deploy/{spec,plan,tasks}.md` is present in the diff so feature-memory guard passes.
3. **Given** external SaaS provider credentials are blank, **When** `/api/health` runs after Supabase/storage are configured, **Then** core readiness can remain `ok` while those external integrations stay `pending-gate`.
4. **Given** Compose is restarted after the first migration run, **When** `migrate` starts again, **Then** it skips already applied migrations and exits successfully.
5. **Given** a fresh checkout has not created `deploy/runtime.env`, **When** Compose renders the local stack with `deploy/compose.env.example`, **Then** config rendering does not fail on a missing optional web runtime env file.
6. **Given** a migration-only release changes no Compose service configuration or web image, **When** an operator deploys, **Then** docs require explicit `migrate` service recreation before `web` so old `service_completed_successfully` state cannot mask unapplied SQL.
7. **Given** Kong/PostgREST is reachable with the public anon key, **When** migration tracking metadata exists, **Then** it is not readable or writable through the public Data API schema.
8. **Given** a local developer runs the app without `CAPSULE_PROVIDER_MODE`, **When** fixture-backed auth actions or `/api/health` initialize providers, **Then** the app uses the mock provider instead of requiring Supabase credentials.
9. **Given** a Journey palette color such as White (`A3`) has a UI HEX value that differs from the seeded catalog HEX, **When** Supabase validates or creates a capsule from that palette, **Then** the color resolves by catalog ID before any HEX fallback.
10. **Given** production app sessions must be signed, **When** `SESSION_SIGNING_SECRET` is missing, **Then** runtime validation and session signing fail instead of falling back to Supabase service-role or JWT secrets.

## Requirements

### Functional Requirements

- **FR-001**: `docker-compose.yml` MUST run a production-shaped Supabase stack alongside the web service.
- **FR-002**: The Compose web service MUST set `CAPSULE_PROVIDER_MODE=supabase` explicitly, while an unset provider mode in non-production local app commands MUST remain fixture-backed `mock`.
- **FR-003**: Production runtime MUST reject `CAPSULE_PROVIDER_MODE=mock`.
- **FR-004**: Compose MUST persist Postgres, database config, storage objects, and Deno cache in named Docker volumes.
- **FR-005**: Compose MUST expose only configured host ports for web, Kong, Studio, and Supavisor.
- **FR-006**: Compose MUST declare health/dependency ordering so web waits for Supabase and migrations.
- **FR-007**: Capsule Zero SQL migrations MUST be applied by an idempotent one-shot service.
- **FR-008**: The Supabase provider MUST implement the existing provider registry contracts without changing UI call sites.
- **FR-009**: Auth signup/signin MUST use Supabase Auth and synchronize profiles into Postgres.
- **FR-010**: Storage operations MUST use Supabase Storage buckets instead of `mock://` URLs.
- **FR-011**: Catalog search MUST read real public catalog records from Postgres.
- **FR-012**: External provider calls MUST require real credentials/endpoints and report `pending-gate` when absent.
- **FR-013**: Env examples MUST distinguish local smoke demo values from values that must be rotated in shared/stage/prod environments.
- **FR-014**: Deployment docs MUST describe topology, first start, health checks, migrations, backups, upgrades, and production cutover notes.
- **FR-015**: App session cookies MUST be server-signed, and Supabase provider session reads MUST verify the persisted access token against Supabase Auth.
- **FR-016**: Coin ledger debit and credit operations MUST mutate balances atomically with idempotency preserved under concurrent requests.
- **FR-017**: Marketplace import confirmation MUST persist the confirmed `items.id`, not the `wardrobe_entries.id`, in `marketplace_imports.confirmed_item_id`.
- **FR-018**: Completed photo-upload assets MUST be attachable to created items without violating the unique storage object constraint.
- **FR-019**: Completed background-removal jobs MUST expose a processed image URL when later polled or reloaded.
- **FR-020**: Protected route/session helpers MUST verify Supabase-backed sessions before returning a user id used with service-role repositories.
- **FR-021**: Auth profile synchronization MUST preserve user-edited profile fields such as display name and locale.
- **FR-022**: Photo upload completion MUST be safe to retry after the asset row already exists.
- **FR-023**: Supabase-backed app sessions MUST persist refresh tokens from auth write boundaries so future route/action refresh flows can rotate sessions without exposing refresh tokens to clients.
- **FR-024**: Supabase auth provider failures from normal sign-in, sign-up, and recovery attempts MUST return inline form errors instead of escaping to an error boundary.
- **FR-025**: Supabase catalog search MUST apply category/color/wardrobe filters and return an empty result for non-empty no-match searches.
- **FR-026**: Compose MUST allow a fresh checkout to render/start with the committed env templates even when the operator has not created a local `deploy/runtime.env`.
- **FR-027**: Supabase session read helpers MUST verify persisted access tokens without mutating cookies during Server Component rendering.
- **FR-028**: Marketplace candidate image URLs that are not Supabase Storage paths MUST NOT be recorded as signed Supabase storage assets.
- **FR-029**: Catalog search local post-filtering MUST normalize requested color IDs and HEX values the same way as the SQL filter.
- **FR-030**: Atomic billing RPCs MUST revoke execution from client roles and grant execution only to `service_role`.
- **FR-031**: The public health endpoint MUST NOT expose live user, wardrobe-item, catalog, or coin-pack counts from service-role queries.
- **FR-032**: Compose MUST NOT override optional runtime env-file provider secrets with empty Compose interpolation values.
- **FR-033**: Supabase session reads MUST refresh expired or near-expired access tokens with persisted refresh tokens before trusted `getUser()` verification, while keeping the read path cookie-mutation free.
- **FR-034**: Service-role storage helpers MUST reject private object paths whose first path segment does not match the current user id.
- **FR-035**: Lava invoice lookup/status updates MUST avoid UUID-column filters when webhook provider invoice IDs are not UUIDs.
- **FR-036**: Supabase session refreshes MUST persist rotated access and refresh tokens when the current boundary can write cookies, while safely no-oping during read-only Server Component rendering.
- **FR-037**: Photo-upload target responses MUST include the storage path required by upload completion.
- **FR-038**: Marketplace item confirmation MUST preserve external HTTP image URLs without attempting to sign them as Supabase Storage objects.
- **FR-039**: Catalog search local post-filtering MUST normalize requested category aliases before comparing mapped UI category IDs.
- **FR-040**: Supabase session reads MUST NOT consume or rotate refresh tokens unless the current request boundary can persist the rotated session cookie.
- **FR-041**: Protected page requests MUST refresh expired or near-expired Supabase sessions before Server Component validation when the incoming app session has a refresh token.
- **FR-042**: PostgREST MUST validate the same JWT key mode emitted by Kong, using JWKS/asymmetric material when opaque publishable/secret keys are enabled and the legacy shared secret otherwise.
- **FR-043**: Background-removal provider calls MUST enforce the documented 5 second quality gate and persist `timeout` status when source or provider fetches exceed it.
- **FR-044**: Marketplace import provider fetch exceptions MUST update the created import to `failed` so imports cannot remain permanently processing after network/DNS/TLS failures.
- **FR-045**: Proxy-level Supabase session refresh MUST be best-effort; network, provider, payload, or signing failures MUST fall back to normal routing/session validation instead of throwing from the proxy.
- **FR-046**: Capsule creation MUST write the capsule row, palette colors, category targets, and item memberships atomically so invalid dependent rows cannot leave a partial current capsule.
- **FR-047**: Capsule item membership writes MUST verify every requested wardrobe entry belongs to the current user before service-role inserts bypass RLS.
- **FR-048**: Public catalog search results MUST NOT expose real contributor `owner_user_id` values to clients; results MUST use a neutral catalog owner identity.
- **FR-049**: Marketplace import provider HTTP 200 responses with malformed JSON or invalid candidate shape MUST update the created import to `failed`.
- **FR-050**: Deployment docs MUST instruct operators to explicitly recreate the canonical one-shot `migrate` service before starting `web` on deploys that may include SQL changes.
- **FR-051**: Migration tracking metadata MUST live outside the PostgREST-exposed `public` schema, and existing public tracking rows MUST be copied into the private ledger before the public table is removed.
- **FR-052**: Supabase color resolution MUST prefer supplied palette/catalog color IDs before falling back to exact HEX matching.
- **FR-053**: Production runtime MUST reject the unset local mock default by treating it as `mock` and throwing unless `CAPSULE_PROVIDER_MODE=supabase` is explicitly configured.
- **FR-054**: Supabase email/password signup MUST treat a created user with no immediate session as a successful confirmation-required state, sync the profile, and avoid redirecting to the dashboard until a real session exists.
- **FR-055**: App-session signing MUST use a dedicated `SESSION_SIGNING_SECRET` in production, and server/session/proxy code MUST share one codec instead of duplicating HMAC payload logic or falling back to Supabase service-role/JWT secrets.
- **FR-056**: User-scoped Supabase provider operations that use service-role clients MUST verify the signed Supabase session user id matches the requested user id before reading or mutating private user data.
- **FR-057**: Compose Edge Functions MUST verify JWTs by default and MUST NOT receive `SUPABASE_SERVICE_ROLE_KEY` in their container environment.
- **FR-058**: The web container healthcheck MUST parse `/api/health` JSON and require `ok: true`; HTTP 200 alone MUST NOT mark the container healthy.
- **FR-059**: The canonical Compose deploy command MUST run the ordered dependency, migration, and web startup sequence through `npm run deploy:compose`.
- **FR-060**: Lava.top invoice creation and Lava health readiness MUST require real Lava product IDs for every supported coin pack when Lava is enabled, and MUST NOT substitute local pack IDs such as `coins_5`.
- **FR-061**: Public health status MUST distinguish core Supabase/storage readiness from external SaaS gates so missing external credentials remain `pending-gate` without making a configured core runtime look unavailable.

### Key Entities

- **Compose Supabase Runtime**: The Docker Compose project containing web and Supabase services.
- **Supabase Provider Registry**: The real implementation of Capsule Zero provider ports backed by Supabase.
- **Migration Runner**: One-shot `migrate` service that records applied SQL files in `capsule_zero_internal.schema_migrations`.
- **External Provider Gate**: Runtime health/configuration state for Photoroom, Lava.top, marketplace import, Google OAuth, and Apple Sign-In.
- **Runtime Env Template**: Example env files for local, stage, and production Compose operation.
- **App Session Codec**: Shared signing/parsing/validation module for persisted app sessions used by server code and Next proxy.
- **User-Scoped Service-Role Guard**: Supabase-provider boundary that checks a verified signed session before service-role repositories act on private user ids.

## Success Criteria

- **SC-001**: Feature-memory guard passes for this PR.
- **SC-002**: Repository baseline, API contract, lint, typecheck, build, and tests pass locally and in GitHub Actions.
- **SC-003**: `docker compose --env-file deploy/compose.env.example config` renders successfully.
- **SC-004**: The documented Docker Compose deploy sequence starts the real stack.
- **SC-005**: `docker compose ps -a` shows every long-lived Supabase/web service healthy and `migrate` exited 0.
- **SC-006**: `/api/health` returns HTTP 200 with `providerMode: "supabase"`, Supabase/storage configured, and external providers pending until secrets exist.
- **SC-007**: A Supabase Auth signup creates a real `public.profiles` row through the trigger.
- **SC-008**: The in-app browser can load `/en` from the rebuilt web image with no console errors.
- **SC-009**: GitHub PR #45 is ready for review, not draft, with green required checks and a fresh Codex review trigger on the final head.
- **SC-010**: AI Review follow-up fixes for session trust, coin debits, and marketplace confirmation links pass local verification and a fresh Codex review cycle.
- **SC-011**: AI Review follow-up fixes for upload asset attachment, purchase credit idempotency, and processed image polling pass local verification and a fresh Codex review cycle.
- **SC-012**: AI Review follow-up fixes for verified protected-route sessions, profile preservation, and upload-completion idempotency pass local verification and a fresh Codex review cycle.
- **SC-013**: AI Review follow-up fixes for session refresh state, inline auth errors, and catalog search filters/no-match behavior pass local verification and a fresh Codex review cycle.
- **SC-014**: AI Review follow-up fixes for optional runtime env files, render-safe session reads, marketplace external image handling, and ID-based color post-filtering pass local verification and a fresh Codex review cycle.
- **SC-015**: AI Review follow-up fixes for service-role-only billing RPC access and redacted public health counts pass local verification and a fresh Codex review cycle.
- **SC-016**: AI Review follow-up fixes for Compose env precedence and render-safe Supabase token refresh pass local verification and a fresh Codex review cycle.
- **SC-017**: Codex follow-up fixes for cross-user private storage path rejection and non-UUID Lava invoice IDs pass local verification and a fresh Codex review cycle.
- **SC-018**: Codex follow-up fixes for writable refresh-token persistence, upload target storage paths, marketplace external image preservation, and category alias post-filtering pass local verification and a fresh Codex review cycle.
- **SC-019**: Codex follow-up fixes for avoiding refresh-token rotation during read-only renders pass local verification and a fresh Codex review cycle.
- **SC-020**: Codex follow-up fixes for proxy-level expired-session refresh and PostgREST JWKS validation pass local verification and a fresh Codex review cycle.
- **SC-021**: Codex follow-up fixes for background-removal timeout persistence and marketplace import provider fetch failures pass local verification and a fresh Codex review cycle.
- **SC-022**: Codex follow-up fixes for proxy refresh failure fallback pass local verification and a fresh Codex review cycle.
- **SC-023**: Codex follow-up fixes for atomic capsule creation, capsule item ownership validation, and catalog contributor privacy pass local verification and a fresh Codex review cycle.
- **SC-024**: Codex follow-up fixes for malformed marketplace import provider responses pass local verification and a fresh Codex review cycle.
- **SC-025**: Codex follow-up fixes for explicit migration reruns in the documented deploy path pass local verification and a fresh Codex review cycle.
- **SC-026**: Codex follow-up fixes for private migration tracking metadata pass local verification and a fresh Codex review cycle.
- **SC-027**: Codex follow-up fixes for palette color ID resolution and unset local provider mode pass local verification and a fresh Codex review cycle.
- **SC-028**: Critic/architect/OMX follow-up fixes for confirmation-required signups, Lava product ID gates, shared session signing, user-scoped service-role access, Edge Function auth defaults, strict healthchecks, and scripted Compose deploys pass local verification and a fresh Codex review cycle.
