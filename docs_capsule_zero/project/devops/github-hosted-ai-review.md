# GitHub-Hosted AI Review

This runbook owns Capsule Zero's required `AI Review` check.

## Operating Model

1. A pull request is opened or updated.
2. A connected human account comments `@codex review` on the final head.
3. OpenAI's native GitHub integration publishes a Codex review for that commit.
4. `.github/workflows/ai-review.yml` runs on GitHub-hosted `ubuntu-latest`.
5. The repository gate validates the reviewer, head SHA, and finding severities.
6. Branch rules require the resulting `AI Review` check before merge.

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
4. Re-run `AI Review` only if GitHub did not automatically start a fresh run.
5. Merge only after all required checks are green and all blocking threads are resolved.
