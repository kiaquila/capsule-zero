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
- remove the superseded coin/Lava surface from OpenAPI, its generated client, API/runtime-env guards, and operational templates; and mark retained provider shapes as deprecated legacy
- update the live Terms of Use and Privacy Policy so users are not asked to accept the cancelled coin/Lava model while monetization is on hold
- define two internally consistent OPR models and forbid the core-numerator/all-items-denominator hybrid before Q1 is decided
- define the four delivery stages, open founder decisions, and a repo-wide Stage 4 monetization-drift sweep
- provide SENAR goal/scope, verification evidence, negative scenarios, and process memory for Stage 0

Out of scope:

- implementing any Stage 1–4 product behavior or changing application runtime behavior
- deciding the open founder questions Q1–Q6
- choosing or provisioning a monetization model, payment rail, product, key, webhook, balance, or purchase flow
- amending the achromatic-interface principle before Q4 is decided
- deleting every retained legacy provider, fixture, migration, historical spec, and runtime field before Stage 4 selects a model
- choosing legal/payment terms for a future monetization model before Stage 4 decides it

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

**Independent Test**: Search the authoritative OpenAPI/generated client and operational instructions for active payment surface, then inspect the Stage 1 recommendation and OPR definitions.

**Acceptance Scenarios**:

1. **Given** monetization is undecided, **When** an agent reads the authoritative API or provisioning guidance, **Then** no coin balance, billing operation, payment key/product, or payment webhook is exposed or instructed before Stage 4.
2. **Given** compatible colors within one garment category produce equal Δcore, **When** Stage 1 presents a recommendation, **Then** it recommends a category or equivalent tied categories, not an unjustified concrete color.
3. **Given** optional garments exist, **When** OPR and recommendation deltas are defined, **Then** the same chosen model counts their contribution and denominator consistently rather than lowering OPR by construction.
4. **Given** public legal routes are live, **When** a user opens Terms or Privacy during Stages 1–3, **Then** the documents disclose that monetization/payment is inactive and do not bind the user to coins or Lava.top.

### User Story 3 - Preserve auditable completion memory (Priority: P1)

As the merge owner, I want the planning PR to satisfy SENAR so Stage 0 completion is supported by durable evidence rather than a PR-body-only waiver.

**Why this priority**: The repository completion contract applies from spec 005 onward, including planning and contract-support work; only TDD has the application-behavior carve-out.

**Independent Test**: Verify this folder contains `spec.md`, `plan.md`, and `tasks.md` with the required SENAR sections and that the repository guards pass.

**Acceptance Scenarios**:

1. **Given** Stage 0 is marked complete, **When** a reviewer opens feature memory, **Then** Goal, Scope, verification evidence, negative scenarios, and Process Memory are present.
2. **Given** the change alters planning plus contract/support artifacts but no application behavior, **When** TDD applicability is checked, **Then** the spec records a narrow behavior-level waiver without waiving SENAR.

### Edge Cases

- Existing downstream coin references remain discoverable before Stage 4; active OpenAPI/codegen/provisioning surfaces must be removed now, while every retained source is explicitly frozen and a repo-wide search remains required for final deletion/replacement.
- A concrete color may be named later only if Stage 2 adds a separate color-gap/preference signal; Δcore alone cannot break the tie.
- Optional layers cannot use zero numerator contribution while remaining in the OPR denominator; Q1 must choose Core OPR with a core-only denominator or Expanded OPR with optional-layer contributions.
- Public legal copy cannot be treated as historical doc debt because users accept it now; it must describe the current hold while preserving future consumer rights conditionally.
- The pending yellow CTA remains a founder decision because it conflicts with the current achromatic constitution and error semantics.

## Negative Scenarios

1. **Given** monetization remains undecided, **When** an agent attempts to generate or provision a payment product, API key, webhook, balance, purchase CTA, or coin-based contract, **Then** the authoritative contract and operational guidance contain no such surface and the retained legacy is explicitly non-actionable until Stage 4.
2. **Given** Stage 1 has no independent color signal, **When** multiple compatible colors tie on Δcore, **Then** the plan rejects arbitrary color-specific ranking and exposes only category-level or equivalent tied recommendations.
3. **Given** an optional layer is added, **When** OPR is evaluated, **Then** the plan rejects the hybrid that increments the denominator while assigning the layer zero numerator contribution.
4. **Given** this planning PR retires a contract surface, **When** its scope is inspected, **Then** it must not add runtime or UI behavior beyond AC-011's bounded legal-copy correction, deployment wiring, schema, infrastructure, or Supabase coupling.
5. **Given** no monetization/payment flow is active, **When** Terms and Privacy render, **Then** they must not claim that users can purchase coins, that Lava.top processes payments, or that billing/coin data is currently collected.

## Acceptance Criteria

- **AC-001**: `PRODUCT-PLAN.md` is identified as canonical for product decisions until MVP in both cross-agent onboarding files.
- **AC-002**: The plan records D1–D4, four delivery stages, and the founder questions gating Stage 1/2.
- **AC-003**: The authoritative OpenAPI/generated client, API/runtime-env guards, and operational templates expose no coin balance/error, billing/Lava operation, payment env, product, key, webhook, or purchase instruction before Stage 4.
- **AC-004**: Stage 1 recommendation scope is category-only when Δcore cannot distinguish compatible colors; color-specific output requires a separate Stage 2 signal.
- **AC-005**: The Stage 4 drift cleanup uses a repo-wide search and classification criterion that covers historical docs/specs, generated artifacts, provider contracts/fixtures, migrations, and runtime code rather than a fixed file count.
- **AC-006**: `.specify/specs/042-product-rebuild-plan/` contains complete `spec.md`, `plan.md`, and `tasks.md` SENAR memory.
- **AC-007**: The market-context strategic-risk register no longer presents coin pricing optimization as active guidance.
- **AC-008**: Outside contract retirement, generated output, env cleanup, deprecation comments, and AC-011's bounded live legal-copy correction, this PR changes no application behavior, deployment workflow, compose file, nginx config, schema, or provider implementation.
- **AC-009**: Q1 presents only internally consistent Core and Expanded OPR models, explicitly rejects core/all-items hybrid accounting, and gates hero/ranking numbers until one model is chosen.
- **AC-010**: Every decision-carrying downstream document with retained coin/Lava guidance marks it superseded and non-actionable now rather than deferring its authority to Stage 4.
- **AC-011**: Live Terms and Privacy state the current monetization hold, remove active coin/Lava/payment-processing and data-collection claims, and are covered by a committed failing-then-passing Playwright scenario.

## TDD Evidence

Planning, OpenAPI, generated types, guards, env, and deprecation comments are support artifacts outside the application TDD loop. Updating `app/src/lib/legal-content.ts` changes user-visible web behavior, so AC-011 follows the mandatory red/green history: commit `fc374201b2d70c420ae02c36af2fb2d115af6dd0` adds the Playwright scenario and fails because the current Terms/Privacy lack the hold and expose retired claims; the subsequent implementation commit updates legal content and makes the same scenario pass. SENAR, generation/contract/env checks, and required CI remain mandatory.

## Requirements

### Functional Requirements

- **FR-001**: The repository MUST direct pre-MVP product decisions to `PRODUCT-PLAN.md`.
- **FR-002**: The plan MUST preserve accepted decisions separately from unresolved founder questions.
- **FR-003**: Monetization and payment-provider implementation MUST remain on hold until Stage 4 selects the model and rail.
- **FR-004**: Stage 1 MUST NOT infer a concrete color from category-only Δcore counts.
- **FR-005**: Stage 4 MUST reconcile every repo-wide coin hit with the selected model rather than rely on a static inventory.
- **FR-006**: Stage 0 MUST include complete SENAR feature memory before it is declared complete.
- **FR-007**: Documentation changes MUST preserve the production-stack, no-Supabase, locale, TDD, and PR-gate contracts.
- **FR-008**: The authoritative API and code generation MUST NOT expose the cancelled coin/Lava contract before Stage 4 selects a replacement.
- **FR-009**: OPR MUST use a numerator and denominator that treat optional-layer contribution consistently; the core/all-items hybrid is forbidden.
- **FR-010**: Public legal documents MUST describe the current free/no-payment posture and MUST NOT assert active coins, Lava.top processing, billing collection, or purchase/refund flows before Stage 4.

## Success Criteria

### Measurable Outcomes

- **SC-001**: All eleven acceptance criteria have command or diff evidence in `plan.md`.
- **SC-002**: The feature-memory and repository-baseline checks exit 0 on the final commit.
- **SC-003**: The final PR head has no unresolved blocking Codex review threads and all required GitHub checks pass.
