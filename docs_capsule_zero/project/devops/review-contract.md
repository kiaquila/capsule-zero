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
  A clean receipt contains the explicit `Didn’t find any major issues.` verdict,
  exactly one reviewed-commit anchor, and optionally the native About Codex footer.
  Duplicate markers/anchors, negative or unfinished verdicts and extra conflicting
  content fail closed. Recency uses `updated_at` (falling back to `created_at`).

The trusted bot's `<!-- codex-pull-request-review-summary -->` comment with a
`codex-review-state:v1` payload wakes evaluation on creation **and editing**, including
updates to an older comment. Its code-review SHA must equal the full current head.
This structured summary is **not review evidence**: `completed`, reactions or table
text never grant a pass. Only the receipts and native formal reviews above do.

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
are checked by the gate across all heads and remain independently enforced by the
repository ruleset. An unresolved Codex thread blocks even a P3-only receipt.
A new request or approval cannot erase blocking formal findings on the same SHA. A comment-event wake-up must
target an existing PR-linked `AI Review` run for the resolved head SHA; it never uses
the default-branch event SHA and never creates a second status context with the same
name. If the PR head changes between context resolution and validation, the gate fails
closed instead of transferring evidence between commits. The head is checked again
immediately before a successful exit and before a rerun request.

The wake-up waits for an active evaluator for up to three minutes, then preserves
it if still active. The evaluator polls for twenty minutes. Terminal failures can
be rerun once per newer evidence update; duplicate deliveries of an already
processed update do not loop reruns. Successful runs are never restarted.

## Owner-Triggered Gate Repair

Normal PR events use default-branch gate scripts. To recover an incompatible parser,
the repository owner may apply the `codex-gate-repair` label after native review.
The `pull_request: labeled` run is PR-evaluated (manual `workflow_dispatch` checks
cannot satisfy PR required-check rules). It selects only the event's immutable
head SHA, which must still equal the current open, non-draft, same-repository head. A trusted full-SHA request and subsequent clean native bot
receipt are required before selecting that gate code. The repaired gate then performs
its normal evidence validation with a read-only token on GitHub-hosted runners.
All required checks and review-thread rules still apply. See the
[recovery runbook](github-hosted-ai-review.md#recovering-an-incompatible-gate).
