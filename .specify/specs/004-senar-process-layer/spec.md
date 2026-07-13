# Feature Spec: SENAR Process Layer

**Feature Branch**: `feat/senar-process-layer`
**Created**: 2026-04-30
**Status**: Draft

## Goal

Add a lightweight SENAR supervised-verification layer to Capsule Zero so feature memory captures goal, scope, acceptance evidence, negative scenarios, and process memory without changing any GitHub Actions gate or branch-protection behavior.

## Scope

In scope:

- A SENAR mapping document under `docs_capsule_zero/project/devops/`.
- Two new engineering-process principles in `.specify/memory/constitution.md` (Supervised Verification, Process Memory).
- Augmented `.specify/templates/spec-template.md`, `plan-template.md`, and `tasks-template.md` with SENAR fields.
- A SENAR Done Gate checklist in `.github/pull_request_template.md`.
- SENAR completion expectations added to `AGENTS.md`, `CLAUDE.md`, and `docs_capsule_zero/project/devops/senar-mapping.md`.
- This `.specify/specs/004-senar-process-layer/` folder dogfooding the new shape.

Out of scope:

- Changing `pr-guard.yml`, `ci.yml`, or `osv-scan.yml` workflow logic.
- Changing branch-protection required checks or approvals.
- Retrofitting `.specify/specs/001-capsule-zero-mvp`, `002-pipeline-hardening`, or `003-sprint-0-foundation` to the new shape. SENAR applies to specs created after this PR merges.
- Adding any new runtime dependency, npm script, or Node module.

## User Scenarios & Testing

### User Story 1 — Verifiable Feature Memory (Priority: P1)

As an implementation contributor, I want every new feature spec to ask explicitly for goal, scope (in/out), acceptance criteria, and negative scenarios, so that I implement against documented behavior instead of inferred intent.

**Why this priority**: Today our spec template only asks for User Stories + Edge Cases. "Edge cases" are not the same as a negative scenario, and there is no explicit Goal/Scope split. This is the smallest change with the highest signal-to-noise improvement on every future spec.

**Independent Test**: Open `.specify/templates/spec-template.md` after merge and confirm the new sections (Goal, Scope in/out, Negative Scenarios) are present and that the existing User Stories / Acceptance Scenarios / Requirements / Success Criteria sections are preserved.

**Acceptance Scenarios**:

1. **Given** a fresh feature spec is being authored, **When** the agent copies the template, **Then** the template contains explicit `## Goal`, `## Scope` (in/out), and `## Negative Scenarios` sections in addition to the existing spec-kit sections.

### User Story 2 — Verification Evidence In Plan (Priority: P1)

As a reviewer, I want each `plan.md` to carry an explicit table mapping every acceptance criterion to evidence, so that a summary cannot stand in for a check, command, test, screenshot, or diff link.

**Why this priority**: This is the SENAR rule that prevents AI-summary-as-evidence drift. Without it, reviewers and the human merge owner cannot quickly tell which AC is verified and how.

**Independent Test**: Open `.specify/templates/plan-template.md` and confirm the new `## Verification` section with an `Acceptance criterion | Evidence` table and a `Negative scenario evidence` line is present.

**Acceptance Scenarios**:

1. **Given** an author writes a plan for a new feature, **When** they reach the Verification section, **Then** they fill a table that lists every AC-id from the spec with concrete evidence (command, test, screenshot, diff, or manual check).

### User Story 3 — Process Memory Per Feature (Priority: P1)

As a future agent inheriting an in-flight or completed feature, I want each feature's `tasks.md` to record dead ends, decisions, and known issues, so that I do not repeat discarded approaches or silently undo accepted tradeoffs.

**Why this priority**: This is the second SENAR rule that compounds in value over time — the value of process memory is highest exactly when context has decayed.

**Independent Test**: Open `.specify/templates/tasks-template.md` and confirm a `## Process Memory` section with `### Dead Ends`, `### Decisions`, and `### Known Issues` subsections is present at the end of the template.

**Acceptance Scenarios**:

1. **Given** an agent finishes a feature task, **When** they update `tasks.md`, **Then** they record any rejected approaches, made decisions, and accepted limitations under Process Memory before declaring the work complete.

### User Story 4 — SENAR Done Gate Visible In PR (Priority: P2)

As the human merge owner, I want a SENAR Done Gate checklist visible directly in the PR description, so that the review-and-merge step can confirm the SENAR contract without crawling the spec/plan/tasks files.

**Why this priority**: GitHub PR is where the merge decision is actually made. Putting the gate inline removes friction.

**Independent Test**: Open `.github/pull_request_template.md` after merge and confirm the SENAR Done Gate block contains the five checkpoints (goal/scope, AC evidence, negative scenario, process memory, accepted known issues).

**Acceptance Scenarios**:

1. **Given** an author opens a new PR, **When** they fill in the description, **Then** the SENAR Done Gate is rendered as a checklist that the merge owner can verify before merging.

### Edge Cases

- A PR that touches only documentation or workflow files. The PR Guard does not require feature memory in that case; the SENAR Done Gate may be skipped or partially marked, with a note in the PR.
- A SENAR spec that genuinely has no negative scenario worth listing. The spec must explicitly waive the negative-scenario requirement instead of leaving the section empty.

## Negative Scenarios

- **Done Gate bypass via mass N/A**: a PR author marks every SENAR Done Gate checkpoint as N/A without justification. Detection: the reviewer flags any PR where more than one checkpoint is N/A without a one-line reason. Resolution: the human merge owner blocks the merge until the PR description carries explicit reasons or actual evidence.
- **Templates drift back to pre-SENAR shape**: an unrelated refactor PR removes `## Goal`, `## Scope`, `## Negative Scenarios`, `## Verification`, or `## Process Memory` headers from `.specify/templates/*`. Detection: SC-002 verification over post-SENAR `.specify/specs/0*/spec.md` (with grandfathered 001/002/003 excluded) starts returning paths once the first post-SENAR spec is authored against the broken template. Resolution: revert the template change and require a SENAR-amendment PR before re-introducing it.
- **Process Memory filled with boilerplate**: a contributor fills `## Process Memory` with plausible but content-free text (e.g. "considered alternatives, picked the simpler one") that does not name concrete artifacts, decisions, or rejected approaches. Detection: the reviewer flags entries that lack any of file path, command, link, or named tradeoff. Resolution: request a rewrite before approving.

## Requirements

### Functional Requirements

- **FR-001**: A document at `docs_capsule_zero/project/devops/senar-mapping.md` MUST map the seven SENAR practices to existing Capsule Zero artifacts (spec, plan, tasks, PR template, gates, human merge authority).
- **FR-002**: `.specify/memory/constitution.md` MUST include two new engineering-process principles: Supervised Verification and Process Memory.
- **FR-003**: `.specify/templates/spec-template.md` MUST include explicit `## Goal`, `## Scope` (in/out), and `## Negative Scenarios` sections in addition to the existing spec-kit sections.
- **FR-004**: `.specify/templates/plan-template.md` MUST include a `## Verification` section with an AC → Evidence table and a Negative scenario evidence line.
- **FR-005**: `.specify/templates/tasks-template.md` MUST include a `## Process Memory` section with Dead Ends, Decisions, and Known Issues subsections.
- **FR-006**: `.github/pull_request_template.md` MUST include a SENAR Done Gate block with the five checkpoints from the SENAR mapping.
- **FR-007**: `AGENTS.md`, `CLAUDE.md`, and `docs_capsule_zero/project/devops/senar-mapping.md` MUST reflect the SENAR completion contract so any contributor operating in this repo finds the rules at the canonical entry points.
- **FR-008**: This change MUST NOT modify any `.github/workflows/*.yml` file or any script under `scripts/`.

## Success Criteria

### Measurable Outcomes

- **SC-001**: After merge, `npm run preflight` passes locally and required GitHub checks (`baseline-checks`, `guard`, `AI Review`, `test`) all pass on the PR.
- **SC-002**: Every spec in `.specify/specs/` created after this PR merges contains an explicit `## Negative Scenarios` section, verifiable via `git grep -L '## Negative Scenarios' -- '.specify/specs/0*/spec.md' ':!.specify/specs/001-capsule-zero-mvp/spec.md' ':!.specify/specs/002-pipeline-hardening/spec.md' ':!.specify/specs/003-sprint-0-foundation/spec.md'` returning empty. Grandfathered specs `001-capsule-zero-mvp`, `002-pipeline-hardening`, and `003-sprint-0-foundation` are excluded via pathspec.
- **SC-003**: This PR itself dogfoods the new shape: `.specify/specs/004-senar-process-layer/{spec,plan,tasks}.md` contains every required SENAR field and serves as the reference example for the next spec author.
