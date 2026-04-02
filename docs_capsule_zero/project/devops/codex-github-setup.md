# Codex GitHub Setup

This runbook defines the required external setup for Capsule Zero's native Codex GitHub integration.

## Purpose

The repository now owns review routing and merge policy, but Codex review and Codex task execution still depend on native OpenAI-hosted GitHub integration being enabled for this repository.

Use this checklist before running the validation matrix with `AI_REVIEW_AGENT=codex` or `AI_IMPLEMENTATION_AGENT=codex`.

## Required External Setup

1. Set up Codex cloud for the account that will own Capsule Zero orchestration.
2. Open Codex settings for GitHub repository integrations.
3. Enable Capsule Zero repository access.
4. Create a Codex cloud environment for `kiaquila/capsule-zero` under `Settings -> Environments`.
5. Turn on `Code review` for `kiaquila/capsule-zero`.
6. Leave `Automatic reviews` turned off.

Automatic reviews must stay disabled because Capsule Zero keeps reviewer selection under repository policy through `AI_REVIEW_AGENT`.

## Required Repository State

- `AGENTS.md` must contain the canonical review rules for Codex.
- `docs_capsule_zero/project/devops/review-contract.md` must remain aligned with the expected GitHub review output.
- `AI_REVIEW_AGENT=codex` when Codex is the selected reviewer.
- `AI_IMPLEMENTATION_AGENT=codex` only when Codex should own implementation for the current cycle.

## Canonical Native Commands

- Review
  - `@codex review`
- Implementation or orchestration work
  - `@codex <task brief>`

Codex receives repository context from the PR, the triggering comment, and repository guidance files such as `AGENTS.md`.
The comment must be posted by a connected human account. Comments authored by `github-actions[bot]` are acknowledged by the connector but do not start a real Codex review task.
The repository must also have a Codex cloud environment. Without it, the connector replies with `create an environment for this repo` instead of starting review.

## Expected Review Behavior

According to OpenAI's GitHub integration docs:

- Codex review is requested through a PR comment with `@codex review`.
- Codex posts a standard GitHub pull-request review.
- Codex uses `AGENTS.md` review guidance when present.
- Codex Automatic reviews are optional and should remain off for Capsule Zero.

## Capsule Zero-Specific Requirements

When `AI Review` routes review to Codex, the resulting GitHub review must:

- target the current PR head SHA
- be published by `chatgpt-codex-connector[bot]`
- use `APPROVED`, `COMMENTED`, or `CHANGES_REQUESTED`
- use native Codex inline review comments with `P0-P3` severity badges when findings exist

If Codex does not emit that contract, `AI Review` fails closed by design.

## First Live Validation

1. Confirm repository access, a Codex cloud environment, and `Code review` are enabled in Codex settings.
2. Keep `AI_REVIEW_AGENT=codex`.
3. Open or update a test PR.
4. Post `@codex review` from a connected human Codex account on that PR.
5. Run `AI Review` on that PR.
6. Confirm Codex responds with a GitHub review on the same PR head SHA.
7. Confirm the gate turns green for `APPROVED` or `COMMENTED`, and red for `CHANGES_REQUESTED`.
8. Repeat once after pushing a new commit to verify SHA-sensitive rerouting.

## Residual Risks

- Codex review is native, but the canonical trigger must come from a connected human account rather than `github-actions[bot]`.
- Missing Codex cloud environment now fails fast in `AI Review`, but it still blocks review until the external setup is fixed.
- Codex GitHub review natively focuses on high-severity issues. Repository guidance in `AGENTS.md` may need tuning if Capsule Zero wants specific workflow or documentation misses treated as blocking.
