# Implementation Plan: SENAR Process Layer

**Branch**: `feat/senar-process-layer` | **Date**: 2026-04-30 | **Spec**: `.specify/specs/004-senar-process-layer/spec.md`

## Summary

Add SENAR as a documented verification and memory layer across Capsule Zero docs, templates, constitution, and PR checklist without changing any runtime gate behavior.

## Technical Context

- **Runtime**: no runtime change. No new dependency. No new npm script.
- **Touched paths**:
  - `.specify/memory/constitution.md`
  - `.specify/templates/spec-template.md`, `plan-template.md`, `tasks-template.md`
  - `.specify/specs/004-senar-process-layer/{spec,plan,tasks}.md` (this folder)
  - `.github/pull_request_template.md`
  - `docs_capsule_zero/project/devops/senar-mapping.md` (new)
  - `docs_capsule_zero/project/devops/senar-mapping.md`
  - `AGENTS.md`
  - `CLAUDE.md`
- **Untouched (explicit)**: `.github/workflows/`, `scripts/`, `app/`, `mobile/`, `supabase/`.
- **Data changes**: none.

## Scope Boundaries

- **In scope**: documentation, markdown templates, constitution principles, PR checklist, dogfood feature folder.
- **Out of scope**: workflow logic, review parsing, branch protection defaults, retrofitting prior specs.

## Constitution Check

This change adds two new constitution principles. The change itself complies with the existing constitution:

- **Spec-First Development**: this PR carries `.specify/specs/004-senar-process-layer/{spec,plan,tasks}.md`.
- **Testable Boundaries**: each new field is verified by a concrete `grep`/file-existence check (see Verification table).
- **Test-First Bias**: documentation-only PR; verification is `grep` + `npm run preflight` rather than unit tests.
- **PR-Only Workflow**: lands through this PR; no direct push to `main`.
- **One Worktree Per Task**: this PR is one branch / one worktree.
- **Deployability Contract**: docs-only change; `app/` build and typecheck are not affected.
- **Simplicity**: no new abstraction is introduced; SENAR is expressed as explicit fields in existing templates plus one mapping doc.
- **Process Memory**: this `tasks.md` records dead ends, decisions, and known issues for the SENAR rollout itself.

## Verification

| Acceptance criterion | Evidence                                                                                                                                                                                                                                                                                                                                                    |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| US1 / FR-003         | `grep -nG '^## \(Goal\|Scope\|Negative Scenarios\) ' .specify/templates/spec-template.md` returns three lines (Goal, Scope, Negative Scenarios — each suffixed with the `_(mandatory)_` marker).                                                                                                                                                            |
| US2 / FR-004         | `grep -n "^## Verification" .specify/templates/plan-template.md` returns the new section header; the section contains an `Acceptance criterion \| Evidence` table.                                                                                                                                                                                          |
| US3 / FR-005         | `grep -nG '^\(## Process Memory\|### \(Dead Ends\|Decisions\|Known Issues\)\)\( \|$\)' .specify/templates/tasks-template.md` returns four lines covering `## Process Memory` and its three subsections.                                                                                                                                                     |
| US4 / FR-006         | `git grep "SENAR Done Gate" .github/pull_request_template.md` matches; the block contains the five SENAR checkpoints.                                                                                                                                                                                                                                       |
| FR-001               | `docs_capsule_zero/project/devops/senar-mapping.md` exists and contains the SENAR ↔ artifact mapping table plus a Completion Signal section.                                                                                                                                                                                                                |
| FR-002               | `.specify/memory/constitution.md` contains two new principle sections: Supervised Verification and Process Memory.                                                                                                                                                                                                                                          |
| FR-007               | `git grep -i "SENAR\|process memory" AGENTS.md CLAUDE.md docs_capsule_zero/project/devops/senar-mapping.md` returns matches in all three files.                                                                                                                                                                                                                |
| FR-008               | `git diff --name-only origin/main...HEAD` contains zero entries under `.github/workflows/` or `scripts/`.                                                                                                                                                                                                                                                   |
| SC-001               | `npm run preflight` exits 0; `baseline-checks`, `guard`, and `test` are green on the PR head SHA.                                                                                                                                                                                                                                                        |
| SC-002               | `git grep -L '## Negative Scenarios' -- '.specify/specs/0*/spec.md' ':!.specify/specs/001-capsule-zero-mvp/spec.md' ':!.specify/specs/002-pipeline-hardening/spec.md' ':!.specify/specs/003-sprint-0-foundation/spec.md'` returns empty after merge (grandfathered specs 001/002/003 are excluded via pathspec; every post-SENAR spec carries the section). |
| SC-003               | `.specify/specs/004-senar-process-layer/{spec,plan,tasks}.md` exist and pass the same `git grep` checks above against their own bodies.                                                                                                                                                                                                                     |

Negative scenario evidence:

- The change touches zero workflow files and zero scripts. Verifiable with `git diff --name-only origin/main...HEAD | grep -E '^(.github/workflows/|scripts/)'` returning empty.
- No runtime dependency added. Verifiable with `git diff origin/main -- package.json package-lock.json app/package.json app/package-lock.json` returning empty.

## Project Structure

```text
.specify/
├── memory/
│   └── constitution.md          # +2 principles (Supervised Verification, Process Memory)
├── specs/
│   └── 004-senar-process-layer/ # NEW dogfood folder
│       ├── spec.md
│       ├── plan.md
│       └── tasks.md
└── templates/
    ├── spec-template.md         # + Goal, Scope, Negative Scenarios
    ├── plan-template.md         # + Verification matrix
    └── tasks-template.md        # + Process Memory

.github/
└── pull_request_template.md     # + SENAR Done Gate

docs_capsule_zero/
└── project/
    └── devops/
        └── senar-mapping.md     # NEW

AGENTS.md                         # + SENAR completion contract
CLAUDE.md                         # + SENAR rules pointer
```

## Complexity Tracking

No new abstraction. SENAR is represented as explicit fields in existing artifacts plus one mapping document.

## Risks

- **Risk**: SENAR Done Gate could feel like process noise on tiny doc PRs. **Mitigation**: keep the gate to five checkpoints; the spec explicitly waives the negative-scenario requirement when there is none.
- **Risk**: Authors could keep using the old (pre-SENAR) spec shape on new specs. **Mitigation**: SC-002 + the SENAR Done Gate force the merge owner to notice.
- **Risk**: Existing specs (001/002/003) do not match the new shape and could confuse new agents. **Mitigation**: explicitly out of scope and called out in CLAUDE.md / AGENTS.md as "applies to specs created after this PR".
