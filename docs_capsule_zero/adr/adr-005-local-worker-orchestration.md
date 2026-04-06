# ADR-005: Agent Routing and Task Isolation

## Status

Accepted

## Context

Capsule Zero needs a safe way to route scoped implementation and review work across multiple AI backends without giving up the PR-based merge path. The previous local-worktree model provided isolation, but the target operating model must work through cloud-native GitHub integrations and remote orchestration surfaces.

## Decision

- One scoped task maps to one branch and one pull request.
- Canonical execution uses the selected vendor's native remote surface, not local worktree scripts.
- Claude implementation is launched through trusted GitHub comments addressed to `@claude`.
- Codex implementation is launched from Codex app or Codex web and published through Codex-owned pull requests.
- Review stays GitHub-native through `@claude review once` and `@codex review`.
- The active implementation agent is stored in the repository variable `AI_IMPLEMENTATION_AGENT`.
- The active review agent is stored in the repository variable `AI_REVIEW_AGENT`.
- Comment triggers must match the selected repository policy; mismatched triggers are policy violations rather than implicit overrides.
- Workers must start from an approved `.specify/specs/<feature-id>/` folder and stay scoped to that task.
- Local worktree and PowerShell orchestration scripts are removed from the canonical repository path after validation completes.

## Consequences

- Remote orchestration becomes possible without depending on a specific desktop machine.
- Task isolation is preserved through branch and pull-request boundaries instead of local worktrees.
- The PR loop and merge gates remain unchanged even though execution backends change.
