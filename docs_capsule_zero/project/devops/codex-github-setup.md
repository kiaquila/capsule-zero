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
6. Enable `Automatic reviews` and set the review trigger to `On every push` under `Settings -> Code review -> Repository preferences`.

Automatic reviews are enabled so every pushed head gets its own Codex verdict, because the `AI Review` gate validates the current head SHA on each push. This does not change repository-owned routing: `AI_REVIEW_AGENT` stays the source of truth for the canonical reviewer — auto-review only controls _when_ Codex reviews, not _which_ agent is canonical.

## Required Repository State

- `AGENTS.md` must contain the canonical review rules for Codex.
- `docs_capsule_zero/project/devops/review-contract.md` must remain aligned with the expected GitHub review output.
- `AI_REVIEW_AGENT=codex` when Codex is the selected reviewer.
- `AI_IMPLEMENTATION_AGENT=codex` only when Codex should own implementation for the current cycle.

## Canonical Native Commands

- Review
  - `@codex review`
- Implementation or orchestration work
  - start the task from Codex app or Codex web and let Codex open or update its own PR
  - `@codex <task brief>` on an existing PR is optional follow-up orchestration, not the canonical branch-mutating implementation path

Codex receives repository context from the PR, the triggering comment, and repository guidance files such as `AGENTS.md`.
The comment must be posted by a connected human account. Comments authored by `github-actions[bot]` are acknowledged by the connector but do not start a real Codex review task.
The repository must also have a Codex cloud environment. Without it, the connector replies with `create an environment for this repo` instead of starting review.

## Expected Review Behavior

According to OpenAI's GitHub integration docs:

- Codex reviews automatically on every pushed head; `@codex review` from a connected human account remains available to request it manually.
- When Codex has findings it posts a standard GitHub pull-request review with `P0-P3` inline badges.
- Codex uses `AGENTS.md` review guidance when present.
- A clean **automatic** review signals only with a `👍` reaction on the PR body, which the gate does **not** consume (`👍`-support is deferred); a clean head therefore still needs a human `@codex review`, whose no-findings reply is a `Codex Review:` summary comment anchored to the reviewed commit that the gate does consume.

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

## Current Implementation Constraint

Live validation on April 3, 2026 showed the following behavior for GitHub-triggered `@codex <task brief>` cloud tasks on PRs:

- the connector accepted the task
- Codex completed the cloud task and produced a summary comment
- the summary reported `git push` failure because no remote push destination was configured in that task environment
- the active PR branch did not update

Capsule Zero therefore treats Codex app or Codex web as the canonical remote-first implementation entrypoint. In that model, Codex owns branch creation and PR publication for implementation work, while GitHub comments remain the canonical native trigger for Codex review.

## Residual Risks

- Codex review is native, but the canonical trigger must come from a connected human account rather than `github-actions[bot]`.
- Missing Codex cloud environment now fails fast in `AI Review`, but it still blocks review until the external setup is fixed.
- Codex GitHub review natively focuses on high-severity issues. Repository guidance in `AGENTS.md` may need tuning if Capsule Zero wants specific workflow or documentation misses treated as blocking.
- Comment-driven Codex task behavior on existing PR branches may improve over time, but it is not relied on for Capsule Zero's canonical implementation loop unless a future validation pass proves stable GitHub write-back.
