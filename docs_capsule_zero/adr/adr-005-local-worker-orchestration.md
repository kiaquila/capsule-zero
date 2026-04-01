# ADR-005: Local Worker Orchestration

## Status

Accepted

## Context

Capsule Zero needs a safe way to launch scoped local implementation work without giving up the PR-based merge path. Parallel work should be possible without shared working tree conflicts.

## Decision

- One worker maps to one task, one branch, one git worktree, and one pull request.
- Local worker execution is launched from repository scripts, not ad hoc shell commands.
- Default mode is one worker; parallel workers are allowed only for independent tasks.
- The soft concurrency limit is three workers on one machine unless a later ADR changes it.
- The active implementation agent is stored in `.codex/implementation-agent` and the default helper mirrors it to the `AI_REVIEW_AGENT` repository variable for review selection.
- Review selection may still be overridden explicitly when a different PR reviewer is desired for a repository.
- Workers must start from an approved `.specify/specs/<feature-id>/` folder and stay scoped to that task.

## Consequences

- Local parallel implementation becomes possible without branch collisions.
- The PR loop and merge gates remain unchanged.
- Operators still need judgment for file overlap and architectural risk.
