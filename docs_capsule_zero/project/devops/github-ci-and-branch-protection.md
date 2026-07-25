# GitHub CI And Branch Protection

GitHub is the control plane for pull requests, required checks, deployments, and dependency security signals.

## Required Workflows

- `ci.yml`: runs repository baseline validation, app typecheck, app build, and optional app tests as the required `baseline-checks` job.
- `pr-guard.yml`: enforces feature-memory coverage for product-root changes (`app/`, `api/`, `worker/`, `web/`, `mobile/`) and validates baseline files as the required `guard` job.
- `ai-review.yml`: runs on GitHub-hosted `ubuntu-latest` and validates native Codex review for the current PR head as the required `AI Review` job.
- `test.yml`: runs e2e lint, e2e typecheck, `/app` build, and Playwright browser tests as the required `test` job.
- `osv-scan.yml`: scans dependencies for known vulnerabilities on pull requests, pushes to `main`, weekly schedule, and manual dispatch as the required `osv-scan` job.

## Required Checks

Branch protection for `main` must require:

- `baseline-checks`
- `guard`
- `AI Review`
- `test`
- `osv-scan`

`osv-scan` is a fail-closed dependency-security gate. A reported known vulnerability blocks merge
until the dependency is fixed. When no compatible fixed release exists, an authorized maintainer may
accept a narrowly scoped `PackageOverrides` exception in an `osv-scanner.toml` beside the affected
lockfile. The exception must name the exact package version and ecosystem, explain runtime
reachability and why an upgrade is unavailable, and carry a short `effectiveUntil` review date.
Broad vulnerability-ID ignores, unversioned package ignores, and severity/workflow weakening do not
satisfy this policy.

## Fail-Closed Rules

- Required gate scripts run from the trusted default branch when available, not from pull-request-supplied code.
- `AI Review` accepts only native Codex evidence bound to the current PR head SHA and fails on P0-P2, missing, stale, malformed, or untrusted evidence.
- The AI review job runs on GitHub-hosted `ubuntu-latest`; no local or self-hosted runner is allowed in the gate path.
- `osv-scan` must complete successfully on the current PR head SHA; a failed, missing, or pending scan is not merge-ready.
- Expired OSV exceptions must fail closed. Before `effectiveUntil`, either remove the exception after
  updating the dependency or renew it through human review with fresh upstream evidence.
- Product changes under `app/`, `api/`, `worker/`, `web/`, or `mobile/` require complete feature memory in `.specify/specs/<feature-id>/spec.md`, `plan.md`, and `tasks.md`.
- Skipped required gates must not be treated as successful merge readiness.

## Local Preflight

Run before pushing whenever possible:

```bash
npm run preflight
```

The preflight command runs the feature-memory gate against the worktree, repository baseline validation, app typecheck, app build, e2e lint/typecheck, Playwright, and optional app tests.

## Branch Protection Baseline

Apply after workflows are merged into the default branch:

```text
required checks:
  - baseline-checks
  - guard
  - AI Review
  - test
  - osv-scan
enforce admins: true
dismiss stale reviews: true
require conversation resolution: true
allow force pushes: false
allow deletions: false
```

The repository can keep required human approvals at `0` for solo-owner velocity, but the checks above and conversation resolution must remain required. Operational details and the review evidence contract live in `github-hosted-ai-review.md` and `review-contract.md`.
