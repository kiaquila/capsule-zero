# ADR-004: AI Development Workflow

## Status

Accepted

## Context

Capsule Zero needs an explicit delivery model for spec-driven implementation, automated AI review, and human-controlled merge readiness. The repository also needs CI/CD and repeatable operating rules before Phase 5 begins.

## Decision

- Product code lands through pull requests, not direct pushes to `main`.
- Codex is the default implementation agent and the default AI reviewer for this repository.
- Durable docs, ADRs, prompts, workflow files, and orchestration scripts are part of the repository contract and may be updated alongside product code.
- Every pull request must pass `baseline-checks`, `guard`, and `AI Review`.
- `AI Review` runs on a self-hosted GitHub Actions runner labeled `ai-runner`.
- Reviewer selection is controlled through the repository variable `AI_REVIEW_AGENT`.
- Low-severity-only findings remain advisory and must not fail `AI Review`.
- Final merge authority remains human even when AI review is green.

## Consequences

- Roles and merge gates are explicit.
- Review infrastructure becomes part of the repository architecture.
- Phase 5 implementation can start on top of a stable PR-first workflow.
