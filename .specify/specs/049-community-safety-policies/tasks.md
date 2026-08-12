# Tasks 049 — Community Safety Policies

## Tasks

- [x] T001 Create a clean worktree and `codex/community-safety-policies` branch from
      fresh `origin/main` without touching the user's existing checkout changes.
- [x] T002 Recheck the current Pinterest policy stack, U.S. Copyright Office Section
      512 guidance, and official EU DSA notice/action sources.
- [x] T003 Write route/navigation/required-copy Playwright coverage and capture the red
      result before implementation.
- [ ] T004 Add Community Guidelines, Copyright & IP Policy, and Enforcement & Appeals
      content using the existing legal-document model.
- [ ] T005 Add localized static routes and discoverable legal/landing navigation.
- [ ] T006 Update Terms to incorporate the policies and complete the protective clauses.
- [ ] T007 Run the policy completeness and gated-feature negative audits.
- [ ] T008 Run focused e2e, lint, CSS lint, typechecks, build, repo baseline, and
      feature-memory verification; record evidence in `plan.md`.
- [ ] T009 Fill Process Memory, publish the branch, and open a ready-for-review PR with
      the SENAR Done Gate and external-legal-review warning.

## Process Memory

### Dead Ends

- None yet.

### Decisions

- The policies form separate public documents instead of growing the Terms-only
  acceptable-use section. This makes incorporated rules and enforcement procedures
  discoverable and independently updateable while retaining one shared renderer.
- Policy publication does not satisfy PRODUCT-PLAN D5/D6's external legal-review gate
  and does not activate the shared user-import surface.

### Known Issues

- External counsel must validate governing-law, consumer, DSA applicability,
  indemnity, and DMCA eligibility/agent-registration posture before the shared-import
  feature launches.
