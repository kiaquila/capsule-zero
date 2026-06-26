# Feature Specification: Docker Compose Stage And Production Deploy

**Feature Branch**: `codex/docker-compose-prod-stage`
**Created**: 2026-06-26
**Status**: Ready for PR verification
**Input**: User description: "Prepare a separate branch and PR where we make the Docker image universal for deploying our app via docker-compose up on stage and prod."

## Goal

Capsule Zero operators can run the web app on staging or production VMs with one production Docker image and one Docker Compose service, using environment files to switch domains, ports, image tags, and provider credentials without changing application code.

## Scope

In scope:

- Add a production Dockerfile for the Next.js web app using Next standalone output.
- Enable standalone output in Next.js config.
- Add a deployment-oriented `docker-compose.yml` that builds or pulls the same web image for staging and production.
- Add Compose and runtime env templates for staging and production.
- Add deploy documentation for one-command VM usage, healthchecks, image reuse, and production boundaries.
- Add CI coverage that builds the Docker image.
- Keep real secrets out of git and ignore the generated `deploy/runtime.env`.

Out of scope:

- Self-hosting Supabase, object storage, OAuth, Lava.top, Photoroom, remove.bg, or pgvector services in this Compose file.
- Implementing the real Supabase provider path. On current `main`, `CAPSULE_PROVIDER_MODE=mock` remains the only runnable mode.
- Provisioning a DigitalOcean VM, DNS, TLS proxy, load balancer, registry credentials, or production secrets.
- Creating a deployment automation pipeline beyond Docker image build coverage in CI.

## User Scenarios & Testing

### User Story 1 - Build A Deployable Web Image (Priority: P1)

An operator can build a production image from the repository and run the generated Next standalone server inside a container.

**Independent Test**: Run `docker build --target runner -t capsule-zero-web:local ./app` and verify the build succeeds.

**Acceptance Scenarios**:

1. **Given** the repository is checked out on a VM, **When** Docker builds `app/Dockerfile`, **Then** the final image contains the standalone server, `public`, and `.next/static` assets.
2. **Given** the container starts, **When** it runs the default command, **Then** it serves the Next app on `HOSTNAME=0.0.0.0` and `PORT=3000` unless overridden.

### User Story 2 - Run Stage Or Prod With Compose (Priority: P1)

An operator can prepare env files once and run the app with the same Compose command on staging or production.

**Independent Test**: Copy an example runtime env into `deploy/runtime.env`, run `docker compose up -d --build`, and verify `/api/health` returns HTTP 200.

**Acceptance Scenarios**:

1. **Given** `.env` and `deploy/runtime.env` exist on a VM, **When** `docker compose up -d --build` runs, **Then** the web service builds or reuses the configured image and starts with `restart: unless-stopped`.
2. **Given** the operator chooses staging or production, **When** they copy the matching runtime env example, **Then** no Compose file changes are required.
3. **Given** a reverse proxy terminates TLS on the host, **When** the default Compose settings are used, **Then** the web container binds only to `127.0.0.1:3000`.

### User Story 3 - Understand Production Boundaries (Priority: P2)

An operator can tell which parts are production-ready Docker packaging and which parts remain integration gates.

**Independent Test**: Read `docs_capsule_zero/project/devops/docker-compose-deploy.md` and confirm it names the web-only runtime, mock provider limit, env handling, reverse proxy requirement, and registry-image option.

**Acceptance Scenarios**:

1. **Given** real credentials are not available, **When** staging or production env files are prepared, **Then** examples keep provider mode on `mock` and keep external provider values clearly marked as mock or placeholders.
2. **Given** a real production launch is planned, **When** the deploy doc is followed, **Then** it requires TLS/proxy, metrics/log retention, canonical backups, and provider integration gates outside the web container.

## Negative Scenarios

1. **Given** `deploy/runtime.env` contains real secrets, **When** `git status` runs, **Then** the file is ignored and cannot be staged accidentally by default.
2. **Given** current `main` does not implement the real Supabase provider, **When** an operator sets `CAPSULE_PROVIDER_MODE=supabase`, **Then** the app fails the provider gate instead of pretending to be production-backed.
3. **Given** no runtime env file exists, **When** Compose is evaluated, **Then** Compose fails fast instead of silently launching with missing secrets.

## Requirements

### Functional Requirements

- **FR-001**: The app MUST build a production Docker image from `app/Dockerfile`.
- **FR-002**: The Docker image MUST run the Next standalone `server.js` output, not `next dev`.
- **FR-003**: `next.config.ts` MUST enable `output: "standalone"`.
- **FR-004**: The final image MUST copy `public`, `.next/standalone`, and `.next/static`.
- **FR-005**: `docker-compose.yml` MUST support a stage/prod web service using env-driven image, env-file, host bind, host port, and container port settings.
- **FR-006**: The Compose service MUST include a restart policy and healthcheck against `/api/health`.
- **FR-007**: Stage and production env examples MUST include all runtime env groups required by `scripts/check-runtime-env.mjs`.
- **FR-008**: Real runtime env files containing secrets MUST be ignored by git.
- **FR-009**: Documentation MUST describe one-command startup, registry image reuse, healthcheck behavior, and production boundaries.
- **FR-010**: CI MUST build the Docker image so regressions are caught before merge.

### Key Entities

- **Web Docker Image**: Production container artifact built from `app/Dockerfile`.
- **Compose Runtime**: `docker-compose.yml` service definition for the web image.
- **Runtime Env File**: `deploy/runtime.env`, copied from the staging or production example and ignored by git.
- **Compose Env File**: Root `.env`, copied from `deploy/compose.env.example`, used for Compose interpolation.

## Success Criteria

- **SC-001**: `npm run check:feature-memory -- --worktree` passes.
- **SC-002**: `npm run check:repo`, `npm run check:api-contract`, `npm run lint`, `npm run typecheck`, and `npm run build` pass.
- **SC-003**: `npm run check:runtime-env -- --env deploy/stage.env.example --allow-placeholders` and the equivalent production command pass.
- **SC-004**: `docker build --target runner -t capsule-zero-web:local ./app` passes.
- **SC-005**: `docker compose --env-file deploy/compose.env.example config` passes when `CAPSULE_RUNTIME_ENV_FILE=./deploy/stage.env.example` is supplied.
- **SC-006**: `docker compose up -d --build web` starts the service with a prepared `deploy/runtime.env`.
- **SC-007**: `curl http://127.0.0.1:<test-port>/api/health` returns HTTP 200 from the Compose service.
- **SC-008**: `git check-ignore -v deploy/runtime.env` confirms generated runtime secrets are ignored.
