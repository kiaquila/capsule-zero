# Feature Spec: GSD Architecture Validation

## Goal

Create a separate-branch architecture validation artifact that evaluates whether
GSD Core planning convergence should be connected around founder stack approval
and records the confirmed stack posture.

## Scope

- Validate current `open-gsd/gsd-core` setup and convergence workflow through
  Context7 documentation and a pinned CLI installer probe.
- Review current Phase 4/Sprint 0 architecture evidence from repository docs,
  migrations, API contracts, and runtime checks.
- Add a durable report under
  `docs_capsule_zero/project/architecture/gsd-convergence-validation.md`.
- Update the Phase 5 entrance checklist so GSD-style architecture convergence is
  an explicit approval checkpoint.
- Avoid committing GSD-generated `.planning/` files or making GSD a required CI
  gate before the owner accepts that governance change.

## User Story

As the founder/product lead, I want a second planning-convergence lens over the
accepted architecture around final approval so that hidden stack risks are found
or consciously waived before real provider registration and Phase 5 feature
implementation.

## Negative Scenarios

- If native GSD slash commands cannot run in the current Codex surface, the
  report must say so and must not claim a formal multi-reviewer convergence
  pass.
- If GSD creates local or global agent artifacts during probing, the repository
  must not accidentally commit those artifacts.
- If the review finds setup blockers but no stack-replacement blocker, the
  architecture should be kept while blockers are moved into Sprint 0 gates.

## Requirements

- **FR-001**: The branch must document the GSD Core version, setup probe, and
  formal runbook for a future native convergence run.
- **FR-002**: The branch must compare the accepted architecture against current
  repo evidence rather than only against older Phase 4 documents.
- **FR-003**: The output must distinguish stack-replacement findings from
  approval/provisioning blockers.
- **FR-004**: The output must preserve `.specify`, ADRs, and architecture docs
  as the source of truth unless the owner later approves a `.planning/`
  governance change.
- **FR-005**: The Phase 5 entrance checklist must name the convergence
  checkpoint around founder approval.

## Success Criteria

- The validation report exists and lists keep/amend/defer decisions for the
  accepted stack.
- The report names remaining Sprint 0 blockers without claiming they are stack
  replacement reasons.
- Local validation evidence is captured for repo baseline, API contract, runtime
  env examples, runtime tooling, and GSD installer feasibility.
- The branch can be reviewed independently from product-code work.
