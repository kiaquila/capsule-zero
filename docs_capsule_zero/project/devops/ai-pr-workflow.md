# AI Pull Request Workflow

This is the canonical PR loop for implementation, AI review, and merge readiness in Capsule Zero.

## Process Invariants

- Product code lands through pull requests only.
- The required checks are always `baseline-checks`, `guard`, and `AI Review`.
- Implementation agent selection and review agent selection are separate decisions.
- Codex acts as the repository orchestrator and architecture owner.
- Claude is the default implementation agent.
- Codex is the default review agent unless repository policy overrides it.
- Gemini may be used as a temporary supplementary overflow reviewer when Codex quota is exhausted.
- Low-severity-only findings remain advisory.
- A human remains the final merge authority.

The workflow may change tools, integrations, and automation layers, but these rules do not change.

## Roles

- The selected implementation agent writes product code and updates any required durable docs.
- The selected review agent performs repository review using its native cloud integration.
- Gemini may add supplementary native review comments, but it is not a canonical selected reviewer yet.
- Codex owns orchestration, architecture enforcement, review policy, and workflow health.
- GitHub is the control plane for agent routing, pull requests, and required checks.
- GitHub Actions runs the repository-owned policy and gate workflows.
- Native review normalization details live in `docs_capsule_zero/project/devops/review-contract.md`.

## Standard Loop

1. Start from current `main`.
2. Work from a scoped task brief, issue, or PR summary with enough context to implement and review the change.
3. Route implementation to the selected agent using the canonical GitHub comment trigger for that agent.
4. The implementation agent works on one scoped branch and one pull request for that task.
5. The pull request updates validation notes and any required durable docs.
6. GitHub runs `baseline-checks`, `guard`, and `AI Review`.
7. Route review to the selected reviewer using the native review trigger for that agent.
8. Let the repository-owned `AI Review` gate validate the selected native review result against the review contract.
9. If follow-up is needed, continue on the same branch and update the same PR.
10. A human merges only after required checks are green, no blocking findings remain, and branch protection conditions are satisfied.

## Agent Selection Contract

- Implementation selection comes from the repository variable `AI_IMPLEMENTATION_AGENT`.
- Review selection comes from the repository variable `AI_REVIEW_AGENT`.
- Supported values are `claude` and `codex`.
- Capsule Zero defaults to `claude` for implementation and `codex` for review.
- Canonical execution uses the selected vendor's native remote surface:
  - `@claude ...` for Claude implementation tasks
  - Codex app or Codex web task for Codex-owned implementation PRs
  - `@claude review once` for Claude review on a top-level PR comment
  - `@codex review` for Codex review on a top-level PR comment
- Temporary supplementary overflow review may use `/gemini review`, but it does not replace the selected reviewer for `AI Review`.
- Only trusted repository actors may trigger AI workflows.
- Trusted actors are `OWNER`, `MEMBER`, and `COLLABORATOR`.
- Canonical triggers must match repository policy. A mismatched trigger is a policy failure, not an implicit override.
- `workflow_dispatch` exists only as an administrative fallback and does not replace the comment-driven loop.

Routing details live in `docs_capsule_zero/project/devops/ai-orchestration-protocol.md`.

## AI Review Contract

- The required status check is always `AI Review`.
- `AI Review` is a repository-owned gate, not the vendor-native review engine itself.
- Native vendor review still runs through the selected agent's own cloud integration.
- `AI Review` reads the selected reviewer policy, routes the selected native review backend, validates that the selected native review actually ran, and normalizes the outcome to Capsule Zero policy.
- Gemini review is currently supplementary only and does not satisfy the required `AI Review` check.
- Advisory-only findings must not fail `AI Review`.
- Blocking findings must fail `AI Review`.
- If the selected reviewer does not run or its result cannot be validated, `AI Review` fails closed.
- Claude review on untrusted fork-triggered `pull_request` events is blocked explicitly because repository secrets are unavailable to that event model.
- Validation details are defined in `docs_capsule_zero/project/devops/review-contract.md`.

## Temporary Overflow Mode

When Codex review quota is exhausted:

1. Temporarily switch the canonical gating reviewer to Claude.
2. Request `/gemini review` on the same PR for additional native review coverage.
3. Merge only after the canonical `AI Review` check is green and any material Gemini findings are addressed or consciously dismissed by a human.

## Merge-Ready Rule

The loop is still active while any of these are true:

- required checks are queued, running, or red
- blocking findings remain on the current PR head SHA
- the PR has merge conflicts
- workflow, integration, or routing issues remain unresolved

A task is done only when the current PR head SHA has green required checks, no blocking findings, no conflicts, and only final merge mechanics remain.
