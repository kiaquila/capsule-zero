# GitHub CI And Branch Protection

GitHub is the control plane for pull requests, checks, AI review routing, and dependency security signals.

## Required Workflows

- `ci.yml`: runs repository baseline validation, app typecheck, app build, and optional app tests as the required `baseline-checks` job.
- `pr-guard.yml`: enforces feature-memory coverage for `app/` product changes and validates baseline files as the required `guard` job.
- `ai-command-policy.yml`: rejects untrusted or policy-mismatched AI command comments.
- `ai-review.yml`: normalizes selected native review output into the required `AI Review` check.
- `osv-scan.yml`: scans dependencies for known vulnerabilities on pull requests, pushes to `main`, weekly schedule, and manual dispatch.

`claude-agent.yml` and `claude-review.yml` are native execution workflows. They are not branch-protection checks by themselves; `AI Review` remains the review gate.

## Required Checks

Branch protection for `main` must require:

- `baseline-checks`
- `guard`
- `AI Review`

`osv-scan` should run on every pull request and should be treated as a security signal. It is intentionally not part of the required branch-protection baseline until the repository has observed the scanner on real dependency updates and decided whether security findings should block all merges.

## Fail-Closed Rules

- Unsupported `AI_REVIEW_AGENT` values fail `AI Review`.
- Missing selected-reviewer evidence fails `AI Review`.
- Review evidence must match the current pull request head SHA.
- Required gate scripts run from the trusted default branch when available, not from pull-request-supplied code.
- Product changes under `app/` require complete feature memory in `.specify/specs/<feature-id>/spec.md`, `plan.md`, and `tasks.md`.
- Skipped required gates must not be treated as successful merge readiness.

## Local Preflight

Run before pushing whenever possible:

```bash
npm run preflight
```

The preflight command runs the feature-memory gate against the worktree, repository baseline validation, app typecheck, app build, and optional app tests.

## Branch Protection Baseline

Apply after workflows are merged into the default branch:

```text
required checks:
  - baseline-checks
  - guard
  - AI Review
enforce admins: true
dismiss stale reviews: true
require conversation resolution: true
allow force pushes: false
allow deletions: false
```

The repository can keep required human approvals at `0` for solo-owner velocity, but the checks above and conversation resolution must remain required.
