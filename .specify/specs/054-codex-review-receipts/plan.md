# Plan 054 — Native Codex Review Receipts

## Approach

Extend the existing summary helper to strip only the observed service marker. Keep
its identity and anchor validation. Unblock the circular default-branch dependency
with an owner-labeled recovery that first verifies native review of its exact SHA.

## Verification

| Criterion              | Evidence                                                                                                                                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC-001                 | `node --test scripts/lib/codex-summary.test.mjs`: native v1 receipt regression passes.                                                                                                                       |
| AC-002                 | Same suite rejects forged/stale/anchorless/unknown/running evidence and requires uniqueness validation for abbreviations.                                                                                    |
| AC-003                 | `node --test scripts/lib/gate-repair.test.mjs` executes the actual YAML guard; owner/exact-head acceptance and invalid actor/SHA/PR/review rejection cases pass.                                             |
| AC-004                 | Workflow regression asserts read-only permissions and explicit trusted ref; diff preserves pinned actions, GitHub-hosted runners and default-branch selection for normal events.                             |
| AC-005                 | `go-test-workflow.test.mjs` executes the actual API test shell with a stub Go: both checks run in `api`, vet failure blocks tests, and setup uses the exact go.mod toolchain and SHA-pinned official action. |
| Repository validation  | All 36 `scripts/lib/*.test.mjs` tests, `npm run check:repo` and `git diff --check` pass.                                                                                                                     |
| Final-head integration | [PR #163](https://github.com/kiaquila/capsule-zero/pull/163) records native review and all five required checks; merge remains conditional on their success.                                                 |

## Reuse Check

Reuse `scripts/lib/codex-summary.mjs`, `ai-review-gate.mjs` and `ai-review.yml`.
No new product module, service, schema or alternative review engine is introduced.
