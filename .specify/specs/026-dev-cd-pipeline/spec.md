# Spec 026 — Dev Continuous Deployment Pipeline

## Goal

Every merge to `main` that changes application or delivery-relevant code automatically
builds a fresh web Docker image, publishes it to GitHub Container Registry (GHCR), and
deploys it to the **dev** environment at `https://dev.capsulezero.app`. Merges that touch
only documentation, tests, or other non-deploy paths must **not** trigger a deploy.

The dev environment runs on the **same DigitalOcean droplet** as production but as a
**separate, isolated `docker-compose` project** (`capsule-zero-dev`) with its **own nginx**
and its **own TLS certificate**, so dev traffic, config, and a broken merge can never affect
production.

## Scope

### In

- A GitHub Actions workflow (`.github/workflows/cd-dev.yml`) triggered on `push` to `main`
  and `workflow_dispatch`.
- A change-gate that deploys only when deploy-relevant paths changed
  (`app/**`, `web/**`, `api/**`, `worker/**`, `infra/**`, `docker-compose.yml`,
  `docker-compose.dev-server.yml`, lockfiles, the workflow itself).
- Build + push of the web image to `ghcr.io/kiaquila/capsule-zero-web`, tagged immutably by
  commit SHA (`sha-<gitsha>`) plus a moving `:dev` tag.
- SSH-based deploy that pulls the SHA-pinned image on the droplet and rolls the
  `capsule-zero-dev` stack via `docker compose pull && up -d`.
- A self-contained dev compose file (`docker-compose.dev-server.yml`) with a dedicated
  `nginx` (host port `8443`) and `web` service (image pulled from GHCR, no on-droplet build).
- A dev nginx vhost (`infra/nginx/conf.d.dev-server/dev.capsulezero.conf`) for
  `server_name dev.capsulezero.app`.
- A `workflow_dispatch` rollback path: redeploy any prior `sha-<gitsha>` tag without rebuilding.
- An operator runbook covering Cloudflare wiring, the deploy SSH user, GHCR pull auth, and
  the dev TLS certificate (issue + renew).

### Out

- Production auto-deploy. Prod stays manually promoted; this spec only automates **dev**.
- Issuing the dev TLS certificate itself (a one-time operator action documented in the
  runbook, run on the droplet — secrets never touch CI).
- Provisioning the droplet, the `deploy` unix user, the Cloudflare DNS record/Origin Rule, or
  the GHCR pull token — these are one-time operator steps in the runbook.
- The Go API / worker / Postgres / Kratos services — they join the dev stack when
  `.specify/specs/024-production-stack-runtime/` ships them; this spec ships web + nginx only.
- Building on the droplet (rejected — see `tasks.md` Dead Ends).

## Negative Scenarios

- **Docs/tests-only merge does not deploy.** A merge to `main` that touches only
  `docs_capsule_zero/**`, `**/*.md`, `tests/**`, or `.specify/**` leaves the change-gate
  `run=false`; no image is built and no deploy runs, and the workflow still reports success
  (green, skipped) so branch protection is not blocked.
- **A broken dev deploy cannot reach production.** The dev stack is a separate compose
  project with its own nginx on host port `8443`; an unhealthy `web` or invalid dev nginx
  config fails the deploy job and leaves the prod stack (nginx `:443`) untouched.
- **Unhealthy image is not silently accepted.** If the freshly deployed `web` container does
  not reach `healthy`, or the origin smoke check against the dev nginx fails, the deploy job
  exits non-zero and surfaces container logs.

## TDD waiver

This spec is entirely infrastructure and delivery wiring (GitHub Actions workflow, Docker
Compose, nginx config, deploy scripts, docs). Per Constitution VII (Test-First Verification,
amended v1.3), the failing-test-first loop applies to application code only. Verification for
this spec is layer-appropriate — `docker compose config`, `nginx -t`, the workflow's own
post-deploy health/smoke gate, and the linked successful `main` run — recorded in
`plan.md` → `## Verification`. The required `test` check does not gate infra-only changes.
