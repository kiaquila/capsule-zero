# Spec 053 — Docker Hub Independent Production Build

> **Delivery recovery 2026-10-19 (spec 055):** after three ECR 429 failures, the shared runner helper warms the identical immutable Go OCI index from Google mirror, verifies the module Go version, and tags it under the unchanged ECR FROM reference. No direct Docker Hub fallback, gate removal, or production-daemon change. The immutable digest must be refreshed with a Go-version bump.

## Goal

Remove Docker Hub from web/API production image builds so its rate limits cannot
block a release. The 2026-10-09 full rebuild failed twice with HTTP 429 while
resolving `node:22-bookworm-slim`; the existing-image deployment succeeded.

## Scope

In: existing web/API Dockerfiles, shared GitHub-runner builder setup, required CI
image builds, Go test toolchain image, production workflow verification mode,
baseline guard, delivery docs.

Out: application behavior, runtime versions, production Docker daemon settings,
Compose service images (Postgres/Kratos/nginx), new credentials, retries to Docker
Hub, and deployment or branch-protection bypasses.

## Acceptance Criteria

- **AC-001:** Node 22 Bookworm Slim and Go 1.26.6 Bookworm come from Docker's
  official `public.ecr.aws/docker/library` distribution. API runtime remains the
  existing GCR distroless image. The required Go test toolchain uses the same Go
  version from `api/go.mod`, installed directly through SHA-pinned `actions/setup-go`
  after the spec 054 ECR-quota incident. No production-build source uses Docker Hub.
- **AC-002:** CI and CD use Docker's embedded default BuildKit driver, with
  containerd enabled only on ephemeral Linux GitHub Actions runners. No builder
  container image is downloaded. Multi-stage cache export still works.
- **AC-003:** Full production verification builds both images and exports caches
  to GHCR without using deployment credentials, changing release `:sha-<commit>`, `:prod` or production
  buildcache tags, creating a production deployment, or touching the server.
- **AC-004:** Normal merge deployment retains SHA refs, moving production tags,
  GHCR registry caches, release metadata and server-side verified deployment.
  Changing the shared builder setup is deploy-relevant.
- **AC-005:** Repository guards reject reverting to implicit Docker Hub bases or
  the old container builder; configuration validation and required PR checks pass.

## Negative Scenarios

- Running the setup helper outside a Linux GitHub Actions runner fails before
  inspecting or modifying the Docker daemon.
- Combining `build_only=true` with an existing `image_sha` fails at the gate.
- Verification builds skip SSH/deployment and cannot replace production tags or
  shared caches, including verification on an already released SHA. No fallback to Docker Hub is configured when ECR is unavailable.
- Reintroducing the old base references or container-driver setup fails the
  existing repository baseline guard.

## TDD Posture

Waiver: this change is Dockerfiles, CI/CD wiring, guard tooling and documentation;
it changes no application behavior. Use config validation, negative probes and
real image builds instead of the application failing-test-first loop.

## Sources

- [Docker registry cache requirements](https://docs.docker.com/build/cache/backends/registry/)
- [Docker containerd configuration](https://docs.docker.com/engine/storage/containerd/)
- [AWS official-image distribution example](https://aws.amazon.com/blogs/containers/building-better-container-images/)
- [Failed rebuild](https://github.com/kiaquila/capsule-zero/actions/runs/37990887228)
