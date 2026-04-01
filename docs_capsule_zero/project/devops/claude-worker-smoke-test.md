# Claude Worker Smoke Test

This document records that branch `codex/claude-001-capsule-zero-mvp-workflow-smoke-test` was
produced end-to-end by the **local Claude worker orchestration flow** defined in
`docs_capsule_zero/project/devops/ai-pr-workflow.md`.

## Scripts Used

| Script | Purpose |
|---|---|
| `scripts/new-claude-worktree.ps1` | Creates a dedicated git worktree and branch scoped to the task |
| `scripts/start-implementation-worker.ps1` | Launches Claude Code as a local worker with the scoped task brief |
| `scripts/publish-claude-branch.ps1` | Pushes the branch and creates or updates the pull request |

## Orchestration Sequence

1. `new-claude-worktree.ps1` was called with `-FeatureFolder 001-capsule-zero-mvp` and
   `-TaskSlug claude-001-capsule-zero-mvp-workflow-smoke-test` to produce the worktree at
   `codex__claude-001-capsule-zero-mvp-workflow-smoke-test`.
2. `start-implementation-worker.ps1` launched Claude Code inside the worktree with the task
   brief, the governing docs, and the instruction to publish the PR when complete.
3. Claude Code read `AGENTS.md`, `CLAUDE.md`, and the relevant durable docs, implemented the
   scoped change, committed it, then called `publish-claude-branch.ps1` to open the draft PR.

## Validation Note

- No application code was changed. The only artifact is this markdown file.
- `npm run typecheck` and `npm run build` are not required for a docs-only change; the
  `baseline-checks` workflow enforces this gate on the PR.
- GitHub Actions will run `baseline-checks`, `guard`, and `AI Review` on the resulting PR.
  Green required checks confirm the worker flow is operational.
