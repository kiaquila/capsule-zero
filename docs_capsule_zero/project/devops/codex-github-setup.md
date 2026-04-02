# Codex GitHub Setup

This runbook defines the required external setup for Capsule Zero's native Codex GitHub integration.

## Purpose

The repository now owns review routing and merge policy, but Codex review and Codex task execution still depend on native OpenAI-hosted GitHub integration being enabled for this repository.

Use this checklist before running the validation matrix with `AI_REVIEW_AGENT=codex` or `AI_IMPLEMENTATION_AGENT=codex`.

## Required External Setup

1. Set up Codex cloud for the account that will own Capsule Zero orchestration.
2. Open Codex settings for GitHub repository integrations.
3. Enable Capsule Zero repository access.
4. Turn on `Code review` for `kiaquila/capsule-zero`.
5. Leave `Automatic reviews` turned off.

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

1. Confirm repository access and `Code review` are enabled in Codex settings.
2. Keep `AI_REVIEW_AGENT=codex`.
3. Open or update a test PR.
4. Run `AI Review` on that PR.
5. Confirm the gate posts a top-level PR comment containing `@codex review`.
6. Confirm Codex responds with a GitHub review on the same PR head SHA.
7. Confirm the gate turns green for `APPROVED` or `COMMENTED`, and red for `CHANGES_REQUESTED`.
8. Repeat once after pushing a new commit to verify SHA-sensitive rerouting.

## Residual Risks

- The repository-owned gate posts the native Codex trigger comment using GitHub Actions. This should work with Codex's GitHub integration, but it still needs live verification during the validation matrix.
- Codex GitHub review natively focuses on high-severity issues. Repository guidance in `AGENTS.md` may need tuning if Capsule Zero wants specific workflow or documentation misses treated as blocking.
