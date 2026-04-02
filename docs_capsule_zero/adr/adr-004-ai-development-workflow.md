# ADR-004: AI Development Workflow

## Status

Accepted

## Context

Capsule Zero needs an explicit delivery model for spec-driven implementation, automated AI review, and human-controlled merge readiness. The repository also needs a workflow that can be operated remotely through cloud-native vendor integrations rather than local machines or self-hosted runners.

## Decision

- Product code lands through pull requests, not direct pushes to `main`.
- Codex is the repository orchestrator and architecture owner.
- Claude is the default implementation agent.
- Codex is the default review agent unless repository policy overrides it.
- Durable docs, ADRs, prompts, workflow files, and orchestration docs are part of the repository contract and may be updated alongside product code.
- Every pull request must pass `baseline-checks`, `guard`, and `AI Review`.
- Implementation selection is controlled through the repository variable `AI_IMPLEMENTATION_AGENT`.
- Review selection is controlled through the repository variable `AI_REVIEW_AGENT`.
- Native vendor integrations execute implementation and review work.
- The required `AI Review` check is a repository-owned gate that normalizes native review output to Capsule Zero policy.
- Low-severity-only findings remain advisory and must not fail `AI Review`.
- If the selected native reviewer does not run or its result cannot be validated, `AI Review` fails closed.
- Final merge authority remains human even when AI review is green.

## Consequences

- Roles and merge gates remain explicit while tooling becomes cloud-native.
- Review infrastructure stays part of the repository architecture even though execution backends are vendor-native.
- Capsule Zero can preserve its PR loop and policy semantics without depending on a local worker machine.
