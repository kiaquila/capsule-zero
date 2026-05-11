# SENAR Mapping

SENAR is the supervised verification layer for Capsule Zero. It does not replace spec-kit or the existing PR-only workflow — it makes the human/AI contract more explicit by requiring goal, scope, acceptance evidence, negative scenarios, and process memory in artifacts the team already produces.

This layer is **lightweight on purpose**:

- No new GitHub Actions check.
- No change to `pr-guard.yml`, `ai-review.yml`, `ci.yml`, `ai-command-policy.yml`, or `osv-scan` behavior.
- No change to branch-protection required checks or approvals.
- No new runtime dependency or npm script.

Enforcement is split: structural completeness of feature memory is enforced by `pr-guard.yml` (spec/plan/tasks must exist for `app/` changes); the SENAR Done Gate is enforced by the review agent and the human merge owner.

## Mapping

| SENAR practice              | Capsule Zero artifact                                                                                                       |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Task before code            | `.specify/specs/<feature-id>/spec.md` and `plan.md` before any `app/` change                                                |
| Scope boundaries            | one worktree, one branch, one PR + the `## Scope` (in/out) section in `spec.md`                                             |
| Acceptance criteria         | `## Requirements` (FR-###) and `### Acceptance Scenarios` in `spec.md`                                                      |
| Negative scenario           | `## Negative Scenarios` in `spec.md` (added by this layer)                                                                  |
| Evidence-based verification | `## Verification` table in `plan.md` (AC → Evidence), plus `npm run preflight`, `baseline-checks`, `guard`, and `AI Review` |
| Process memory              | `## Process Memory` (Dead Ends / Decisions / Known Issues) in `tasks.md`                                                    |
| Human supervision           | final merge authority + trusted human-triggered native AI review (`@codex review`, `@claude review once`)                   |

## Where Process Memory Lives

`Dead Ends`, `Decisions`, and `Known Issues` are **per-feature**, not global. Each feature accumulates its own under `.specify/specs/<feature-id>/tasks.md`. Rationale:

- A rejected approach makes sense next to the implementation it was rejected for; in a global file, the context decays within weeks.
- Searching across all features is a `git grep` away when needed.

## Completion Signal — SENAR Done Gate

A PR is merge-ready only when **all** of the following are true on the current head SHA:

- The active feature memory names a clear goal and scope (or the PR is infrastructure-only and explicitly opts out in the PR description).
- Every acceptance criterion has evidence in the PR diff, in `plan.md`, or in a linked check.
- At least one negative scenario is covered, or the spec explicitly waives the negative-scenario requirement with a one-line reason.
- `tasks.md` records the relevant dead ends, decisions, and known issues.
- Any remaining known issue is accepted by the human merge owner.
- The standard merge-ready conditions also hold: green required checks (`baseline-checks`, `guard`, `AI Review`), no blocking review findings on the head SHA, no merge conflicts.

This gate is mirrored as a checklist in `.github/pull_request_template.md` so the merge owner can confirm it without leaving the PR view.

## Scope Of Application

- SENAR **applies to every spec authored after this layer ships** (i.e. starting with `005-…`).
- It **does not retrofit** `001-capsule-zero-mvp`, `002-pipeline-hardening`, or `003-sprint-0-foundation`. Those folders keep their original shape; readers should not expect them to follow the SENAR template structure.
- Infrastructure-only PRs that do not touch `app/` are not required to carry feature memory at all (per `pr-guard.yml`); when they do choose to carry a spec folder, that folder should follow the SENAR template.

## Why Not Make It A Required CI Check

Considered and rejected for this layer. Reasons:

- The SENAR Done Gate is partly about _judgment_ (e.g. waiving a negative scenario), which is appropriate for human/review-agent verification, not regex parsing in CI.
- A reviewer can reject a PR that fails the gate without a workflow change.
- If real usage shows specific fields are routinely skipped, structural enforcement can be added later as a follow-up to `check-feature-memory.mjs`.
