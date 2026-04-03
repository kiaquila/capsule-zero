# Migration Validation Matrix

This runbook defines the acceptance matrix for removing legacy PowerShell review adapters and local worktree scripts.

Legacy migration artifacts may be removed only after all scenarios below pass.

## Preconditions

- `baseline-checks`, `guard`, and `AI Review` are green on the current migration branch.
- Claude GitHub Actions workflows are enabled and can access `ANTHROPIC_API_KEY`.
- Codex GitHub integration is enabled for `kiaquila/capsule-zero`.
- A Codex cloud environment exists for `kiaquila/capsule-zero`.
- Codex `Code review` is enabled for the repository.
- Codex `Automatic reviews` remains disabled.
- `AGENTS.md`, `CLAUDE.md`, `ai-orchestration-protocol.md`, and `review-contract.md` are current.

## Matrix

### 1. implement=claude, review=claude

- Set `AI_IMPLEMENTATION_AGENT=claude`
- Set `AI_REVIEW_AGENT=claude`
- Post `@claude <task brief>` on a PR or issue
- Confirm Claude implementation runs on the expected branch or PR head
- Post `@claude review once` from a trusted actor on the PR head under test
- Confirm `.github/workflows/claude-review.yml` updates a `claude[bot]` top-level PR comment with `AI_REVIEW_AGENT`, `AI_REVIEW_SHA`, and `AI_REVIEW_OUTCOME`
- Confirm the gate validates the matching Claude comment output

### 2. implement=claude, review=codex

- Set `AI_IMPLEMENTATION_AGENT=claude`
- Set `AI_REVIEW_AGENT=codex`
- Post `@claude <task brief>`
- Confirm Claude implementation runs normally
- Post `@codex review` from a connected human Codex account on the PR head under test
- Confirm Codex posts a matching GitHub review
- Confirm the gate validates the review result

### 3. implement=codex, review=claude

- Set `AI_IMPLEMENTATION_AGENT=codex`
- Set `AI_REVIEW_AGENT=claude`
- Start a Codex cloud implementation task from Codex app or Codex web against `kiaquila/capsule-zero`
- Confirm Codex opens or updates the expected pull request for that task
- Post `@claude review once` from a trusted actor on the Codex-authored PR head under test
- Confirm `.github/workflows/claude-review.yml` updates a `claude[bot]` top-level PR comment with `AI_REVIEW_AGENT`, `AI_REVIEW_SHA`, and `AI_REVIEW_OUTCOME`
- Confirm the gate validates the Claude review result
- GitHub-triggered `@codex <task brief>` comments on an existing PR may be used as an exploratory signal during migration, but they do not count as pass criteria for this row unless the task demonstrably updates the active PR branch

### 4. implement=codex, review=codex

- Set `AI_IMPLEMENTATION_AGENT=codex`
- Set `AI_REVIEW_AGENT=codex`
- Start a Codex cloud implementation task from Codex app or Codex web against `kiaquila/capsule-zero`
- Confirm Codex opens or updates the expected pull request for that task
- Post `@codex review` from a connected human Codex account on the Codex-authored PR head under test
- Confirm Codex posts a matching GitHub review
- Confirm the gate validates the review result

## Pass Criteria

Each matrix row passes only when all of the following are true:

- no local machine is required
- canonical trigger uses the selected vendor's native remote surface
- mismatched GitHub comment triggers are rejected by repository policy when comments are the selected control surface
- `AI Review` remains the only required review check
- `AI Review` fails closed when the selected reviewer does not produce a valid result
- the selected reviewer result is matched to the current PR head SHA
- the PR remains within the existing Capsule Zero PR-first workflow contract

## Current Evidence

- `implement=claude, review=claude` validated on PR `#3`
- `implement=claude, review=codex` validated on PR `#7`
- `review=claude` validated again on fresh PR `#9`
- GitHub-triggered `@codex <task brief>` on PRs `#7` and `#9` started native Codex cloud tasks but did not update the active PR branch; Codex summary output reported `git push` failure because no remote push destination was configured in the task environment
- Until Codex app or web is used to create the implementation PR directly, rows 3 and 4 remain open by design

## Removal Gate

After every row passes:

1. Remove legacy PowerShell review adapters.
2. Remove local worktree orchestration scripts.
3. Remove outdated self-hosted runner workflows and docs.
4. Re-run `baseline-checks`, `guard`, and `AI Review`.
