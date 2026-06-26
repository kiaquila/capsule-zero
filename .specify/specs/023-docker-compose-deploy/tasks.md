# Tasks: Docker Compose Stage And Production Deploy

**Input**: `.specify/specs/023-docker-compose-deploy/spec.md`, `plan.md`

## Phase 1: Setup

- [x] T001 Refresh GitHub state with `git fetch --all --prune`.
- [x] T002 Confirm `gh` is installed and authenticated.
- [x] T003 Create clean worktree branch `codex/docker-compose-prod-stage` from `origin/main`.
- [x] T004 Fetch current Next.js standalone Docker deployment documentation through Context7.
- [x] T005 Inspect existing app package, Next config, env examples, provider registry, health route, runtime env checker, and deploy docs.

## Phase 2: Implementation

- [x] T006 Enable `output: "standalone"` in `app/next.config.ts`.
- [x] T007 Add `app/Dockerfile` with deps, builder, and non-root standalone runner stages.
- [x] T008 Add `app/.dockerignore` for smaller and safer build contexts.
- [x] T009 Add `docker-compose.yml` for production-oriented web runtime.
- [x] T010 Add Compose interpolation and stage/prod runtime env examples.
- [x] T011 Ignore generated `deploy/runtime.env` secrets in git.
- [x] T012 Add Docker Compose deployment docs.
- [x] T013 Link deploy docs from Sprint 0 runtime provisioning and backend docs.
- [x] T014 Add Docker image build coverage to CI.
- [x] T015 Add SENAR feature memory package.

## Phase 3: Verification

- [x] T016 Install root dependencies with `npm ci --ignore-scripts`.
- [x] T017 Install app dependencies with `npm ci --prefix app`.
- [x] T018 Run runtime env validation for stage/prod examples.
- [x] T019 Run Compose config validation with the stage env example.
- [x] T020 Run `git check-ignore -v deploy/runtime.env`.
- [x] T021 Run `npm run check:feature-memory -- --worktree`.
- [x] T022 Run `npm run check:repo`.
- [x] T023 Run `npm run check:api-contract`.
- [x] T024 Run `npm run lint`.
- [x] T025 Run `npm run typecheck`.
- [x] T026 Run `npm run build`.
- [x] T027 Run `docker build --target runner -t capsule-zero-web:local ./app`.
- [x] T028 Prepare ignored `deploy/runtime.env` from the stage example and run `docker compose up -d --build web`.
- [x] T029 Verify `/api/health` returns HTTP 200 from the Compose service.
- [x] T030 Run `git diff --check`.
- [ ] T031 Commit, push, and open a draft PR.

## Process Memory

### Dead Ends

- The active repository worktree contained many unrelated modified and untracked files, so this PR was created from a clean sibling worktree instead of staging from the dirty checkout.
- `docker compose --env-file deploy/compose.env.example config` failed when `deploy/runtime.env` did not exist. This is intentional fail-fast behavior for real deploys; validation uses `CAPSULE_RUNTIME_ENV_FILE=./deploy/stage.env.example`.
- The first feature-memory guard failed because app product paths changed before this `.specify/specs/023-docker-compose-deploy` package existed.

### Decisions

- Keep `docker-compose.yml` production-oriented. Local hot-reload/dev runtime is a separate concern.
- Bind the web service to `127.0.0.1:3000` by default so TLS/public ingress can be handled by a host proxy or load balancer.
- Use one image and one Compose service for stage and prod; env files carry environment-specific domains, ports, image tags, and provider values.
- Keep runtime examples on `CAPSULE_PROVIDER_MODE=mock` because current `main` still gates real Supabase mode.
- Fail fast if `deploy/runtime.env` is missing so production does not start with incomplete secret configuration.
- Avoid BuildKit-only Dockerfile cache mounts so VM Docker builds have fewer compatibility assumptions.

### Known Issues

- This PR does not publish a registry image or configure GHCR/DigitalOcean Container Registry credentials.
- This PR does not provision TLS, DNS, reverse proxy config, monitoring, log retention, or VM backups.
- `CAPSULE_PROVIDER_MODE=supabase` is still intentionally unavailable on current `main`; real provider deployment requires a later integration-gate PR.
