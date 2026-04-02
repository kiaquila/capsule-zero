# AI Orchestration Protocol

This document defines the canonical cloud-native orchestration model for Capsule Zero.

## Purpose

Capsule Zero preserves its existing PR loop, merge gates, and review policy while replacing local worker scripts and self-hosted review runners with native cloud integrations from Codex and Claude.

## Process Boundary

- GitHub is the shared control plane.
- Codex is the orchestrator and architecture owner.
- Claude is the default implementation backend.
- Codex is the default review backend.
- Native vendor integrations execute work.
- Repository-owned workflows enforce policy and merge gates.

## Repository Policy Selectors

- `AI_IMPLEMENTATION_AGENT`
  - supported values: `claude`, `codex`
  - default: `claude`
- `AI_REVIEW_AGENT`
  - supported values: `claude`, `codex`
  - default: `codex`

These variables are the only source of truth for agent selection. Comments, labels, or workflow dispatches do not silently override them.

## Canonical Triggers

Canonical execution is comment-driven.

- Implementation
  - `@claude <task brief>`
  - `@codex <task brief>`
- Review
  - `@claude review once` on a top-level PR comment
  - `@codex review` on a top-level PR comment

Administrative workflows may use `workflow_dispatch`, but that path is operational fallback only.

## Routing Rules

- The implementation trigger must match `AI_IMPLEMENTATION_AGENT`.
- The review trigger must match `AI_REVIEW_AGENT`.
- Only trusted repository actors may trigger AI workflows.
- Trusted actors are `OWNER`, `MEMBER`, and `COLLABORATOR`.
- A mismatched trigger is a policy violation.
- One scoped task maps to one branch and one pull request.
- A task must stay scoped to an approved `.specify/specs/<feature-id>/` folder.
- Durable docs remain part of the delivery contract for any change that affects architecture, workflow, or behavior.

## Native Backends

### Claude

- Implementation and review run through native Claude GitHub Actions workflows.
- Canonical commands are comment-driven and handled through `anthropics/claude-code-action@v1`.
- Review runs with the repository-selected model, currently pinned to `claude-opus-4-6`.
- Claude review output must follow `docs_capsule_zero/project/devops/review-contract.md` so the repository gate can validate the result.

### Codex

- Implementation and review run through native Codex GitHub integration and Codex cloud surfaces.
- Codex receives task and review requests through canonical GitHub comments.
- Codex remains the orchestration surface used to steer work remotely, including from Codex cloud and mobile-capable ChatGPT surfaces where available.
- Codex review guidance is defined in `AGENTS.md`.
- The repository gate validates Codex review using native GitHub review output from `chatgpt-codex-connector[bot]`, the PR head SHA, and Codex severity badges as defined in `docs_capsule_zero/project/devops/review-contract.md`.
- Codex Automatic reviews stay disabled because reviewer routing is repository-owned.
- Comment-driven Codex tasks require a Codex cloud environment for the repository. If it is missing, the connector emits a setup reply and `AI Review` fails closed.

## AI Review Gate

- `AI Review` is the single required review check.
- Native vendor review happens first.
- `AI Review` routes the selected native review backend.
- Claude review is invoked directly inside the gate workflow because workflow-authored comments do not trigger another Actions workflow.
- Codex review must be initiated from a connected human Codex account on a top-level PR comment because workflow-authored comments do not start a real Codex review task.
- Claude review does not run on untrusted fork-triggered `pull_request` events because repository secrets are unavailable there.
- The repository-owned `AI Review` gate then:
  - reads `AI_REVIEW_AGENT`
  - verifies that the selected native reviewer actually ran
  - reads the native result
  - normalizes the result to Capsule Zero policy
- The validation details are defined in `docs_capsule_zero/project/devops/review-contract.md`.
- Advisory-only findings remain non-blocking.
- Blocking findings fail the check.
- Missing or unverifiable selected-reviewer output fails the check.

This is a fail-closed system by design.

## Migration Rule

- Legacy PowerShell review adapters and local worktree scripts are migration artifacts only.
- They are not part of the canonical process.
- They remain in the repository only until the validation matrix passes for all agent combinations.
- After the validation matrix passes, the legacy scripts are removed.

Operational setup details live in `docs_capsule_zero/project/devops/codex-github-setup.md`.
Removal criteria live in `docs_capsule_zero/project/devops/validation-matrix.md`.
