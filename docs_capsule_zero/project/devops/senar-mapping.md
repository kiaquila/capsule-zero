# SENAR Mapping

SENAR is the supervised verification layer for Capsule Zero. It does not replace spec-kit or the existing PR-only workflow — it makes the delivery contract explicit by requiring goal, scope, acceptance evidence, negative scenarios, and process memory in artifacts the team already produces.

Enforcement is split across three layers:

- **Structural completeness** of feature memory is enforced by `pr-guard.yml` (spec/plan/tasks must exist for product-root changes under `app/`, `api/`, `worker/`, `web/`, or `mobile/`).
- **Behavioral verification** is enforced by the required GitHub check **`test`** (`.github/workflows/test.yml`), introduced by spec `025-e2e-tests`. The check runs the Playwright suite in `tests/e2e/` against the running web app. Every spec ≥ 025 must have at least one failing-then-passing test landed before the implementation that makes it green; the SENAR Done Gate row in the PR template binds that evidence to the merge decision.
- **Done-Gate judgment** (negative-scenario waiver, accepted known issues, process memory quality) is enforced by the human merge owner.

The SENAR rollout did not change `pr-guard.yml`, `ci.yml`, `osv-scan.yml`, or branch-protection approvals. Its only new automated gate was `test`.

## Mapping

| SENAR practice              | Capsule Zero artifact                                                                                                       |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Task before code            | `.specify/specs/<feature-id>/spec.md` and `plan.md` before any product-root change                                          |
| Scope boundaries            | one worktree, one branch, one PR + the `## Scope` (in/out) section in `spec.md`                                             |
| Acceptance criteria         | `## Requirements` (FR-###) and `### Acceptance Scenarios` in `spec.md`                                                      |
| Negative scenario           | `## Negative Scenarios` in `spec.md` (added by this layer)                                                                  |
| Evidence-based verification | `## Verification` table in `plan.md` (AC → Evidence), plus `npm run preflight`, `baseline-checks`, `guard`, `AI Review`, and `test` |
| Process memory              | `## Process Memory` (Dead Ends / Decisions / Known Issues) in `tasks.md`                                                    |
| Human supervision           | final review and merge authority                                                                                           |

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
- The standard merge-ready conditions also hold: green required checks (`baseline-checks`, `guard`, `AI Review`, `test`), no blocking review findings on the head SHA, no merge conflicts.

This gate is mirrored as a checklist in `.github/pull_request_template.md` so the merge owner can confirm it without leaving the PR view.

## Scope Of Application

- SENAR **applies to every spec authored after this layer ships** (i.e. starting with `005-…`).
- It **does not retrofit** `001-capsule-zero-mvp`, `002-pipeline-hardening`, or `003-sprint-0-foundation`. Those folders keep their original shape; readers should not expect them to follow the SENAR template structure.
- Infrastructure-only PRs that do not touch product roots (`app/`, `api/`, `worker/`, `web/`, or `mobile/`) are not required to carry feature memory at all (per `pr-guard.yml`); when they do choose to carry a spec folder, that folder should follow the SENAR template.

## Why The Split (Judgment vs CI)

The SENAR Done Gate has both objective and judgment-shaped parts. The split reflects that:

- **Objective**: "does the acceptance criterion actually hold against the running app?" — that is now enforced automatically by the `test` GitHub check on every PR. Specs ≥ 025 introduce a failing-then-passing test for each acceptance criterion; the gate is green only when the suite passes on the head SHA.
- **Judgment**: waiving a negative scenario, accepting a known issue, and grading the quality of process memory remain human calls. They are confirmed via the SENAR Done Gate checklist in the PR template, not via regex parsing in CI.

If `test` proves stable, additional structural enforcement (e.g. SENAR-field parsing in `check-feature-memory.mjs`) can still be added later as a follow-up.
