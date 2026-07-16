# Tasks: Product Rebuild Plan

## Planning and source-of-truth updates

- [x] T001 Refresh GitHub state and work from the current PR head based on `origin/main`.
- [x] T002 Add `PRODUCT-PLAN.md` with accepted decisions, open founder gates, four delivery stages, and doc-debt ownership.
- [x] T003 Add `PRODUCT-RESEARCH.md` as the evidence base and clearly subordinate decisions to the plan.
- [x] T004 Update `AGENTS.md`, `CLAUDE.md`, constitution, and market context to point at the canonical plan.
- [x] T005 Suspend coin/payment-provider implementation guidance until Stage 4 selects the model and rail.
- [x] T006 Correct Stage 1 recommendations to category-only and defer concrete colors to a separate signal.
- [x] T007 Replace the incomplete Stage 4 coin file list with a repo-wide discovery and classification criterion.
- [x] T008 Add this complete SENAR feature-memory package for Stage 0.
- [x] T009 Remove coin balance and coin/Lava operations from authoritative OpenAPI, regenerate the client, remove the obsolete coin contract assertion, and remove payment env/provisioning instructions.
- [x] T010 Mark retained decision-carrying coin/Lava sources and provider contract shapes as superseded legacy that cannot drive implementation or codegen.
- [x] T011 Replace the inconsistent core/all-items OPR formula with two consistent Q1 options and forbid hero/ranking claims until Q1 chooses one.

## Verification and review

- [x] T012 Run generated-client and API-contract checks.
- [x] T013 Run `git diff --check`.
- [x] T014 Run `node scripts/check-feature-memory.mjs`.
- [x] T015 Run `node scripts/check-repo-baseline.mjs`.
- [x] T016 Inspect thread-aware Codex review comments and resolve addressed threads with commit evidence.
- [ ] T017 Push the final iteration and trigger `@codex review` from the PR owner.
- [ ] T018 Confirm the final head has no unresolved blocking review threads and all required GitHub checks pass.

## Process Memory

### Dead Ends

- Treating a docs-only PR as exempt from SENAR was incorrect; only failing-test-first TDD has the application-code carve-out, so Stage 0 needs a normal `spec.md`/`plan.md`/`tasks.md` package.
- A fixed inventory labelled as the “full” coin sweep was incomplete; repo-wide search found additional backend-plan, legacy ADR, OpenAPI, generated-client, fixture, and runtime hits, so Stage 4 uses discovery plus classification as its completion criterion.
- Ranking `(category × compatible color)` by Δcore cannot justify a concrete color because all compatible colors within a category tie under the current methodology; Stage 1 therefore recommends categories only.
- Updating only the Phase 4 payments row did not suspend the older provider and mobile-payment instructions; all decision-carrying onboarding guidance must express the same hold.
- Deferring the coin sweep to Stage 4 left active OpenAPI/codegen and provisioning surfaces able to create new work. The authoritative surface must be removed immediately; only clearly non-actionable legacy may wait for physical deletion.
- Counting optional layers in the OPR denominator while assigning them zero numerator contribution makes useful garments lower the hero metric. Q1 must choose either core/core accounting or expanded/all-items accounting.

### Decisions

- Keep `PRODUCT-PLAN.md` canonical only until MVP; this is a bounded product-decision override, not a replacement for the engineering constitution or source methodology.
- Keep D3's yellow CTA as a pending constitutional exception under Q4; do not silently amend the achromatic principle or conflate CTA and error semantics.
- Remove coin/Lava from OpenAPI, generated output, env, and provisioning now; keep only explicitly frozen downstream legacy until Stage 4 chooses a model, and do not let a manual seed list substitute for repo-wide reconciliation.
- Present Core OPR and Expanded OPR as the two consistent Q1 options; do not choose between them in this PR, and do not publish hero/ranking numbers before the founder does.
- Use command/diff evidence rather than application tests because this PR changes documentation only; the TDD waiver does not waive SENAR or required GitHub checks.

### Known Issues

- Founder questions Q1–Q4 and Q6 still gate Stage 1, and Q5 gates Stage 2; this PR intentionally records rather than decides them.
- Existing provider/runtime coin shapes remain deprecated legacy until Stage 4; they are absent from authoritative codegen/provisioning and cannot be extended or treated as a future contract.
- Merge readiness still depends on a fresh Codex review and required checks for the final pushed head.
