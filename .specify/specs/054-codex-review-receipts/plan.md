# Plan 054 — Native Codex Review Receipts

## Approach

Extend the existing summary helper to strip only the observed service marker. Keep
its identity and anchor validation. Unblock the circular default-branch dependency
with an owner-triggered PR-label recovery that first verifies native review of its exact SHA.

## Verification

| Criterion              | Evidence                                                                                                                                                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC-001                 | `node --test scripts/lib/codex-summary.test.mjs`: native v1 receipt regression passes.                                                                                                                                                                 |
| AC-002                 | Same suite rejects forged/stale/anchorless/unknown/running evidence and requires uniqueness validation for abbreviations.                                                                                                                              |
| AC-003                 | `node --test scripts/lib/gate-repair.test.mjs` executes the actual YAML guard; owner/exact-head acceptance and invalid actor/SHA/PR/review rejection cases pass.                                                                                       |
| AC-004                 | Workflow regression asserts read-only permissions and explicit trusted ref; diff preserves pinned actions, GitHub-hosted runners and default-branch selection for normal events.                                                                       |
| Repository validation  | All 46 `scripts/lib/*.test.mjs` tests, `npm run check:repo` and `git diff --check` pass.                                                                                                                                                               |
| AC-005                 | `node --test scripts/lib/codex-events.test.mjs` executes the actual YAML filter and runtime router for created/edited, stale/untrusted/malformed signals and old-comment updates.                                                                      |
| AC-006                 | `node --test scripts/lib/ai-review-gate.test.mjs scripts/lib/github-actions.test.mjs` executes the actual gate and rerun path, including head races, unresolved findings, native formal severities, active completion and duplicate signals.           |
| Local preflight        | `npm run preflight` attempted on 2026-10-15: feature-memory, repository/API contract and lint passed; CSS process stopped with disk exhaustion (116 MiB free). Newly installed local dependencies removed. Required GitHub CI verifies the full suite. |
| Final-head integration | [PR #163](https://github.com/kiaquila/capsule-zero/pull/163) records native review and all five required checks; merge remains conditional on their success.                                                                                           |

## Reuse Check

Reuse `scripts/lib/codex-summary.mjs`, `ai-review-gate.mjs` and `ai-review.yml`.
No new product module, service, schema or alternative review engine is introduced.
