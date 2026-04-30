# Feature Spec: Sprint 0 Foundation

## User Story

As the Capsule Zero product team, we need an implementation-ready Sprint 0
foundation before feature screens begin so that web, mobile, API, and backend
work share one contract and one quality baseline.

## Scope

- Expand the MVP OpenAPI contract to cover every route-method listed in
  `docs_capsule_zero/adr/api-spec.md`.
- Generate web TypeScript and Flutter Dart API metadata from the OpenAPI source.
- Add Supabase migration-backed schema, storage buckets, RLS policies, and RLS
  contract tests for the documented two-table item ownership model.
- Add a Flutter mobile shell with Supabase initialization, routing, locale
  placeholders, and v0.1 read-only mobile payment posture.
- Configure local quality tooling: ESLint, Husky pre-commit hook,
  lint-staged, and CI contract checks.

## Acceptance Criteria

- `npm run check:api-contract` validates OpenAPI route coverage, auth metadata,
  error schemas, item status enum, marketplace parsed candidate shape, catalog
  search query params, and coin-spend `reason` to `targetId` correlation.
- `npm run generate:api` updates both generated client metadata outputs.
- `npm run preflight` includes repository baseline, API contract validation,
  lint, typecheck, build, and tests.
- Supabase migrations define core tables, indexes, RLS policies, reference seed
  data, storage buckets, and RPC signatures required by Sprint 0.
- Mobile scaffold has no purchase CTA and documents web-only Lava.top purchases.

## Out Of Scope

- Provisioning real Supabase, Lava.top, Apple, Google, or Photoroom accounts.
- Building user-facing product screens from the HTML prototypes.
- Implementing production Route Handler business logic.
