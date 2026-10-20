# ADR-004: GitHub-Hosted AI Review Gate

## Status

Accepted

## Context

Capsule Zero requires an AI review policy gate on every pull request. The former
self-hosted orchestration is decommissioned, but that does not remove the review
requirement.

## Decision

- Product code lands through pull requests.
- Required checks are `baseline-checks`, `guard`, `AI Review`, `test`, and
  `osv-scan`.
- `AI Review` runs as a GitHub Actions job on `ubuntu-latest`; it never depends on
  a local machine or self-hosted runner.
- A connected human account triggers native Codex review with `@codex review`.
- PR updates and submitted Codex reviews run the primary check. Trusted comment events
  use a separate default-branch-only wake-up that reruns the existing required check
  on the resolved PR head SHA.
- The repository-owned gate validates Codex output against the current PR head SHA.
- Codex P0, P1, and P2 findings fail the gate; P3-only or no-findings reviews pass.
- Missing, stale, or unverifiable reviewer evidence fails closed.
- Known dependency vulnerabilities reported by `osv-scan` block merge.
- The owner delegates reversible decisions and authorized merge execution to the orchestrator under PRODUCT-PLAN §0.1. Required review/checks remain mandatory; authorization is never inferred from green CI alone.

## Consequences

- AI review remains mandatory without workstation availability risk.
- GitHub is the execution and policy control plane for the gate.
- Gate helpers are loaded from the default branch after first-install bootstrap.
- Local runner credentials, logs, launch agents, and orchestration docs remain retired.
