# Tasks 053 — Docker Hub Independent Production Build

> **Delivery recovery 2026-10-19 (spec 055):** after three ECR 429 failures, the shared runner helper warms the identical immutable Go OCI index from Google mirror, verifies the module Go version, and tags it under the unchanged ECR FROM reference. No direct Docker Hub fallback, gate removal, or production-daemon change. The immutable digest must be refreshed with a Go-version bump.

- [x] Inspect fresh GitHub/main and enumerate external build-image dependencies.
- [x] Verify official ECR Node and Go image availability without new credentials.
- [x] Reuse Dockerfiles and existing CI/CD steps; isolate verification publishing.
- [x] Add shared runner-only setup and extend the existing baseline guard.
- [x] Actualize the production build documentation.
- [x] Validate syntax, negative scenarios and real runner builds/cache exports.
- [x] Publish ready PR #155 with linked hosted build evidence.
- [x] Fix native-review P1: verification must never overwrite release SHA tags.
- [x] Add behavioral workflow-shell regression coverage for all three build modes.
- [ ] Verify fresh hosted build, native review and all required final-head checks.
- [ ] Human merge and normal production activation.

## Process Memory

### Dead Ends

- `ghcr.io/moby/buildkit:buildx-stable-1` is not an available upstream distribution
  (anonymous manifest probe returned 403). Do not invent this image reference.
- A separate BuildKit mirror would require artifact provisioning and maintenance.
  The documented embedded Docker driver supports registry caches with containerd
  and removes that bootstrap dependency altogether.
- Docker Hub authentication/retries do not eliminate the IP-level HTTP 429 source.

### Decisions

- Spec 054 live validation hit ECR anonymous data limits in three consecutive
  required Test attempts. Install the same exact `api/go.mod` toolchain through
  SHA-pinned `actions/setup-go`; keep vet/package tests, and keep production image
  bases on ECR. This supersedes only the test-image choice recorded below.

- Keep Node/Go versions and base OS unchanged, using Docker Official Images on ECR
  Public. Keep the existing non-Hub distroless runtime.
- Reuse search: `rg -n 'buildkit|registry.*mirror|NODE_VERSION|GO_VERSION|docker
buildx' .github scripts infra docs_capsule_zero/project/devops` found the existing
  CD setup step but no reusable runner setup; extract that responsibility once for
  CI and CD. Extend `scripts/check-repo-baseline.mjs` for regression detection.
- Verification mode runs the same production steps with isolated tags/cache writes
  and no production environment or SSH. It never overwrites shared `:buildcache`.
- Production Docker configuration and existing GHCR credentials are untouched.
- Native review P1 on `38a47b8`: changing only the secondary tag left a SHA-tag
  write in verification, risking rollback-artifact mutation on existing releases.
  Resolve refs to `verify-<commit>` in that mode and add `:prod` only for releases.
- Reuse check: `scripts/lib/github-actions.test.mjs` tests AI-review rerun selection,
  not build publishing; `rg` found no tag tests. New `cd-prod-tags.test.mjs` runs the
  actual workflow shell with stub Docker through the existing CI test glob. The
  original code fails exactly the verification test, and the corrected code passes
  it while preserving both production modes.
- Final dependency scan found the same Go image in the required test workflow;
  use ECR there too and guard against reintroducing its implicit Hub reference.

### Known Issues

- ECR Public, GCR, GHCR and package registries remain external dependencies; removing
  Docker Hub does not promise immunity to every registry outage.
- Compose service pulls in provisioning/container-smoke checks are outside the
  production web/API build change; this is not a repository-wide Hub migration.
- Initial verification run 38299019567 proved successful image/cache publishing
  and skipped deploy jobs; the subsequent SHA-tag finding supersedes its tag
  isolation evidence. Corrected hosted run is linked in PR #155 Validation.
- Required final-head checks/native review remain the merge gate; production
  changes take effect only after human merge.
