# AI Pull Request Workflow

This is the canonical PR loop for implementation, AI review, and merge readiness in Capsule Zero.

## Roles

- The selected implementation agent writes product code and updates any tracked durable docs needed for the change.
- Codex owns architecture enforcement, review policy, and workflow health.
- GitHub Actions runs required checks.
- A human remains the final merge authority.

## Standard Loop

1. Start from current `main`.
2. Work from a scoped task brief, issue, or PR summary with enough implementation context to review the change.
3. The implementation agent works on a feature branch, manually or through local worker orchestration.
4. The PR updates validation notes and any required durable docs.
5. GitHub runs `baseline-checks`, `guard`, and `AI Review`.
6. The selected reviewer posts or updates one sticky review comment marked `<!-- ai-review -->`.
7. If follow-up is needed, continue on the same branch and update the same PR.
8. A human merges only after required checks are green, no blocking findings remain, and approval is present.

## AI Review Contract

- Reviewer selection comes only from the repository variable `AI_REVIEW_AGENT`.
- Supported values are `codex` and `claude`; missing or invalid values fall back to `codex` in Capsule Zero.
- The required status check is always `AI Review`.
- Low-severity-only findings are advisory; the effective verdict is normalized to `comment`.
- `AI Review` fails only when the effective verdict remains `request_changes`.
- Review workflows target the self-hosted macOS runner label `ai-runner`.

## Merge-Ready Rule

The loop is still active while any of these are true:

- required checks are queued, running, or red
- blocking findings remain on the current PR head SHA
- the PR has merge conflicts
- workflow or runner issues remain unresolved

A task is done only when the current PR head SHA has green required checks, no blocking findings, no conflicts, and only human approval or final merge remaining.
