# Migration Validation Matrix

This runbook records the acceptance matrix that was used to remove legacy PowerShell review adapters and local worktree scripts.

Legacy migration artifacts were removed after all scenarios below passed.

## Preconditions

- `baseline-checks`, `guard`, and `AI Review` are green on the current migration branch.
- `osv-scan` has run on the current migration branch or has been consciously reviewed as a non-required dependency-security signal.
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
- app product changes are blocked unless the PR includes complete feature memory
- repository baseline validation includes app typecheck and app build through `baseline-checks`
- the PR remains within the existing Capsule Zero PR-first workflow contract

## Completed Evidence

- `implement=claude, review=claude` validated on PR `#3`
- `implement=claude, review=codex` validated on PR `#7`
- `implement=codex, review=claude` validated on PR `#10`
- `implement=codex, review=codex` validated on PR `#10`

## Cleanup Outcome

1. Legacy PowerShell review adapters removed.
2. Local worktree orchestration scripts removed.
3. Outdated self-hosted runner workflow removed.
4. Repository docs updated to the final cloud-native operating model.

## Pipeline Hardening Addendum

The Unicorn Hub comparison hardening adds:

- root `npm run preflight`
- trusted default-branch gate scripts for `guard` and `AI Review`
- complete feature-memory enforcement for `app/` changes
- app typecheck and build inside the required `baseline-checks` job
- `osv-scan` dependency vulnerability scanning as a visible, non-required security signal
