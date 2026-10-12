# Plan 053 — Docker Hub Independent Production Build

## Approach

Reuse `app/Dockerfile`, `api/Dockerfile`, the CI image-build step and CD's existing
build/push/cache steps. Change only the Node/Go registry prefix; retain version
arguments, build metadata and the distroless runtime.

Share ephemeral-runner setup through `scripts/setup-ci-docker-builder.sh`: preserve
the existing daemon JSON, enable containerd if necessary, restart only that runner
daemon, assert the snapshotter and select the embedded default builder. Explicit
`--builder default` prevents Buildx from bootstrapping a Docker Hub image. Do not
apply this helper to the production host or developer Docker daemon.

Use `cd-prod.yml`'s `build_only` manual input to run the exact production build and
GHCR registry-cache exporter on the PR head. Its tags and cache writes are isolated
from production, concurrency is separate, and deployment is excluded. CI also
builds both images with local multi-stage cache export on the embedded driver.

## Verification

| Criterion | Evidence |
| --- | --- |
| AC-001 | `docker buildx imagetools inspect public.ecr.aws/docker/library/node:22-bookworm-slim` and `public.ecr.aws/docker/library/golang:1.26.6-bookworm`: available OCI indices on 2026-10-12; full build evidence pending below. |
| AC-002 | Shell/config lint and GitHub runner cache-export build evidence pending. |
| AC-003 | PR-head `cd-prod.yml` dispatch with `build_only=true`: pending. |
| AC-004 | Workflow diff retains SHA/build-info/GHCR/server verification; normal production activation occurs after human merge. |
| AC-005 | Baseline/negative probes and required GitHub checks pending. |

Update this table with concrete command results and run links before reporting
merge readiness. Production activation remains gated on human review and merge.
