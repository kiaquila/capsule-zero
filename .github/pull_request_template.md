## Summary

<!-- What changed and why? -->

## Scope Context

- Scope id or feature name:
- Durable docs updated: yes or no

## SENAR Done Gate

<!--
  Required for product-code PRs against specs `005-…` and onward.
  Grandfathered specs `001-capsule-zero-mvp`, `002-pipeline-hardening`, and
  `003-sprint-0-foundation` are exempt — mark all items N/A with note
  "grandfathered (spec ≤003)".
  Spec `004-senar-process-layer` is the SENAR rollout itself; it dogfoods
  the contract on its own PR as a self-test (SC-003), not as policy.
  Infrastructure-only PRs (no product-root changes: `app/`, `api/`, `worker/`,
  `web/`, `mobile/`) may mark items N/A with a one-line reason.
  Full contract: docs_capsule_zero/project/devops/senar-mapping.md
-->

- [ ] Feature memory names the goal and scope (`spec.md` Goal + Scope sections).
- [ ] Every acceptance criterion has evidence in the PR diff, `plan.md` Verification table, or a linked check.
- [ ] At least one negative scenario is covered, or the spec explicitly waives the requirement with a one-line reason.
- [ ] `tasks.md` records the relevant dead ends, decisions, and known issues under `## Process Memory`.
- [ ] **TDD evidence (specs ≥ 025)**: link to the commit that landed the failing test before the implementation that makes it pass — or a one-line waiver if the change is doc-only / infra-only and the `test` check does not apply.
- [ ] Any remaining known issue is accepted by the human merge owner.

## Validation

- Checks run:
- Risks checked:

## Review Notes

- Review considerations:
- Follow-up work:
