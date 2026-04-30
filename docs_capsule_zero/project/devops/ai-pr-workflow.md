# AI Pull Request Workflow

This is the canonical PR loop for implementation, AI review, and merge readiness in Capsule Zero.

## Process Invariants

- Product code lands through pull requests only.
- The required checks are always `baseline-checks`, `guard`, and `AI Review`.
- `osv-scan` runs on pull requests as a dependency-security signal and may be promoted to a required check after scanner behavior is validated on real dependency updates.
- Implementation agent selection and review agent selection are separate decisions.
- Codex acts as the repository orchestrator and architecture owner.
- Claude is the default implementation agent.
- Codex is the default review agent unless repository policy overrides it.
- Low-severity-only findings remain advisory.
- A human remains the final merge authority.

The workflow may change tools, integrations, and automation layers, but these rules do not change.

## Roles

- The selected implementation agent writes product code and updates any required durable docs.
- The selected review agent performs repository review using its native cloud integration.
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
6. GitHub runs `baseline-checks`, `guard`, `AI Review`, and the `osv-scan` security workflow.
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
- Advisory-only findings must not fail `AI Review`.
- Blocking findings must fail `AI Review`.
- If the selected reviewer does not run or its result cannot be validated, `AI Review` fails closed.
- Claude review on untrusted fork-triggered `pull_request` events is blocked explicitly because repository secrets are unavailable to that event model.
- Validation details are defined in `docs_capsule_zero/project/devops/review-contract.md`.

## CI And Guard Contract

- `baseline-checks` runs repository baseline validation, `app` typecheck, `app` build, and optional app tests.
- `guard` runs repository-owned gate scripts from the trusted default branch when those scripts are available there.
- Product code changes under `app/` require complete feature memory in `.specify/specs/<feature-id>/spec.md`, `plan.md`, and `tasks.md`.
- Infrastructure-only PRs that do not change `app/` are validated through baseline files and durable devops documentation instead of feature memory.
- Local preflight is `npm run preflight`.

Detailed CI and branch-protection policy lives in `docs_capsule_zero/project/devops/github-ci-and-branch-protection.md`.

## SENAR Done Gate

Before merge, the author and the human merge owner confirm that:

- Feature memory (`spec.md`) names goal and scope.
- Every acceptance criterion has evidence in the PR diff, in the `## Verification` table of `plan.md`, or in a linked check. AI-written summaries do not count as evidence.
- At least one negative scenario is covered, or `spec.md` explicitly waives the requirement with a one-line reason.
- `tasks.md` records the relevant dead ends, decisions, and known issues under `## Process Memory`.
- Any remaining known issue is explicitly accepted by the human merge owner.

This gate is enforced by the review agent and the human merge owner, not by an additional GitHub Actions check. Structural completeness of feature memory continues to be enforced by `pr-guard.yml` (spec/plan/tasks must exist for `app/` changes). Full mapping and rationale: `docs_capsule_zero/project/devops/senar-mapping.md`.

The gate applies to every spec authored after the SENAR layer shipped (`005-…` and onward). Specs `001-capsule-zero-mvp`, `002-pipeline-hardening`, and `003-sprint-0-foundation` are grandfathered.

## Merge-Ready Rule

The loop is still active while any of these are true:

- required checks are queued, running, or red
- blocking findings remain on the current PR head SHA
- the PR has merge conflicts
- workflow, integration, or routing issues remain unresolved
- the SENAR Done Gate is unmet for an in-scope (non-grandfathered) spec

A task is done only when the current PR head SHA has green required checks, no blocking findings, no conflicts, the SENAR Done Gate is satisfied (or N/A for infrastructure-only PRs), and only final merge mechanics remain.
