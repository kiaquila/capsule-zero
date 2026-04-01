# AI Pull Request Workflow

This is the canonical PR loop for implementation, AI review, and merge readiness in Capsule Zero.

## Roles

- The selected implementation agent writes product code and updates any tracked durable docs needed for the change.
- Local implementation workers can be launched through repository scripts for `codex` or `claude`.
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
- Supported reviewer values are `codex` and `claude`; missing or invalid values fall back to `codex` in Capsule Zero.
- The required status check is always `AI Review`.
- Low-severity-only findings are advisory; the effective verdict is normalized to `comment`.
- `AI Review` fails only when the effective verdict remains `request_changes`.
- Review workflows target the self-hosted macOS runner label `ai-runner`.

## Local Claude Worker Sequence

When Codex is acting as the orchestrator and delegates implementation to Claude Code locally, use this sequence for each independent task:

1. Select the active implementation agent:
   `pwsh -NoProfile -ExecutionPolicy Bypass -File ./scripts/set-implementation-agent.ps1 -Agent claude`
2. Create a dedicated Claude worktree and branch for the task:
   `pwsh -NoProfile -ExecutionPolicy Bypass -File ./scripts/new-claude-worktree.ps1 -FeatureFolder 001-capsule-zero-mvp -TaskSlug <task-slug>`
3. Launch the worker with the scoped task brief and ask it to publish or reuse the PR when complete:
   `pwsh -NoProfile -ExecutionPolicy Bypass -File ./scripts/start-implementation-worker.ps1 -FeatureFolder 001-capsule-zero-mvp -TaskSummary "<task summary>" -WorktreePath "<worktree path>" -OpenPullRequest -PullRequestTitle "<PR title>"`
4. Let GitHub run `baseline-checks`, `guard`, and `AI Review` on the resulting PR.
5. If review finds issues, continue on the same branch and rerun the worker or fix locally, then update the same PR.

Useful overrides:

- Set `CLAUDE_WORKER_MODEL` to pin the local implementation model for Claude workers.
- Set `CLAUDE_REVIEW_MODEL` on the runner if PR review should use a pinned Claude model.
- Pass `-ReviewAgent codex` or `-ReviewAgent claude` to `set-implementation-agent.ps1` when implementation and review should intentionally differ.

## Merge-Ready Rule

The loop is still active while any of these are true:

- required checks are queued, running, or red
- blocking findings remain on the current PR head SHA
- the PR has merge conflicts
- workflow or runner issues remain unresolved

A task is done only when the current PR head SHA has green required checks, no blocking findings, no conflicts, and only human approval or final merge remaining.
