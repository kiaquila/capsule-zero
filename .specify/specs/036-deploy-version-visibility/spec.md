# Spec 036 — Deploy Version Visibility (baked build SHA + verified GitHub deployment)

## Goal

Make it possible to answer "what release is live on `capsulezero.app` right now, and did
the last merge actually reach prod?" **from GitHub and from a single `curl`**, without
SSH-ing to the server. The running commit is stamped into the images at build time,
surfaced live by `/api/health`, and the CD pipeline records a **verified** GitHub
Deployment under a `production` environment — verified meaning the pipeline reads the
running commit back from the public edge and only marks the deployment successful when it
matches the SHA it just shipped.

**Context.** Today the only ways to know the deployed release are `ssh cz "docker ps"`
(image tag) or reading the last green `cd-prod` run's SHA. `/api/health` returns only
`{ok, postgres, kratos}` with no version; the images carry an empty
`org.opencontainers.image.revision` label; and a green `cd-prod` run proves
`compose up` returned 0, not that the new image is actually answering HTTP. Semver /
GitHub Releases are intentionally **out of scope** for this slice (founder, 2026-07-06) —
this is about truthful "what's live", not human-facing version names.

## Scope

### In

- **API build info (application code, TDD):** link-time `main.commit` / `main.buildTime`
  vars (default `"unknown"`), surfaced by `GET /api/health` as `commit` + `builtAt`
  alongside the existing `ok`/`postgres`/`kratos` fields. A blank var reads back as
  `"unknown"`, never empty. Failing test committed first (`api/cmd/api/health_test.go`).
- **Image stamping (infra):** `api/Dockerfile` injects the SHA/time via
  `-ldflags -X`; both `api/Dockerfile` and `app/Dockerfile` set the standard OCI
  `org.opencontainers.image.revision` label from a `GIT_SHA` build-arg.
- **CD wiring (infra):** `cd-prod.yml` passes `GIT_SHA=${github.sha}` (and `BUILD_TIME`)
  as build-args to both builds; the `deploy` job runs under a job-level
  `environment: production` (records the GitHub Deployment + Environments widget) and adds
  a **Verify live release** step that polls `https://capsulezero.app/api/health` and fails
  the job on a concrete SHA mismatch.
- **Docs actualization in the same change:** `docs_capsule_zero/project/devops/prod-cd-pipeline.md`
  (version endpoint, verified deployment, `production` environment), this spec folder.

### Out (tracked as follow-ups in `tasks.md`)

- **Semver / GitHub Releases** — deferred; SHA is the deploy identity for now.
- **Web-side live version surface** (`X-App-Revision` header / `/version` route) — the web
  image gets the OCI label for parity, but a public web endpoint waits until the header
  slice; the API `/api/health` commit is authoritative for verification because web+api
  always deploy from the same commit.
- **Drift watchdog** — a scheduled workflow that curls `/api/health` and alerts when prod
  diverges from `origin/main` between deploys.

## Acceptance Criteria

1. `GET /api/health` returns `commit` (40-hex on a stamped build) and `builtAt` next to the
   existing fields; the response stays `200` when healthy.
2. Both prod images carry `org.opencontainers.image.revision = <git-sha>`, and the api
   binary reports that same SHA at `/api/health`.
3. On a normal merge deploy, the `cd-prod` `deploy` job records a `production` GitHub
   Deployment for the merged commit, and the repo's Environments/Deployments view shows it.
4. **(Negative)** If the live `/api/health` commit is a concrete value other than the SHA
   being deployed, the **Verify live release** step fails the `deploy` job, so the
   `production` deployment is marked *failure* — a green/active production deployment can
   never point at a stale or wrong release. A missing/`"unknown"` commit (pre-036 rollback
   image) degrades to a warning and defers to the deploy wrapper's own health smoke,
   rather than red-flagging a legitimate rollback.
