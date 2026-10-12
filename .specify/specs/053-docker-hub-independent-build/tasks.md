# Tasks 053 — Docker Hub Independent Production Build

- [x] Inspect fresh GitHub/main and enumerate external build-image dependencies.
- [x] Verify official ECR Node and Go image availability without new credentials.
- [x] Reuse Dockerfiles and existing CI/CD steps; isolate verification publishing.
- [x] Add shared runner-only setup and extend the existing baseline guard.
- [x] Actualize the production build documentation.
- [x] Validate syntax, negative scenarios and real runner builds/cache exports.
- [x] Publish ready PR #155 with linked hosted build evidence.
- [ ] Resolve review findings and verify all required final-head checks.
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

- Keep Node/Go versions and base OS unchanged, using Docker Official Images on ECR
  Public. Keep the existing non-Hub distroless runtime.
- Reuse search: `rg -n 'buildkit|registry.*mirror|NODE_VERSION|GO_VERSION|docker
  buildx' .github scripts infra docs_capsule_zero/project/devops` found the existing
  CD setup step but no reusable runner setup; extract that responsibility once for
  CI and CD. Extend `scripts/check-repo-baseline.mjs` for regression detection.
- Verification mode runs the same production steps with isolated tags/cache writes
  and no production environment or SSH. It never overwrites shared `:buildcache`.
- Production Docker configuration and existing GHCR credentials are untouched.
- Final dependency scan found the same Go image in the required test workflow;
  use ECR there too and guard against reintroducing its implicit Hub reference.

### Known Issues

- ECR Public, GCR, GHCR and package registries remain external dependencies; removing
  Docker Hub does not promise immunity to every registry outage.
- Compose service pulls in provisioning/container-smoke checks are outside the
  production web/API build change; this is not a repository-wide Hub migration.
- Production verification run 38299019567 succeeded: both images and registry
  caches published; deploy jobs skipped; live SHA and Deployment record unchanged.
- Required final-head checks/native review remain the merge gate; production
  changes take effect only after human merge.
