# Plan 053 — Docker Hub Independent Production Build

> **Delivery recovery 2026-10-19 (spec 055):** after three ECR 429 failures, the shared runner helper warms the identical immutable Go OCI index from Google mirror, verifies the module Go version, and tags it under the unchanged ECR FROM reference. No direct Docker Hub fallback, gate removal, or production-daemon change. The immutable digest must be refreshed with a Go-version bump.

## Approach

Reuse `app/Dockerfile`, `api/Dockerfile`, the CI image-build step and CD's existing
build/push/cache steps. Change only the Node/Go registry prefix; retain version
arguments, build metadata and the distroless runtime. The required Go vet/test
workflow now installs that same Go version from `api/go.mod` using SHA-pinned
`actions/setup-go` (spec 054), preserving vet/tests while avoiding ECR quotas
for the normal test path, with the same ECR toolchain as a real fallback
if setup-go fails. Production image bases remain on ECR Public.

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

| Criterion | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-001    | [Production verification run 38299019567](https://github.com/kiaquila/capsule-zero/actions/runs/38299019567/job/114977134397), head `943b903625a9b2581a8bf8e7f5b9800704afd7e9`: web/API steps succeeded. Logs resolve `public.ecr.aws/docker/library/node:22-bookworm-slim`, `public.ecr.aws/docker/library/golang:1.26.6-bookworm`, and `gcr.io/distroless/static-debian12:nonroot`; no Docker Hub image source.                                                                                                                                                                                                                           |
| AC-002    | Same job: setup reports `Driver: docker`; both `exporting cache to registry` steps finish successfully. Web cache manifest `sha256:8b998737b6b5d9a3107987d801da30c2749b70b19b878c7955d353bc8729b58f`; API `sha256:e7f336531d2af99c1cc99b0d76c71da80ac3d1997cf30b5b2d66595f12fcf0a5`. `bash -n` and `shellcheck scripts/setup-ci-docker-builder.sh`: exit 0.                                                                                                                                                                                                                                                                                 |
| AC-003    | `node --test scripts/lib/cd-prod-tags.test.mjs`: three tests execute actual workflow metadata and build shell with a stub Docker. On the old workflow, verification fails while both production modes pass; on corrected code, all three pass. Verification pushes only `:verify-<commit>` and isolated cache, never release SHA/prod/shared-cache tags. Corrected hosted build evidence is linked in [PR #155 Validation](https://github.com/kiaquila/capsule-zero/pull/155). Initial run 38299019567 proves skipped deploy jobs and unchanged live release, but its tag-isolation evidence is superseded by the native-review correction. |
| AC-004    | `git diff origin/main -- .github/workflows/cd-prod.yml`: existing SHA refs, revision/build-time arguments, production tags/cache, deploy wrapper and live-release verifier retained; helper added to deploy path gate. Normal production activation remains gated on human merge.                                                                                                                                                                                                                                                                                                                                                           |
| AC-005    | `actionlint .github/workflows/ci.yml .github/workflows/cd-prod.yml`, `node scripts/check-repo-baseline.mjs`, `node scripts/check-feature-memory.mjs --worktree`, Prettier, and `git diff --check`: exit 0. `node --test scripts/lib/*.test.mjs`: 24 passed. [PR #155 head checks](https://github.com/kiaquila/capsule-zero/pull/155/checks) provide the final-head required CI/test/review evidence; merge only once all five required checks pass.                                                                                                                                                                                         |

## Negative-Probe Evidence (2026-10-12)

Temporary PATH stubs executed the actual setup helper: without `GITHUB_ACTIONS=true`
or with `RUNNER_OS=macOS`, exit 1 occurred before any Docker call. With an existing
containerd driver, the only calls were two `docker info` checks, `buildx use default`
and `buildx inspect default`; no restart. The exact jq merge preserved an existing
`log-driver` and feature while adding `containerd-snapshotter`.

Temporary mutations, restored immediately, changed the Node prefix to `FROM node:`,
Go to `FROM golang:`, and CD builder to `--driver docker-container`: the actual
`node scripts/check-repo-baseline.mjs` rejected all three (nonzero exit). A further mutation of the required Go test
image back to implicit `golang:` also exited nonzero. Executing
the actual workflow gate shell with `EVENT=workflow_dispatch BUILD_ONLY=true
IMAGE_SHA=sha-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` exited 1 with
`build_only cannot be combined with image_sha`.

Native review on `38a47b8` found P1 rollback-tag mutation in verification mode.
The corrected workflow publishes only verification refs and has behavioral
regression coverage for verification, main pushes and manual production builds.
The existing CI gate discovers this test through `scripts/lib/*.test.mjs`. Required
checks and native review must pass on the final head before the authorized merge.
