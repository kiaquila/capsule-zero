# Plan 036 — Deploy Version Visibility

## Approach

Two layers, one PR:

1. **Ground truth in the artifact.** The running commit must come from the binary itself,
   not from what the pipeline *believes* it deployed. The Go API is built with
   `-ldflags "-X main.commit=<sha> -X main.buildTime=<rfc3339>"`; `main` exposes those as
   package vars (default `"unknown"`) and `/api/health` echoes them. This reuses the
   existing health handler and its dependency-probe body — no new endpoint, no new package
   (Engineering Reuse Rule): version is build-time metadata, not config, so it lives next
   to `main` rather than in `internal/config`.

2. **Truthful reflection into GitHub.** The `deploy` job gets a job-level
   `environment: production`, which makes GitHub create a Deployment for the run's commit
   and render the Environments widget on the repo home + the Deployments page. Because a
   job-environment's deployment status follows the *job* conclusion, a final **Verify live
   release** step that reads `/api/health` back through the public edge and fails on a
   concrete SHA mismatch is what makes "active" mean "verified against the running server",
   not merely "`compose up` exited 0". The deploy wrapper already smoke-checks
   `/api/health` for `200`; this adds the SHA equality check the wrapper does not do.

Both images also get the standard `org.opencontainers.image.revision` OCI label (it was
empty before this change) so `docker inspect` / GHCR show the source commit without booting
the container.

### Rollback tolerance

`workflow_dispatch` redeploy of a pre-036 `image_sha` serves a binary with no build info
(`commit = "unknown"`). The verifier treats an `"unknown"` commit as "cannot assert
— warn and defer to the wrapper's health smoke", and hard-fails on a *concrete
different* commit. This keeps the guarantee (a wrong live release fails the job) without
red-flagging legitimate rollbacks to images built before this feature.

The tolerance is gated on evidence (Codex P1 fix): it applies only after at least one
attempt returned parseable health JSON. If all 10 attempts fail at the transport/HTTP
layer or return non-JSON (edge down, timeout, nginx error page), the step exits 1 — an
unreadable prod is a failed verification, never a silent pass. `curl` runs without `-f`
by design: a degraded 503 still carries build info, and healthiness itself is owned by
the deploy wrapper's smoke check — this step asserts release identity only.

## Verification

| # | Acceptance criterion | Evidence |
|---|---|---|
| 1 | `/api/health` reports `commit` + `builtAt`, stays 200 when healthy | `go test ./cmd/api/` — `TestHealthHandlerReportsBuildInfo` PASS (failing-first commit `87cb81f` → green after impl) |
| 2 | Images carry the revision label; api binary reports the same SHA | `docker build --build-arg GIT_SHA=deadbeefcafe … && docker inspect --format '{{index .Config.Labels "org.opencontainers.image.revision"}}'` → `deadbeefcafe`; `strings` of the extracted `/api` binary contains `deadbeefcafe` + the build time (recorded in PR) |
| 3 | Merge deploy records a `production` GitHub Deployment for the merged commit | Post-merge `cd-prod` run shows the `deploy` job under `environment: production`; repo Environments/Deployments page shows the commit as Active (screenshot/link in PR) |
| 4 | **(Negative)** live commit ≠ deployed SHA fails the job → deployment marked failure; `"unknown"` degrades to warning; unreadable health fails | `go test` — `TestHealthHandlerBuildInfoWhenUninjectedAndDegraded` PASS (503 still carries `"unknown"`, never blank); verify-step script extracted from `cd-prod.yml` and run against 5 mocked-`curl` scenarios: transport failure → `exit 1`, non-JSON body → `exit 1`, pre-036 `{"ok":true}` → `::warning::` + `exit 0`, SHA match → `exit 0`, concrete mismatch → `exit 1` (recorded in PR) |
| 5 | `/api/health` contract stays in sync: OpenAPI + generated client expose `commit`/`builtAt` | `docs_capsule_zero/adr/openapi.yaml` — `getHealth` → `HealthResponse` (200 + 503); `npm run generate:api` regenerated `app/src/lib/api/generated/openapi.ts`; `npm run check:api-contract` PASS (52 operations) |

## Negative scenario

Covered by AC #4: a concrete mismatch between the running `/api/health` commit and the
deployed SHA hard-fails the `deploy` job (production deployment → failure), and an
un-injected build reports `"unknown"` rather than an empty field even on a degraded 503.
