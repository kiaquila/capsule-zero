# Tasks 049 — Dependabot Security Remediation

## Tasks

- [x] Refresh GitHub and inventory all tracked dependency manifests and directories.
- [x] Enable Dependency Graph, Dependabot Alerts, and Dependabot Security Updates.
- [x] Add and validate the complete Dependabot version-update configuration.
- [x] Reproduce the required OSV failure and identify the vulnerable npm transitive
  packages and fixed versions.
- [x] Update only the affected app overrides and the corresponding npm lockfile records.
- [x] Prove clean npm installs, zero npm audit findings, and a clean OSV v2.3.5 scan.
- [x] Pass the full local preflight in CI mode.
- [x] Record the required GitHub checks and head-bound native Codex review as the
  external merge-readiness criteria in the verification plan.

## Process Memory

### Dead Ends

- The local Docker CLI was installed but its daemon was not running, so the workflow's
  OSV container could not start. Running the identical OSV Scanner v2.3.5 release from
  its official Go module provided the equivalent recursive scan without changing the
  repository.
- The first AI Review gate timed out because no native Codex review had been requested
  for that head. A maintainer-authored `@codex review` comment is required after each
  pushed fix series so the wake-up workflow can restart the head-bound gate.
- An unconstrained local Playwright run timed out while waiting for two existing UI
  elements. Both scenarios passed immediately in isolated runs, and the full preflight
  then passed with the CI worker/retry policy (78 passed, 8 intentionally skipped).

### Decisions

- The frozen `docker-compose.legacy-supabase.yml` is explicitly excluded from the
  Docker Compose update block; active root compose files remain covered.
- Existing app overrides for `fast-uri`, `js-yaml`, and `postcss` move only to their
  first safe compatible releases. `brace-expansion` and `nanoid` are updated within
  their existing parent ranges in the lockfiles.
- No OSV ignore or audit suppression is added. The security gate must pass on the real
  dependency graph.
- After the first native review, each external-setting and Dependabot policy row gained
  an exact executable verification command instead of a prose-only evidence summary.
- After the second native review, the external merge-readiness row gained a command that
  binds GitHub check, merge-state, and unresolved-thread evidence to `git rev-parse HEAD`.
- PR #100 keeps the populated production database on PostgreSQL 16 and adds the sole
  version-policy exception: Docker Compose `postgres` semver-major updates are ignored
  until a dedicated migration spec supplies a tested upgrade/rollback/restore procedure.
  Minor and patch grouping remains unchanged. The V2 command asserts both the exact
  exception and the absence of any other ignore entries, so policy drift fails closed.

### Known Issues

- Dependabot may open version-update pull requests only after this configuration reaches
  the default branch; repository security updates are already enabled independently.
