# GitHub-Hosted AI Review

This runbook owns Capsule Zero's required `AI Review` check.

## Operating Model

1. A pull request is opened or updated.
2. A connected human account comments `@codex review` on the final head.
3. OpenAI's native GitHub integration publishes a Codex review for that commit.
4. `.github/workflows/ai-review.yml` validates PR and submitted-review events. A
   PR-open/update run also polls for evidence.
5. `.github/workflows/ai-review-wakeup.yml` handles the human command and anchored
   Codex summary comments. If the PR-linked check has ended without success, it reruns
   that same check on the resolved PR head SHA.
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
- After bootstrap, helper scripts are loaded from the trusted default branch so a PR
  cannot weaken its own required gate.
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
5. Manually dispatch `AI Review` only for first-install bootstrap or a failed GitHub
   event delivery.
6. Merge only after all required checks are green and all blocking threads are resolved.
