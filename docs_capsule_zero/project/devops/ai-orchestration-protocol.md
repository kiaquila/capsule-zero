# AI Orchestration Protocol

This document defines the canonical cloud-native orchestration model for Capsule Zero.

## Purpose

Capsule Zero preserves its existing PR loop, merge gates, and review policy while replacing local worker scripts and self-hosted review runners with native cloud integrations from Codex and Claude. Gemini Code Assist on GitHub may be used as a temporary manual overflow reviewer when Codex review quota is exhausted, but it is not part of the canonical required-review contract yet.

## Process Boundary

- GitHub is the shared control plane.
- Codex is the orchestrator and architecture owner.
- Claude is the default implementation backend.
- Codex is the default review backend.
- Gemini is an optional temporary overflow reviewer for quota relief.
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

Gemini is currently outside this selector set. Until Gemini review is validated in the repository gate, keep `AI_REVIEW_AGENT` on `claude` or `codex`.

## Canonical Triggers

Canonical execution uses the selected vendor's native remote surface.

- Implementation
  - `@claude <task brief>`
  - Codex app or Codex web task for Codex-owned implementation PRs
- Review
  - `@claude review once` on a top-level PR comment
  - `@codex review` on a top-level PR comment

Temporary supplementary overflow review may also use `/gemini review` on a top-level PR comment, but that path does not replace the canonical selected reviewer.

Administrative workflows may use `workflow_dispatch`, but that path is operational fallback only.

## Routing Rules

- The implementation entrypoint must match `AI_IMPLEMENTATION_AGENT`.
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
- Comment-driven Claude implementation runs in native tag mode so file edits on the active branch are auto-accepted within the repository workspace.
- Review runs with the repository-selected model, currently pinned to `claude-opus-4-6`.
- Claude review output is comment-driven, not a formal GitHub PR review.
- Claude review must follow `docs_capsule_zero/project/devops/review-contract.md` so the repository gate can validate the result.

### Codex

- Implementation and review run through native Codex GitHub integration and Codex cloud surfaces.
- Codex review is requested through canonical GitHub comments.
- Codex implementation is canonical when it is started from Codex app or Codex web as a native cloud task and Codex opens or updates its own pull request.
- `@codex <task brief>` on an existing pull request remains useful for bounded PR-context analysis or follow-up work, but it is not the repository's canonical branch-mutating implementation contract.
- Codex remains the orchestration surface used to steer work remotely, including from Codex cloud and mobile-capable ChatGPT surfaces where available.
- Codex review guidance is defined in `AGENTS.md`.
- The repository gate validates Codex review using native GitHub review output from `chatgpt-codex-connector[bot]`, the PR head SHA, and Codex severity badges as defined in `docs_capsule_zero/project/devops/review-contract.md`.
- If Codex has no concrete findings, the connector may emit a top-level `Codex Review:` comment instead of a formal PR review; the gate treats that native no-findings reply as a pass for the active cycle.
- Any untagged Codex inline finding fails the gate closed, and reruns may reuse an already-published valid Codex review for the same head SHA.
- Codex Automatic reviews stay disabled because reviewer routing is repository-owned.
- Comment-driven Codex tasks require a Codex cloud environment for the repository. If it is missing, the connector emits a setup reply and `AI Review` fails closed.
- Validation on April 3, 2026 showed that GitHub-triggered `@codex <task brief>` cloud tasks can complete without updating the active PR branch when no remote push destination is configured in the task environment. Capsule Zero therefore standardizes on Codex-owned PR creation from Codex app or web for canonical Codex implementation cycles.

### Gemini

- Gemini Code Assist on GitHub is approved only as a temporary manual overflow reviewer.
- Gemini review is requested with `/gemini review` on a top-level PR comment.
- Repository-local behavior is configured through `.gemini/config.yaml` and `.gemini/styleguide.md`.
- Automatic review on PR open must remain disabled so reviewer routing stays repository-owned.
- Gemini is not currently a supported value for `AI_REVIEW_AGENT`.
- When Codex review quota is exhausted, temporarily switch the canonical gating reviewer to Claude and use Gemini as supplementary review signal on the same PR.
- Operational setup details live in `docs_capsule_zero/project/devops/gemini-github-setup.md`.

## AI Review Gate

- `AI Review` is the single required review check.
- Native vendor review happens first.
- `AI Review` routes the selected native review backend.
- `AI Review` currently validates only Claude and Codex.
- Claude review must be initiated from a trusted top-level PR comment using `@claude review once`.
- `AI Review` does not invoke Claude directly; it validates the marker comment emitted by the dedicated Claude review workflow.
- Codex review must be initiated from a connected human Codex account on a top-level PR comment because workflow-authored comments do not start a real Codex review task.
- Gemini reviews are currently supplementary only and do not satisfy the required `AI Review` check.
- Claude review does not run on untrusted fork-triggered `pull_request` events because repository secrets are unavailable there.
- Comment-driven `@claude` implementation and `@claude review once` also fail closed for fork PRs because `issue_comment` workflows run with repository secrets.
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

## Cleanup Status

- Legacy PowerShell review adapters are removed.
- Legacy local worktree orchestration scripts are removed.
- The self-hosted runner smoke workflow is removed.
- The canonical process is now fully cloud-native.

Operational setup details live in `docs_capsule_zero/project/devops/codex-github-setup.md` and `docs_capsule_zero/project/devops/gemini-github-setup.md`.
Removal criteria live in `docs_capsule_zero/project/devops/validation-matrix.md`.
