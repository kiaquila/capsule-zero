# GitHub-Hosted AI Review

This runbook owns Capsule Zero's required `AI Review` check.

## Operating Model

1. A pull request is opened or updated.
2. A connected human account comments `@codex review` on the final head.
3. OpenAI's native GitHub integration publishes a Codex review for that commit.
4. `.github/workflows/ai-review.yml` validates PR and submitted-review events. A
   PR-open/update run also polls for evidence.
5. `.github/workflows/ai-review-wakeup.yml` handles the human command and anchored
   Codex receipts and structured-summary updates (`created` and `edited`). The runtime
   router checks the trusted actor and current SHA. Structured summaries only wake
   evaluation; they cannot satisfy the gate. A newer evidence update can rerun the
   same unsuccessful PR-linked check once on the resolved PR head SHA. The wake-up
   briefly waits for an active check to avoid losing an update at completion.
6. Every validation runs on GitHub-hosted `ubuntu-latest`.
7. The repository gate validates the reviewer, head SHA, and finding severities.
8. Branch rules require the single resulting `AI Review` check before merge.

No local process, self-hosted runner, Claude CLI, Codex CLI, launch agent, or local
credential is part of this flow.

## Required Repository State

- Codex GitHub access and Code review are enabled for `kiaquila/capsule-zero`.
- A Codex cloud environment exists for the repository.
- Automatic Codex reviews remain off; the canonical trigger is the human-authored
  `@codex review` comment.
- Branch rules require `baseline-checks`, `guard`, `AI Review`, `test`, and
  `osv-scan`.
- `scripts/resolve-pr-context.mjs` and `scripts/ai-review-gate.mjs` exist on
  `main`.

## Security Model

- The primary PR/review workflow token is read-only.
- The comment wake-up token has only read permissions plus `actions: write`; it checks
  out trusted default-branch code only and can only rerun an existing PR-linked gate.
- The workflow validates native output from `chatgpt-codex-connector[bot]`.
- Comment-triggered runs accept only `@codex review` from an owner, member, or
  collaborator, or an anchored Codex summary from the trusted bot. Submitted review
  events wake validation, but only trusted Codex evidence can satisfy the gate.
- Reviewer evidence must identify the current PR head SHA.
- Automatic PR validation loads helper scripts from the trusted default branch.
- An owner-triggered PR-label gate repair can select an immutable, already-reviewed SHA
  under the recovery procedure below. It receives the same read-only token.
- The first-install fallback exists only while the helpers are absent from `main`;
  it receives no write-capable token.

## Result Mapping

- Codex no-findings result: pass.
- Codex P3-only findings: pass with advisory findings.
- Codex P0, P1, or P2 findings: fail.
- Missing, stale, malformed, or untrusted evidence: fail.

The exact machine-readable rules live in
`docs_capsule_zero/project/devops/review-contract.md`.

## Rerun Procedure

1. Push the final fix commit.
2. Comment `@codex review` from the connected human account.
3. Wait for Codex to review the new head SHA.
4. A submitted Codex review starts a fresh PR-linked validation. An anchored summary
   comment starts the trusted wake-up, which reruns a failed or timed-out PR-linked
   check on the same head SHA.
5. If event delivery failed, rerun the existing PR-linked check. A manual dispatch
   can diagnose evidence but cannot satisfy required PR checks.
6. Merge only after all required checks are green and all blocking threads are resolved.

## Recovering an incompatible gate

The native integration prefixes anchored no-findings receipts with
`<!-- codex-review-receipt:v1 -->`. The parser strips only that exact leading
marker; the trusted reviewer, reviewed-commit anchor and short-SHA uniqueness
checks still apply. Duplicate markers/anchors and conflicting or unfinished verdicts
fail closed. Unknown prefixes and running summary tables are not verdicts. Unresolved
native Codex findings veto a pass across all heads.

When the old default-branch parser cannot validate its own repair PR:

1. Review the repair diff and run `node --test scripts/lib/*.test.mjs`.
2. Request `@codex review <full-head-sha>` once. Wait for the native bot's clean
   receipt on that exact final head and resolve every blocking thread.
3. As the repository owner, apply the `codex-gate-repair` label. The
   `pull_request: labeled` event creates a PR-evaluated required check. Do not use
   `workflow_dispatch` for recovery: GitHub does not evaluate those checks for PR rules.
   For another reviewed head, remove and reapply the label after its native review.
4. The workflow refuses any other actor, a different workflow/PR SHA, a fork,
   a closed/draft PR, or a missing prior trusted request and clean bot receipt.
   It then runs the repaired gate with a read-only token on GitHub-hosted runners.
5. Merge after all five required checks pass. Rerun affected Dependabot PR
   checks from the repaired default branch; review each new head after updating
   the branch. Scheduling and external controllers are outside this repair.

This recovery does not change branch rules or grant a check bypass. Normal PR
events continue to select default-branch helpers.
