# Cloud AI Integrations and Review Gate

This document replaces the old self-hosted runner contract. The file path is retained so existing repository references continue to resolve during migration.

## Canonical Model

- There is no self-hosted AI review runner in the target architecture.
- GitHub is the control plane.
- Native Claude GitHub Actions workflows handle Claude execution.
- Native Codex GitHub integration handles Codex execution.
- Repository-owned GitHub Actions workflows enforce routing policy and the `AI Review` gate.

See `docs_capsule_zero/project/devops/ai-orchestration-protocol.md` for the routing contract.
See `docs_capsule_zero/project/devops/codex-github-setup.md` for Codex integration setup.
See `docs_capsule_zero/project/devops/validation-matrix.md` for the migration exit criteria.

## Required Repository Variables

- `AI_IMPLEMENTATION_AGENT`
  - supported values: `claude`, `codex`
  - recommended default: `claude`
- `AI_REVIEW_AGENT`
  - supported values: `claude`, `codex`
  - recommended default: `codex`

## Required Repository Secrets

- `ANTHROPIC_API_KEY`
  - required for native Claude GitHub Actions workflows

## Required Workflow Permissions

- `contents: read`
  - required for checkout and repository context
- `pull-requests: write`
  - required for comment-driven automation and PR interaction
- `issues: write`
  - required for issue and PR comment routing
- `id-token: write`
  - required for native Claude GitHub Actions workflows that use OIDC-backed setup

Repository default workflow permissions may remain `read` so long as individual workflows request the additional permissions they need.

## Review Flow

- Native review runs through the selected vendor backend.
- `AI_REVIEW_AGENT` determines which reviewer is canonical for the current repository state.
- The repository-owned `AI Review` workflow routes the selected native review backend, validates that the selected native reviewer ran, and normalizes the result to Capsule Zero policy.
- Claude review must be triggered by a connected trusted actor through a top-level PR comment such as `@claude review once`.
- `AI Review` does not invoke Claude directly; it validates the marker comment published by `.github/workflows/claude-review.yml`.
- Claude GitHub Actions does not submit formal GitHub PR reviews in this repository contract; instead it updates a single `claude[bot]` comment that begins with `AI_REVIEW_AGENT`, `AI_REVIEW_SHA`, and `AI_REVIEW_OUTCOME` marker lines.
- Claude review is blocked on untrusted fork-triggered `pull_request` runs because secrets are not exposed there; the workflow fails with an explicit explanation instead of attempting a secret-backed run.
- Codex review must be triggered by a connected human Codex account through a top-level PR comment such as `@codex review`.
- Workflow-authored comments from `github-actions[bot]` do not start a real Codex review task and are not used for the canonical path.
- Comment-driven Codex review also requires a Codex cloud environment for the repository. Without it, the connector replies with a setup error and `AI Review` fails closed.
- Codex validation uses native PR review output from `chatgpt-codex-connector[bot]` plus Codex severity badges in inline review comments.
- Any Codex inline finding without a recognized `P0-P3` badge fails the gate closed.
- On reruns for the same head SHA, `AI Review` may reuse the latest valid native review already published for that head instead of requiring a brand-new review.
- `AI Review` fails closed when the selected reviewer does not run or its result cannot be validated.
- Codex Automatic reviews should remain disabled so repository policy keeps owning reviewer selection.
- Validation details are defined in `docs_capsule_zero/project/devops/review-contract.md`.

## Implementation Flow

- Native implementation runs through the selected vendor backend.
- `AI_IMPLEMENTATION_AGENT` determines which implementation backend is canonical for the current repository state.
- Comment-driven Claude implementation uses native tag mode plus repository-specific system instructions so Claude can edit files directly on the active PR branch without falling back to interactive tool approval.
- Canonical Claude implementation is started from a trusted GitHub comment such as `@claude <task brief>`.
- Canonical Codex implementation is started from Codex app or Codex web as a native cloud task that opens or updates a Codex-owned pull request.
- Comment-driven `@codex <task brief>` on an existing pull request may still be used for orchestration or bounded PR-context tasks, but Capsule Zero does not rely on it as the canonical branch-mutating Codex implementation path.
- Comment-driven Claude implementation and manual Claude review fail closed on fork PRs because `issue_comment` workflows run with repository secrets.
- Only trusted repository actors may trigger repository AI workflows.
- The repository may use policy workflows to reject mismatched agent triggers.
- Current migration evidence showed Codex review works natively from GitHub comments, but Codex implementation write-back from GitHub-triggered cloud tasks can fail when the task environment has no configured remote push destination. The supported remote-first fallback is to launch the Codex implementation task from Codex cloud and let Codex create its own PR.

## Required GitHub Settings

- protect `main`
- require pull requests before merge
- require status checks `baseline-checks`, `guard`, and `AI Review`
- require at least one human approval
- restrict direct pushes to `main`

## Migration Status

- Legacy PowerShell review adapters and local worktree scripts still exist only as migration artifacts.
- They are not canonical and must be removed after the validation matrix passes.
