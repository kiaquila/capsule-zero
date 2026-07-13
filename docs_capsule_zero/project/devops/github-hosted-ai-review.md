# GitHub-Hosted AI Review

This runbook owns Capsule Zero's required `AI Review` check.

## Operating Model

1. A pull request is opened or updated.
2. A connected human account comments `@codex review` on the final head.
3. OpenAI's native GitHub integration publishes a Codex review for that commit.
4. The human command and the submitted Codex review both wake
   `.github/workflows/ai-review.yml`; a PR-open/update run also polls for evidence.
5. Every validation runs on GitHub-hosted `ubuntu-latest`.
6. The repository gate validates the reviewer, head SHA, and finding severities.
7. Branch rules require the resulting `AI Review` check before merge.

No local process, self-hosted runner, Claude CLI, Codex CLI, launch agent, or local
credential is part of this flow.

## Required Repository State

- Codex GitHub access and Code review are enabled for `kiaquila/capsule-zero`.
- A Codex cloud environment exists for the repository.
- Automatic Codex reviews remain off; the canonical trigger is the human-authored
  `@codex review` comment.
- Branch rules require `baseline-checks`, `guard`, `AI Review`, and `test`.
- `scripts/resolve-pr-context.mjs` and `scripts/ai-review-gate.mjs` exist on
  `main`.

## Security Model

- The workflow token is read-only.
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
4. The submitted Codex review automatically starts a fresh validation if the polling
   run has already ended.
5. Manually dispatch `AI Review` only for first-install bootstrap or a failed GitHub
   event delivery.
6. Merge only after all required checks are green and all blocking threads are resolved.
