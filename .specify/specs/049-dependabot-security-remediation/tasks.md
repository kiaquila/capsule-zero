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
- [x] Rebase PR #107 on the latest `origin/main`, inventory every direct npm delta, and
  remove the frozen Supabase update from its manifest and lockfile subgraph.
- [x] Run clean installs, the frozen-Supabase structural comparison, and full preflight
  for PR #107 before requesting the head-bound Codex review.

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
- Dependabot's PR #107 grouped the frozen `@supabase/supabase-js` package with active
  minor/patch dependencies. Accepting the generated branch unchanged would have
  extended the retired provider, so its complete npm subgraph was restored from
  `origin/main` before verification.
- The first post-upgrade local suite lacked Playwright 1.62's browser binaries and all
  browser launches failed immediately. After installing the matching Chromium/WebKit
  revisions, 77 tests passed and one WebKit profile test exposed the same pre-hydration
  lost-click race already handled by the cookie-banner page object.

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
- The V7 merge-readiness evidence now targets PR #100, so its SHA, required checks,
  merge state, and review-thread assertions cover the policy change being merged rather
  than the already merged PR #97 that originally introduced spec 049.
- PR #107 keeps the grouped active npm refresh but excludes every `@supabase/*` lockfile
  entry. Context7 confirms Next.js 16.3 remains compatible with the repository's CI
  Node 20, production Node 22, and React 19 runtime boundaries.
- Next.js 16.3 intentionally generates version-matched `app/AGENTS.md` and
  `app/CLAUDE.md` when an agent runs `next dev`; upstream documentation recommends
  tracking them, so the generated files are committed instead of disabling the feature
  or accepting a permanently dirty worktree.
- The profile page object reuses the established cookie-banner two-attempt hydration
  retry instead of creating a second helper abstraction. The previously flaky WebKit
  scenario passed five concurrent repetitions after the change.
- Final CI-mode preflight completed with 77 passed and 8 intentionally skipped browser
  scenarios. The existing productivity-metrics scenario timed out once and passed on
  its configured retry; no dependency-refresh failure remained.
- V7 now targets PR #107 because it is the current head using this feature memory; the
  original policy implementation in PR #100 is already merged.

### Known Issues

- Major npm updates remain separate PRs and require their own compatibility evidence;
  they are not covered by the PR #107 minor/patch refresh.
