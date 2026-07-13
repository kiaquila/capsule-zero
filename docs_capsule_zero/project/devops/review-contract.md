# AI Review Contract

This document defines the machine-readable contract for the repository-owned
`AI Review` gate.

## Trusted Reviewer

The gate accepts Codex output only from `chatgpt-codex-connector[bot]`.

## Head-SHA Binding

Reviewer evidence must target the current pull-request head SHA. A no-findings
summary must include a `**Reviewed commit:**` value that is either the exact
40-character SHA or an unambiguous abbreviation of the current head. Evidence for a
different commit is rejected.

## Accepted Native Output

Codex may publish:

- a GitHub pull-request review with inline findings;
- or a top-level comment beginning with `Codex Review:` and containing the reviewed
  commit anchor.

## Result Mapping

- `APPROVED`: pass.
- `COMMENTED` with no inline findings: pass.
- `COMMENTED` with only P3 findings: pass with advisory findings.
- no-findings top-level comment for the current head: pass.
- `CHANGES_REQUESTED`: fail.
- any P0, P1, or P2 finding: fail.
- an inline finding without a recognized P0-P3 badge: fail closed.

## Failure Rules

The gate fails when reviewer evidence is missing, stale, malformed, authored by an
untrusted account, or cannot be bound to the current head. Unresolved review threads
remain independently enforced by the repository ruleset.
