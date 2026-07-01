# Spec 026 — Dev Continuous Deployment Pipeline

## Goal

Every merge to `main` that changes application or delivery-relevant code automatically
builds a fresh web Docker image, publishes it to GitHub Container Registry (GHCR), and
deploys it to the **dev** environment at `https://dev.capsulezero.app`. Merges that touch
only documentation, tests, or other non-deploy paths must **not** trigger a deploy.

The dev environment runs on the **same DigitalOcean droplet** as production but as a
**separate, isolated `docker-compose` project** (`capsule-zero-dev`). A single **host
(systemd) nginx** — not in Docker, no Cloudflare — is the sole TLS edge for both prod and
dev, reverse-proxying plain HTTP to the web containers published on loopback (prod
`127.0.0.1:3000`, dev `127.0.0.1:3001`). Dev has its **own TLS certificate**, separate from
prod. Routine app deploys only recreate the dev web container behind a stable proxy target;
host-nginx config changes are applied explicitly with `nginx -t` before reload.

## Scope

### In

- A GitHub Actions workflow (`.github/workflows/cd-dev.yml`) triggered on `push` to `main`
  and `workflow_dispatch`.
- A change-gate that deploys only when deploy-relevant paths changed
  (`app/** api/** worker/** infra/** docker-compose.yml docker-compose.dev-server.yml`,
  lockfiles, the workflow itself). `web/**` is intentionally absent because `/app` is the
  canonical web frontend.
- Build + push of the web image to `ghcr.io/kiaquila/capsule-zero-web`, tagged immutably by
  commit SHA (`sha-<gitsha>`) plus a moving `:dev` tag.
- SSH-based deploy that lets the unprivileged CI `deploy` user run only the root-owned
  `/usr/local/sbin/capsule-zero-dev-deploy` wrapper, which pulls the SHA-pinned image on the
  droplet and rolls the `capsule-zero-dev` stack via `docker compose pull && up -d`.
- A self-contained dev compose file (`docker-compose.dev-server.yml`) with a single `web`
  service (image pulled from GHCR, no on-droplet build) published on `127.0.0.1:3001`.
- A frontend-only dev runtime contract: `/opt/capsule-zero-dev/.env.dev` is used only as
  `docker compose --env-file` interpolation input for `APP_BASE_URL`; it is **not** attached
  as a service-level `env_file`, and no `CAPSULE_PROVIDER_MODE`, `SUPABASE_*`, or
  `SESSION_SIGNING_SECRET` values are injected into the dev `web` container.
- Host-nginx vhosts in `infra/nginx-host/` (prod → 3000, dev → 3001) plus the prod compose
  change that publishes web on loopback and gates the retired in-docker nginx behind a
  `docker-edge` profile.
- A `workflow_dispatch` rollback path: redeploy any prior `sha-<gitsha>` tag without rebuilding.
- An operator runbook covering the host-nginx install + prod cutover, the deploy SSH user,
  root-owned wrapper/checkout, GHCR pull auth, interpolation-only `.env.dev`, and the dev TLS
  certificate (issue + renew).

### Out

- Production auto-deploy. Prod stays manually promoted; this spec only automates **dev**.
- The one-time operator actions themselves (host-nginx install, prod edge cutover, deploy
  user, GHCR pull token, dev TLS cert issuance) — documented in the runbook, run on the
  droplet; secrets never touch CI.
- The Go API / worker / Postgres / Kratos services — they join the dev stack when
  `.specify/specs/024-production-stack-runtime/` ships them; this spec ships the web service
  behind the host nginx only.
- Building on the droplet (rejected — see `tasks.md` Dead Ends).

## Negative Scenarios

- **Docs/tests-only merge does not deploy.** A merge to `main` that touches only
  `docs_capsule_zero/**`, `**/*.md`, `tests/**`, or `.specify/**` leaves the change-gate
  `run=false`; no image is built and no deploy runs, and the workflow still reports success
  (green, skipped) so branch protection is not blocked.
- **A broken app deploy cannot reach production.** The dev stack is a separate compose
  project; the host nginx proxies prod and dev to different loopback ports. An unhealthy dev
  `web` fails the deploy job before host-nginx reload and leaves prod (`127.0.0.1:3000`)
  serving through the existing nginx config.
- **Unhealthy image is not silently accepted.** If the freshly deployed dev `web` container
  does not reach `healthy`, or the loopback / host-nginx smoke check fails, the deploy job
  exits non-zero and surfaces container logs.
- **Stale provider env cannot recouple dev.** If an existing droplet `.env.dev` still
  contains old `CAPSULE_PROVIDER_MODE`, `SUPABASE_*`, or `SESSION_SIGNING_SECRET` keys from
  the previous runbook, those keys are not passed into the runtime container because
  `docker-compose.dev-server.yml` has no service-level `env_file`; the wrapper uses
  `.env.dev` only for Compose interpolation.
- **Shared nginx reload must prove prod and dev still route.** If `infra/nginx-host/**`
  changed, the deploy job reloads host nginx only after `nginx -t`, smokes
  `https://capsulezero.app/en` through loopback-resolved TLS, and keeps the old config backup
  available through the dev edge smoke. If either the prod or dev smoke fails, the deploy
  wrapper restores the previously installed host-nginx config and reloads it before exiting
  non-zero.
- **Leaked CI SSH key cannot directly control Docker or prod.** The `deploy` user is not in
  the Docker group, does not own `/opt/capsule-zero-dev`, and has passwordless sudo only for
  the root-owned deploy wrapper, which validates the image ref, SHA, and nginx-sync mode
  before running the dev rollout.
- **Failed app deploy does not hide pending nginx config.** The wrapper compares
  `infra/nginx-host/**` against the last successful nginx sync marker, not the current dev
  checkout HEAD, and updates that marker only after the deploy smokes pass.

## TDD waiver

This spec is entirely infrastructure and delivery wiring (GitHub Actions workflow, Docker
Compose, host nginx config, deploy scripts, docs). Per Constitution VII (Test-First
Verification, amended v1.3), the failing-test-first loop applies to application code only.
Verification for this spec is layer-appropriate — `docker compose config`, `nginx -t`,
`actionlint`, and the post-deploy health/smoke gate plus live `curl` against both edges —
recorded in `plan.md` → `## Verification`. The required `test` check does not gate infra-only
changes.
