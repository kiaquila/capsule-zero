# Tasks: SENAR Process Layer

**Input**: `.specify/specs/004-senar-process-layer/spec.md`, `plan.md`

## Phase 1: Setup

- [x] T001 Confirm active feature folder `.specify/specs/004-senar-process-layer/` and branch `feat/senar-process-layer`.
- [x] T002 Read upstream SENAR reference (`unicorn-hub` PR #3) and current Capsule Zero state for all touched files.

## Phase 2: Documentation

- [x] T003 Add `docs_capsule_zero/project/devops/senar-mapping.md` with the SENAR ↔ Capsule Zero mapping and completion signal.
- [x] T004 Update `docs_capsule_zero/project/devops/ai-pr-workflow.md` with a SENAR Done Gate section near the Merge-Ready Rule.

## Phase 3: Constitution

- [x] T005 Add two new principles to `.specify/memory/constitution.md`: Supervised Verification and Process Memory. Place them after existing product-focused sections so the product principles stay first.

## Phase 4: Templates

- [x] T006 Update `.specify/templates/spec-template.md` to add `## Goal`, `## Scope` (in/out), and `## Negative Scenarios` sections without removing the existing spec-kit User Stories / Requirements / Success Criteria structure.
- [x] T007 Update `.specify/templates/plan-template.md` to add a `## Verification` section with an `Acceptance criterion | Evidence` table and a Negative scenario evidence line.
- [x] T008 Update `.specify/templates/tasks-template.md` to add a `## Process Memory` section with Dead Ends / Decisions / Known Issues subsections.

## Phase 5: Pull Request Surface

- [x] T009 Update `.github/pull_request_template.md` to add a SENAR Done Gate block with the five checkpoints.

## Phase 6: Agent Onboarding

- [x] T010 Update `AGENTS.md` Delivery Workflow section with the SENAR completion contract.
- [x] T011 Update `CLAUDE.md` to point at SENAR and the new templates as the canonical contract for new specs.

## Phase 7: Verification

- [x] T012 Run `npm run preflight` locally; confirm exit code 0.
- [x] T013 Run the `git grep` checks listed in `plan.md` Verification table against the working tree.
- [x] T014 Open PR, attach SENAR Done Gate filled out, and request `@codex review`.

## Process Memory

### Dead Ends

- Considered placing `Dead Ends / Decisions / Known Issues` in a single global file (e.g. `docs_capsule_zero/process-memory.md`). Rejected because the value of process memory drops sharply when divorced from its feature context — a future agent reading `specs/015-opr/tasks.md` should find the rejected OPR algorithms next to the working one, not in a separate global file. unicorn-hub also keeps process memory per-feature.
- Considered making the SENAR Done Gate a required GitHub check (extending `pr-guard.yml`). Rejected for this PR because the spec scope explicitly excludes workflow changes; structural enforcement can be a follow-up after the human-and-review-agent loop has run on at least one real SENAR-shaped PR.
- Considered renaming the existing `Edge Cases` section in `spec-template.md` to `Negative Scenarios`. Rejected because edge cases (boundary inputs, error states) and negative scenarios (security/abuse/rejection paths) overlap but are not identical — keeping both gives authors the right shape for each.

### Decisions

- **Two principles, not one.** The SENAR contract has two separable obligations: prove every AC with evidence (Supervised Verification), and persist process context across agent handoffs (Process Memory). Splitting them keeps each principle quotable and reviewable on its own.
- **Augment, don't replace, the spec-kit templates.** The current `spec-template.md` is elaborate (User Stories with priorities, phases, etc.) and matches how `001-capsule-zero-mvp` was authored. The SENAR fields are added on top so existing patterns survive and only new specs gain the new fields.
- **Dogfood in the same PR.** This `004-senar-process-layer/` folder is itself filled out using the new shape. That gives reviewers and the next author a concrete example.
- **No retrofit of 001/002/003.** Per user direction, SENAR applies only to specs authored after this PR merges. The cost of retrofitting would not buy proportional value on already-shipped or in-flight work.
- **Mapping doc lives under `docs_capsule_zero/project/devops/`** alongside `ai-pr-workflow.md` and `review-contract.md`, not at repo root. Reason: it is process tooling, not a product surface.

### Known Issues

- `pr-guard.yml` still only enforces feature-memory completeness _structurally_ (spec/plan/tasks all present). It does not parse SENAR field content. The SENAR Done Gate is enforced by the human merge owner and the review agent, not by CI. This matches unicorn-hub's chosen tradeoff and is documented in `senar-mapping.md`.
- `.specify/specs/001-capsule-zero-mvp`, `002-pipeline-hardening`, and `003-sprint-0-foundation` do not match the new shape. New agents reading those folders will see the older format. AGENTS.md and CLAUDE.md call this out explicitly so it does not cause confusion.
- The `osv-scan` workflow is not part of the SENAR scope. If `osv-scan` is later promoted to a required check (per `ai-pr-workflow.md`), the SENAR Done Gate text in the PR template may need a small update referencing it.
