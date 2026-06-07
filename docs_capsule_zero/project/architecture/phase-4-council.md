# Phase 4 Architecture Council

## Status

Rerun complete. Architecture direction accepted; Phase 5 feature work requires Sprint 0 entrance-gate completion before product implementation.

## Purpose

This document applies the Architectura-style decision method to Capsule Zero without importing Architectura runtime files into the repository. The durable source of truth remains the Capsule Zero docs and ADRs.

The council resolves the remaining Phase 4 architecture choices so Phase 5 implementation can begin from explicit, reviewable decisions.

## Rerun Inputs

The council was rerun after two new founder constraints:

- Capsule Zero must be mobile-first, not just mobile-responsive.
- MVP includes native iOS and Android apps built with Flutter, in addition to the web app.
- Payments use Lava.top, not Stripe.

## Source Material

- `AGENTS.md`
- `.specify/memory/constitution.md`
- `.specify/specs/001-capsule-zero-mvp/spec.md`
- `.specify/specs/001-capsule-zero-mvp/prototype-map.md`
- `html-prototypes/`
- `docs_capsule_zero/project/methodology/`
- `docs_capsule_zero/project/frontend/styling.md`
- `docs_capsule_zero/project/devops/ai-orchestration-protocol.md`
- `docs_capsule_zero/project/devops/github-ci-and-branch-protection.md`

## Council Roles

| Role               | Voting lens                                                                       |
| ------------------ | --------------------------------------------------------------------------------- |
| Software architect | Coherent product architecture, domain model, API boundaries                       |
| Platform architect | Delivery speed, hosting, observability, operational burden                        |
| Mobile architect   | Flutter app architecture, iOS/Android constraints, deep links, offline ergonomics |
| AI/data architect  | Semantic search, image processing, auto-tagging, shared catalog growth            |
| Verifier           | MVP realism, missing constraints, security, validation readiness                  |

## Decision Register

| ID     | Decision                    | Accepted option                                                                                                                                                                        | Quorum                  | Rationale                                                                                                                                          |
| ------ | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| DI-001 | Backend/BaaS                | Supabase                                                                                                                                                                               | 5/5 approve             | Fastest credible path for a shared web + Flutter backend: Auth, Postgres, Storage, Edge Functions, RLS, and vector search in one platform.         |
| DI-002 | Database                    | Supabase PostgreSQL with RLS, pgvector, and Postgres full-text search                                                                                                                  | 5/5 approve             | Capsule data is relational, ownership-sensitive, and search-heavy enough to benefit from Postgres plus vector search without a separate vector DB. |
| DI-003 | Auth                        | Supabase Auth with Stage 1 email/password; Google OAuth and Apple Sign-In deferred to MVP Stage 2                                                                                      | 5/5 approve             | Keeps session identity tied directly to Postgres RLS while reducing provider setup before core product implementation.                             |
| DI-004 | File storage                | Supabase Storage                                                                                                                                                                       | 5/5 approve             | Keeps user photos, mobile uploads, item assets, RLS policies, and DB metadata in one backend.                                                      |
| DI-005 | Background removal          | Photoroom API behind an adapter, with remove.bg as fallback option if SLA/quality fails                                                                                                | 4/5 approve, 1 advisory | Photoroom aligns better with premium fashion/catalog imagery and future paid photo enhancement. Adapter boundary prevents lock-in.                 |
| DI-006 | Hosting                     | Vercel for web, Supabase for backend services, Apple App Store + Google Play distribution for Flutter apps                                                                             | 5/5 approve             | Keeps web previews fast while making native mobile distribution explicit.                                                                          |
| DI-007 | API shape                   | Shared backend contract: Supabase client/RPC for core data, server Route Handlers/Edge Functions for trusted vendor operations, OpenAPI-documented endpoints for web and mobile parity | 5/5 approve             | Next.js Server Actions alone are insufficient once Flutter is in scope. Mobile needs stable HTTP/RPC contracts.                                    |
| DI-008 | Web state                   | Zustand for local journey/UI state, TanStack Query for client server-state, Server Components for initial reads                                                                        | 5/5 approve             | The Guided Journey already uses Zustand. TanStack Query is appropriate for interactive wardrobe grids, uploads, mutations, and cache invalidation. |
| DI-009 | Web forms                   | React Hook Form + Zod                                                                                                                                                                  | 5/5 approve             | Already present in the app and well-suited to inline validation, form state, and schema reuse.                                                     |
| DI-010 | Web i18n                    | next-intl                                                                                                                                                                              | 5/5 approve             | Best fit for Next.js App Router and Server Components. Active MVP v1 locales are EN/RU; ES-AR is deferred globally to MVP v2.                       |
| DI-011 | Semantic search             | Supabase hybrid search: Postgres FTS + pgvector embeddings                                                                                                                             | 5/5 approve             | Supports catalog search from the shared DB while keeping metadata filters and semantic ranking close to the source data.                           |
| DI-012 | Payments/coins              | Lava.top one-time product payments on web, Lava.top payment webhooks, coin ledger in Postgres, mobile read-only balance for v0.1                                                       | 5/5 approve             | Matches the founder constraint and no-subscription model while avoiding mobile app-store payment-policy risk in the MVP release.                   |
| DI-013 | Shared item DB              | Single canonical `items` table with visibility/moderation flags, referenced by per-user wardrobe entries                                                                               | 5/5 approve             | Satisfies US-025: public imported items enrich the shared catalog without duplicating public/private item records.                                 |
| DI-014 | Quality tooling             | Existing CI is accepted; linting and commit hooks remain a Phase 4 setup follow-up before first product-code PR                                                                        | 5/5 approve             | CI and branch protection docs exist. Local hooks are not yet configured and should be added before Phase 5 implementation branches.                |
| DI-015 | Mobile app                  | Flutter app for iOS and Android sharing Supabase backend and domain rules                                                                                                              | 5/5 approve             | Gives native distribution and camera/upload UX while avoiding separate iOS/Android codebases.                                                      |
| DI-016 | Mobile-first implementation | Design, API, and QA optimize for phone workflows first: 375px web baseline and native Flutter phone UX before tablet/desktop enhancements                                              | 5/5 approve             | Mobile is the dominant wardrobe-capture context and must lead upload, camera, auth, and coin-balance sync flows.                                   |
| DI-017 | Flutter architecture        | Flutter + Dart, `supabase_flutter`, `go_router`, Riverpod, generated API/domain models, secure storage for session tokens                                                              | 5/5 approve             | Keeps app architecture testable, route-driven, and aligned with Supabase Auth/Storage.                                                             |

## Accepted Architecture Summary

Capsule Zero should be a mobile-first product with two clients over one backend:

- Web: Vercel-hosted Next.js App Router application.
- Mobile: Flutter iOS/Android app.

Supabase owns identity, relational data, row-level security, file storage, edge/background jobs, and vector-capable search. Next.js owns the premium web experience, route composition, server actions, route handlers, web integration boundaries, and Lava.top purchase entrypoints for v0.1. Flutter owns native mobile capture, upload, navigation, balance display, and app-store distribution surfaces.

The product should not start with a custom NestJS/FastAPI backend. The MVP does not need that operational overhead. Custom backend services can be introduced later only if Supabase Edge Functions or Vercel Functions fail a measured requirement.

## Open Follow-Ups

- Founder approval on accepted stack.
- Complete `docs_capsule_zero/project/architecture/phase-5-entrance-checklist.md` mock-first Stage 1 gates before feature implementation.
- Add linting and local commit hooks before Phase 5 product-code PRs.
- Keep provider calls behind mockable adapters; create Supabase project, storage buckets, and local seed data when persistence/RLS integration needs real Supabase.
- Configure Google and Apple OAuth providers in MVP Stage 2.
- Create Flutter app scaffold and shared domain contract before mobile feature implementation.
- Configure Lava.top products/API key/webhook before real web purchases are tested.
- Keep mobile purchase CTAs disabled in v0.1; mobile reflects web purchases through the shared coin ledger.
- Confirm Photoroom response quality and latency against real wardrobe photos before enabling real image processing. If it misses the 5 second processing gate or quality bar, switch the adapter to remove.bg for v0.1.
- Select the exact embedding model after a small relevance test on catalog queries. The default architecture stores embeddings in pgvector either way.

## Validation

| Check                  | Status   | Notes                                                                                                                                                                   |
| ---------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brief coverage         | Ready    | Covers backend, DB, auth, storage, bg removal, hosting, web, Flutter mobile, state, API, forms, i18n, coins, catalog search.                                            |
| Consistency            | Ready    | Decisions align with MVP scope, prototypes, and existing devops docs.                                                                                                   |
| Implementation realism | Advisory | Supabase/Vercel/Flutter is proportionate, but mobile apps materially expand MVP delivery scope; Sprint 0 is mandatory before feature work.                              |
| Risk visibility        | Ready    | Main risks are mobile scope expansion, shared contract completeness, background removal SLA, marketplace parser fragility, semantic search relevance, and data privacy. |
