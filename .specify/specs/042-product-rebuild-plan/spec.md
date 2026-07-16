# Feature Specification: Product Rebuild Plan

**Feature Branch**: `feat/product-rebuild-plan`
**Created**: 2026-07-16
**Status**: Ready for review
**Input**: Replace the pre-MVP product sequence with a canonical, evidence-backed plan centered on OPR and value before registration.

## Goal

Make one explicit product plan canonical until MVP so every following slice starts from the same accepted decisions, open founder gates, and delivery order.

## Scope

In scope:

- add `PRODUCT-PLAN.md` as the canonical pre-MVP product plan and `PRODUCT-RESEARCH.md` as its evidence base
- record the accepted pre-signup value, cancelled coins hypothesis, pending yellow-accent exception, and required garment-cut/basicity input
- update decision-carrying onboarding, constitution, and market-context documents in the same change
- define the four delivery stages, open founder decisions, and a repo-wide Stage 4 monetization-drift sweep
- provide SENAR goal/scope, verification evidence, negative scenarios, and process memory for Stage 0

Out of scope:

- implementing any Stage 1–4 product behavior or changing application/runtime code
- deciding the open founder questions Q1–Q6
- choosing or provisioning a monetization model, payment rail, product, key, webhook, balance, or purchase flow
- amending the achromatic-interface principle before Q4 is decided
- completing the downstream legacy coin sweep before Stage 4 selects a model

## User Scenarios & Testing

### User Story 1 - Start from one product plan (Priority: P1)

As a founder or implementation agent, I want one canonical plan so the next product slice cannot silently follow the superseded post-registration-first or coins-first direction.

**Why this priority**: Conflicting product direction would invalidate subsequent specs and implementation work.

**Independent Test**: Read the current-phase blocks and `PRODUCT-PLAN.md`; they identify the same canonical plan, four stages, accepted decisions, and open gates.

**Acceptance Scenarios**:

1. **Given** an agent starts product work before MVP, **When** product docs disagree, **Then** `PRODUCT-PLAN.md` wins and the same change must repair the drift.
2. **Given** Stage 1 is being scoped, **When** the first-value flow is chosen, **Then** value is delivered before registration and open Q1–Q4/Q6 remain explicit gates.

### User Story 2 - Avoid unsupported implementation commitments (Priority: P1)

As a reviewer, I want cancelled or undecided assumptions clearly bounded so agents do not provision payments or claim color-specific recommendation quality without a real signal.

**Why this priority**: Both paths create production-shape contracts from hypotheses that the founder has not accepted.

**Independent Test**: Search the changed decision-carrying docs for active payment-provider instructions and inspect the Stage 1 recommendation definition.

**Acceptance Scenarios**:

1. **Given** monetization is undecided, **When** an agent reads onboarding or market risks, **Then** it is instructed not to optimize or provision coins, balances, providers, or purchase flows before Stage 4.
2. **Given** compatible colors within one garment category produce equal Δcore, **When** Stage 1 presents a recommendation, **Then** it recommends a category or equivalent tied categories, not an unjustified concrete color.

### User Story 3 - Preserve auditable completion memory (Priority: P1)

As the merge owner, I want the planning PR to satisfy SENAR so Stage 0 completion is supported by durable evidence rather than a PR-body-only waiver.

**Why this priority**: The repository completion contract applies from spec 005 onward, including documentation-only work; only TDD has the application-code carve-out.

**Independent Test**: Verify this folder contains `spec.md`, `plan.md`, and `tasks.md` with the required SENAR sections and that the repository guards pass.

**Acceptance Scenarios**:

1. **Given** Stage 0 is marked complete, **When** a reviewer opens feature memory, **Then** Goal, Scope, verification evidence, negative scenarios, and Process Memory are present.
2. **Given** the change is documentation-only, **When** TDD applicability is checked, **Then** the spec records a narrow application-code waiver without waiving SENAR.

### Edge Cases

- Existing downstream coin references remain discoverable before Stage 4; the plan must classify them as legacy, forbid extending them, and require a repo-wide search rather than claim a fixed inventory is exhaustive.
- A concrete color may be named later only if Stage 2 adds a separate color-gap/preference signal; Δcore alone cannot break the tie.
- The pending yellow CTA remains a founder decision because it conflicts with the current achromatic constitution and error semantics.

## Negative Scenarios

1. **Given** monetization remains undecided, **When** an agent attempts to create a payment product, API key, webhook, balance, purchase CTA, or coin-based contract, **Then** the canonical plan and onboarding guidance explicitly reject that work until Stage 4.
2. **Given** Stage 1 has no independent color signal, **When** multiple compatible colors tie on Δcore, **Then** the plan rejects arbitrary color-specific ranking and exposes only category-level or equivalent tied recommendations.
3. **Given** this PR changes documentation only, **When** its scope is inspected, **Then** it must not add runtime, UI, API, schema, infrastructure, or Supabase coupling.

## Acceptance Criteria

- **AC-001**: `PRODUCT-PLAN.md` is identified as canonical for product decisions until MVP in both cross-agent onboarding files.
- **AC-002**: The plan records D1–D4, four delivery stages, and the founder questions gating Stage 1/2.
- **AC-003**: Changed decision-carrying docs do not instruct agents to provision or optimize a coin model, Lava.top integration, balances, or purchase flows before Stage 4.
- **AC-004**: Stage 1 recommendation scope is category-only when Δcore cannot distinguish compatible colors; color-specific output requires a separate Stage 2 signal.
- **AC-005**: The Stage 4 drift cleanup uses a repo-wide search and classification criterion that covers docs, OpenAPI, generated clients, fixtures, and runtime code rather than a fixed file count.
- **AC-006**: `.specify/specs/042-product-rebuild-plan/` contains complete `spec.md`, `plan.md`, and `tasks.md` SENAR memory.
- **AC-007**: The market-context strategic-risk register no longer presents coin pricing optimization as active guidance.
- **AC-008**: No application/runtime product root, deployment workflow, compose file, nginx config, schema, or provider implementation changes in this planning PR.

## TDD Waiver

This spec changes product-planning and source-of-truth documentation only. It does not change web UI, React Native, Go API behavior, or other application code, so the failing-test-first rule for specs ≥ 025 does not apply. SENAR is not waived: command evidence and negative-scenario checks are recorded in `plan.md`, and Process Memory is recorded in `tasks.md`.

## Requirements

### Functional Requirements

- **FR-001**: The repository MUST direct pre-MVP product decisions to `PRODUCT-PLAN.md`.
- **FR-002**: The plan MUST preserve accepted decisions separately from unresolved founder questions.
- **FR-003**: Monetization and payment-provider implementation MUST remain on hold until Stage 4 selects the model and rail.
- **FR-004**: Stage 1 MUST NOT infer a concrete color from category-only Δcore counts.
- **FR-005**: Stage 4 MUST reconcile every repo-wide coin hit with the selected model rather than rely on a static inventory.
- **FR-006**: Stage 0 MUST include complete SENAR feature memory before it is declared complete.
- **FR-007**: Documentation changes MUST preserve the production-stack, no-Supabase, locale, TDD, and PR-gate contracts.

## Success Criteria

### Measurable Outcomes

- **SC-001**: All eight acceptance criteria have command or diff evidence in `plan.md`.
- **SC-002**: The feature-memory and repository-baseline checks exit 0 on the final commit.
- **SC-003**: The final PR head has no unresolved blocking Codex review threads and all required GitHub checks pass.
