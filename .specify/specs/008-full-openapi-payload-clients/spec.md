# Feature Spec: Full OpenAPI Payload Clients

**Feature Branch**: `codex/full-openapi-payload-clients`
**Created**: 2026-06-06
**Status**: Draft
**Input**: User description: "Implement the next plan step: generate full OpenAPI payload clients before route-handler-heavy feature work, open a GitHub PR, and request Codex review."

## Goal

Web and Flutter Stage 1 implementation can read the OpenAPI contract as operation payload shapes, not only as a list of routes. The generated artifacts must expose request body, response body, and parameter metadata for every documented route-method so upcoming auth, wardrobe, upload, catalog, and billing route handlers can share one source of truth.

## Scope

In scope:

- Expand `scripts/generate-api-clients.mjs` to derive component schemas, request bodies, success response bodies, and path/query/header/cookie parameters from `docs_capsule_zero/adr/openapi.yaml`.
- Generate TypeScript component aliases and per-operation payload helper types under `app/src/lib/api/generated/openapi.ts`.
- Generate Dart payload schema descriptors and per-operation payload descriptors under `mobile/lib/api/generated/openapi.dart`.
- Preserve the existing operation metadata exports and API error-code exports.
- Record verification evidence and process memory for this foundation slice.

Out of scope:

- Changing the OpenAPI route inventory or endpoint behavior.
- Adding real route handlers beyond the existing health route.
- Generating full Dart model classes with JSON serialization.
- Calling real Supabase, Lava.top, Photoroom, OAuth, marketplace, or semantic-search providers.
- Product UI implementation.

## User Scenarios & Testing

### User Story 1 - TypeScript payload types (Priority: P1)

As a web feature implementer, I want generated TypeScript aliases for OpenAPI schemas and operation payloads so route handlers and server actions can type request, response, and params without hand-written copies.

**Why this priority**: The next feature slices will add app/server code. Without generated payload types, every route risks drifting from `openapi.yaml`.

**Independent Test**: Run `npm run generate:api`, `npm run check:api-contract`, and `npm --prefix app run typecheck`.

**Acceptance Scenarios**:

1. **Given** the OpenAPI contract defines a component schema, **When** API clients are generated, **Then** TypeScript exports an alias for that component schema.
2. **Given** an operation defines params, a JSON request body, or a JSON success response, **When** API clients are generated, **Then** TypeScript exports per-operation payload aliases and generic helper types for those shapes.

### User Story 2 - Flutter payload descriptors (Priority: P2)

As a Flutter implementer, I want generated payload schema descriptors in Dart so mobile work can inspect the same request/response contract before heavier Dart model generation is introduced.

**Why this priority**: Flutter is in MVP scope, but the current shell does not need a full model generator dependency yet.

**Independent Test**: Run `npm run generate:api` and inspect `mobile/lib/api/generated/openapi.dart` for `apiSchemas` and `apiOperationPayloads`.

**Acceptance Scenarios**:

1. **Given** the OpenAPI contract defines component schemas, **When** Dart clients are generated, **Then** the Dart artifact contains the component schema JSON descriptors.
2. **Given** an operation defines payload shapes, **When** Dart clients are generated, **Then** the Dart artifact contains per-operation request/response/parameter descriptors keyed by `operationId`.

### User Story 3 - Regeneration gate (Priority: P3)

As a reviewer, I want the API contract check to fail when generated payload clients are stale so OpenAPI edits cannot merge without synced clients.

**Why this priority**: This preserves the Sprint 0 source-of-truth rule.

**Independent Test**: Run `npm run check:api-contract`.

**Acceptance Scenarios**:

1. **Given** generated clients match `openapi.yaml`, **When** the API contract check runs, **Then** it verifies the generated clients for all 43 operations.
2. **Given** generated clients drift from `openapi.yaml`, **When** the API contract check runs, **Then** the generator `--check` mode reports stale output.

## Edge Cases

- Success responses may be redirects without JSON payloads.
- Query parameters may be optional while path parameters are always required.
- OpenAPI 3.1 nullable schemas may use `type: [T, "null"]`.
- Operations may define inline request or response schemas instead of component `$ref`s.
- JSON schema composition may use `anyOf`, `oneOf`, or `allOf`.
- Objects may define `additionalProperties: true` for flexible provider payloads.

## Negative Scenarios

1. **Given** an operation has no JSON request body, **When** TypeScript payload aliases are generated, **Then** the request body type is `never` instead of pretending any payload is accepted.
2. **Given** a success response has no JSON body, **When** TypeScript response aliases are generated, **Then** the response body type is `void`.

## Requirements

### Functional Requirements

- **FR-001**: The generator MUST derive TypeScript component schema aliases from `components.schemas`.
- **FR-002**: The generator MUST derive per-operation TypeScript path, query, header, cookie, request body, and response body aliases.
- **FR-003**: The generator MUST expose generic TypeScript helpers for operation request and response lookup by `ApiOperationId`.
- **FR-004**: The generator MUST preserve existing `API_VERSION`, `API_OPERATIONS`, `API_ERROR_CODES`, and `ApiErrorResponse` exports.
- **FR-005**: The Dart artifact MUST expose component schema descriptors and per-operation payload descriptors generated from the same OpenAPI source.
- **FR-006**: `npm run check:api-contract` MUST verify generated clients are up to date.

### Key Entities

- **OpenAPI Schema**: A component or inline JSON schema from `docs_capsule_zero/adr/openapi.yaml`.
- **Operation Payload**: The path/query/header/cookie parameters, JSON request body, and JSON success response schemas for one `operationId`.
- **Generated TypeScript Client**: The web-side generated artifact under `app/src/lib/api/generated/openapi.ts`.
- **Generated Dart Client**: The mobile-side generated artifact under `mobile/lib/api/generated/openapi.dart`.

## Success Criteria

### Measurable Outcomes

- **SC-001**: `npm run generate:api` generates clients for all 43 operations.
- **SC-002**: `npm run check:api-contract` passes and verifies generated clients.
- **SC-003**: `npm --prefix app run typecheck` passes with the expanded generated TypeScript artifact.
- **SC-004**: `npm --prefix app run lint` passes with the expanded generator and generated TypeScript artifact.
- **SC-005**: `npm run check:feature-memory -- --worktree` passes for spec `008-full-openapi-payload-clients`.
