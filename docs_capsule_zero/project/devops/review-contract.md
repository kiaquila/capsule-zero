# AI Review Contract

This document defines the machine-readable contract for the repository-owned
`AI Review` gate.

## Trusted Reviewer

The gate accepts Codex output only from `chatgpt-codex-connector[bot]`.

## Head-SHA Binding

Reviewer evidence must target the current pull-request head SHA. A no-findings
summary must include a `**Reviewed commit:**` value that is either the exact
40-character SHA or an unambiguous abbreviation of the current head. Evidence for a
different commit, or an anchorless summary, is rejected.

## Accepted Native Output

Codex may publish:

- a GitHub pull-request review with inline findings;
- or a top-level comment beginning with `Codex Review:` after whitespace trimming
  and optional removal of the exact leading `<!-- codex-review-receipt:v1 -->`
  service marker, and containing the reviewed commit anchor. Unknown marker versions,
  arbitrary prefixes and running summary tables are not accepted verdicts.

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
remain independently enforced by the repository ruleset. A comment-event wake-up must
target an existing PR-linked `AI Review` run for the resolved head SHA; it never uses
the default-branch event SHA and never creates a second status context with the same
name. If the PR head changes between context resolution and validation, the gate fails
closed instead of transferring evidence between commits.

## Owner-Dispatched Gate Repair

Normal PR events use default-branch gate scripts. To recover an incompatible parser,
the repository owner may dispatch the workflow on an already-reviewed, immutable
`trusted_gate_sha`. It must equal the workflow SHA and the current open, non-draft,
same-repository PR head. A trusted full-SHA request and subsequent clean native bot
receipt are required before selecting that gate code. The repaired gate then performs
its normal evidence validation with a read-only token on GitHub-hosted runners.
All required checks and review-thread rules still apply. See the
[recovery runbook](github-hosted-ai-review.md#recovering-an-incompatible-gate).
