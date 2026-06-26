# Feature Specification: Production Docker Compose Supabase Runtime

**Feature Branch**: `codex/docker-compose-prod-stage`
**Created**: 2026-06-26
**Updated**: 2026-06-26
**Status**: Ready for PR verification
**Input**: User description: "Add all production-operation components to compose: database, storage, etc.; make everything real and remove mocks/emulations."

## Goal

Capsule Zero operators can run a production-shaped web stack with Docker Compose where the Next.js app uses real self-hosted Supabase services for auth, Postgres, storage, REST, realtime, and migrations instead of fixture-backed mock providers.

## Scope

In scope:

- Expand `docker-compose.yml` from a web-only runtime to a Supabase-backed stack.
- Run Postgres, GoTrue Auth, PostgREST, Storage, Realtime, Kong, Supabase Studio, Supavisor, imgproxy, Edge Runtime, and a one-shot Capsule Zero migration service.
- Add real Supabase provider code for auth, profiles, wardrobe data, storage uploads, catalog search, billing records, capsules, methodology, and health.
- Make `CAPSULE_PROVIDER_MODE=supabase` the default runtime mode and disable `mock` in production.
- Keep external SaaS calls real but gated: Photoroom, Lava.top, marketplace import, Google OAuth, and Apple Sign-In must require real credentials instead of falling back to local mocks.
- Add migration-backed runtime alignment for statuses, Lava invoices, auth profile creation, and public catalog seed data.
- Harden real-runtime follow-ups from AI Review: signed app sessions, Supabase token verification, atomic coin ledger mutations, upload asset attachment, processed image polling, and marketplace confirmation foreign keys.
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

An operator can run `docker compose up -d --build` and get the web app plus real Supabase core services without starting separate local emulators.

**Independent Test**: Run Compose with `deploy/compose.env.example`, then verify every long-lived service is healthy and `migrate` exits 0.

**Acceptance Scenarios**:

1. **Given** `.env` values are supplied from the Compose template, **When** Compose starts, **Then** `web`, `db`, `auth`, `rest`, `storage`, `realtime`, `kong`, `studio`, `meta`, `supavisor`, `imgproxy`, and `functions` start in one project.
2. **Given** Capsule Zero SQL migrations exist, **When** the `migrate` service runs, **Then** all unapplied migrations are recorded and subsequent runs skip already applied files.
3. **Given** the web service starts, **When** `/api/health` is requested, **Then** the provider mode is `supabase` and Supabase/storage integrations are reported as configured.

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
3. **Given** external SaaS provider credentials are blank, **When** `/api/health` runs, **Then** the stack is `degraded` rather than falsely `ok`.
4. **Given** Compose is restarted after the first migration run, **When** `migrate` starts again, **Then** it skips already applied migrations and exits successfully.

## Requirements

### Functional Requirements

- **FR-001**: `docker-compose.yml` MUST run a production-shaped Supabase stack alongside the web service.
- **FR-002**: The web service MUST default to `CAPSULE_PROVIDER_MODE=supabase`.
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

### Key Entities

- **Compose Supabase Runtime**: The Docker Compose project containing web and Supabase services.
- **Supabase Provider Registry**: The real implementation of Capsule Zero provider ports backed by Supabase.
- **Migration Runner**: One-shot `migrate` service that records applied SQL files in `public.capsule_zero_schema_migrations`.
- **External Provider Gate**: Runtime health/configuration state for Photoroom, Lava.top, marketplace import, Google OAuth, and Apple Sign-In.
- **Runtime Env Template**: Example env files for local, stage, and production Compose operation.

## Success Criteria

- **SC-001**: Feature-memory guard passes for this PR.
- **SC-002**: Repository baseline, API contract, lint, typecheck, build, and tests pass locally and in GitHub Actions.
- **SC-003**: `docker compose --env-file deploy/compose.env.example config` renders successfully.
- **SC-004**: `docker compose --env-file deploy/compose.env.example up -d --build` starts the real stack.
- **SC-005**: `docker compose ps -a` shows every long-lived Supabase/web service healthy and `migrate` exited 0.
- **SC-006**: `/api/health` returns HTTP 200 with `providerMode: "supabase"`, Supabase/storage configured, and external providers pending until secrets exist.
- **SC-007**: A Supabase Auth signup creates a real `public.profiles` row through the trigger.
- **SC-008**: The in-app browser can load `/en` from the rebuilt web image with no console errors.
- **SC-009**: GitHub PR #45 is ready for review, not draft, with green required checks and a fresh Codex review trigger on the final head.
- **SC-010**: AI Review follow-up fixes for session trust, coin debits, and marketplace confirmation links pass local verification and a fresh Codex review cycle.
- **SC-011**: AI Review follow-up fixes for upload asset attachment, purchase credit idempotency, and processed image polling pass local verification and a fresh Codex review cycle.
