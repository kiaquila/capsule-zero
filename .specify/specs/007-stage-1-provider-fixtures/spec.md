# Feature Spec: Stage 1 Provider Fixtures

**Feature Branch**: `codex/stage-1-provider-fixtures`
**Created**: 2026-06-06
**Status**: Draft
**Input**: User description: "Start the next plan step: first product-code PRs should introduce provider/domain adapter boundaries and deterministic fixtures before wiring any real external service."

## Goal

Stage 1 product work can depend on stable domain/provider interfaces and deterministic mock fixtures without calling Supabase, Lava.top, Photoroom, marketplace parsers, semantic search providers, Google OAuth, or Apple Sign-In.

## Scope

In scope:

- Web provider contracts under `app/src/lib/providers/`.
- Mock provider registry and deterministic fixtures for auth/profile, wardrobe, storage, marketplace import, catalog search, background removal, billing, capsules, and methodology validation.
- `CAPSULE_PROVIDER_MODE=mock` as the Stage 1 default.
- A minimal `/api/health` Route Handler that proves the active provider registry can be instantiated.
- Documentation and SENAR process memory for this foundation slice.

Out of scope:

- Real Supabase client setup, RLS execution, or linked Supabase project credentials.
- Real Lava.top products, invoice API calls, or webhook verification.
- Real Photoroom/remove.bg calls or image quality measurements.
- Google OAuth and Apple Sign-In UI or provider dashboard configuration.
- Full route-handler implementation for all OpenAPI operations.
- Product screen redesign or prototype conversion.

## User Scenarios & Testing

### User Story 1 - Stable provider ports (Priority: P1)

As a feature implementer, I want app code to depend on domain ports rather than external SDKs so that landing/auth/journey/wardrobe slices can be implemented mock-first and later swap to real providers through an explicit integration gate.

**Why this priority**: This is the shared dependency for the first product-code PRs. Without it, each feature would be tempted to invent local mocks or call providers directly.

**Independent Test**: Can be tested by importing the provider registry, running TypeScript/build checks, and confirming `/api/health` reports `providerMode=mock`.

**Acceptance Scenarios**:

1. **Given** Stage 1 local development, **When** app server code creates the provider registry, **Then** it receives a mock registry implementing all external-service surfaces named in ADR-006.
2. **Given** UI, Server Actions, or Route Handlers need provider behavior, **When** they import shared provider contracts, **Then** they can depend on domain ports instead of fake one-off shapes.

### User Story 2 - Deterministic fixtures (Priority: P2)

As a QA/review agent, I want deterministic success, failure, timeout, and insufficient-balance fixtures so that provider-dependent flows can be checked before real dashboards or credentials exist.

**Why this priority**: ADR-006 makes mocks acceptable only if they stay honest against the provider boundaries and cover non-happy paths.

**Independent Test**: Can be tested through static review of `mock/fixtures.ts`, provider method behavior, typecheck, build, and the `/api/health` fixture counts.

**Acceptance Scenarios**:

1. **Given** the mock registry, **When** marketplace import, background removal, catalog search, or billing flows are exercised, **Then** representative deterministic fixture states are available.
2. **Given** a future feature wants a negative provider state, **When** it uses the mock ports, **Then** it can request failure/timeout/insufficient-balance behavior without real external calls.

### User Story 3 - Integration gates stay closed (Priority: P3)

As the founder/operator, I want real provider mode to remain blocked until evidence exists so that production credentials and paid provider calls are not introduced accidentally.

**Why this priority**: Stage 1 is allowed to move fast only because real providers stay gated and credentials stay out of agent sessions.

**Independent Test**: Can be tested by reading `registry.ts`, env template defaults, docs, and running build checks with mock mode.

**Acceptance Scenarios**:

1. **Given** `CAPSULE_PROVIDER_MODE` is unset or `mock`, **When** provider registry is created, **Then** it selects deterministic mocks.
2. **Given** `CAPSULE_PROVIDER_MODE=supabase`, **When** provider registry is created before the integration gate, **Then** it rejects the mode with an explicit integration-gate error.

### Edge Cases

- Upload metadata may contain unsupported MIME types or files above the mock upload limit.
- Completed photo uploads must remain readable through the upload target's `jobId` before and after optional background removal starts.
- Background removal may return success or timeout states.
- Marketplace import may parse successfully or fail.
- Marketplace import candidates must keep the submitted URL when confirmed into wardrobe items.
- Mock billing coin-pack ids must match OpenAPI `coinPackId` enum values.
- Coin spend may be rejected when `targetId` is missing or balance is insufficient.
- Accepted coin spend retries must return the existing ledger entry for the idempotency key before checking current balance.
- Capsules created through the mock registry must be readable from the same registry state.
- Catalog search may return all fixtures for an empty query or filtered deterministic matches.
- Mock auth sessions must remain unexpired for Stage 1 auth guards.
- Mock profiles loaded after sign-in must preserve the signed-in email.

## Negative Scenarios

1. **Given** a developer sets `CAPSULE_PROVIDER_MODE=supabase` before provider evidence exists, **When** server code creates the provider registry, **Then** the app rejects the mode instead of silently calling real providers.
2. **Given** a client component tries to import the provider registry implementation, **When** Next builds the app, **Then** the `server-only` boundary prevents the server provider layer from being bundled into client code.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST define shared TypeScript provider contracts for auth/profile, wardrobe, storage, image processing, marketplace import, catalog search, billing, capsule, and methodology behavior.
- **FR-002**: The system MUST provide deterministic mock implementations for every provider surface named in FR-001.
- **FR-003**: The system MUST default to mock provider mode when `CAPSULE_PROVIDER_MODE` is unset.
- **FR-004**: The system MUST reject `CAPSULE_PROVIDER_MODE=supabase` until the Supabase integration gate is opened.
- **FR-005**: The system MUST keep provider registry implementations server-only.
- **FR-006**: The system MUST expose a minimal health route that reports active provider mode and fixture-backed health state without secrets.
- **FR-007**: The system MUST document the provider-boundary source paths in backend docs.

### Key Entities

- **ProviderRegistry**: Aggregates domain ports for external-service-backed workflows.
- **ProviderPort**: A domain interface for one workflow surface such as auth, storage, catalog search, or billing.
- **MockFixture**: Deterministic representative data used during Stage 1 product work.
- **ProviderMode**: Runtime selector controlling whether Stage 1 uses mocks or a future real integration.

## Success Criteria

### Measurable Outcomes

- **SC-001**: `npm --prefix app run typecheck` passes with the provider contracts and mock registry.
- **SC-002**: `npm --prefix app run lint` passes with the provider source files.
- **SC-003**: `npm --prefix app run build` passes and includes `/api/health`.
- **SC-004**: `/api/health` returns `providerMode: "mock"` and fixture counts.
- **SC-005**: `npm run check:feature-memory -- --worktree` passes for spec `007-stage-1-provider-fixtures`.
