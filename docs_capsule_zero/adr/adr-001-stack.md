# ADR-001: Stack Overview

## Status

Accepted.

## Context

Capsule Zero needs to move from approved prototypes to Phase 5 implementation. The MVP must support:

- premium mobile-first Next.js frontend matching the HTML prototypes
- Flutter iOS and Android apps in the MVP
- email/password, Google, and Apple authentication
- private user wardrobe data and photos
- three upload methods: photo upload, marketplace link import, semantic catalog search
- optional background removal under the 5 second quality gate
- shared item database for public marketplace imports
- EN, ES-AR, and RU from day 1
- coins-only monetization through Lava.top one-time purchases on web, with mobile balance display in v0.1
- PR-first delivery with existing `baseline-checks`, `guard`, and `AI Review` gates

The project should optimize for delivery speed and operational simplicity without creating a throwaway architecture.

## Decision

Use the following MVP stack:

| Layer | Decision |
|---|---|
| Frontend | Next.js App Router, React, TypeScript |
| Mobile | Flutter + Dart for iOS and Android |
| Styling | Tailwind CSS v4 with Capsule Zero glass tokens |
| Hosting/distribution | Vercel for web, Apple App Store and Google Play for Flutter apps |
| Backend/BaaS | Supabase |
| Database | Supabase PostgreSQL with RLS |
| Vector/search | PostgreSQL full-text search + pgvector hybrid search |
| Auth | Supabase Auth |
| File storage | Supabase Storage |
| Background removal | Photoroom API through an adapter, with remove.bg kept as fallback |
| Payments | Lava.top one-time product payments on web, Lava.top webhooks, mobile read-only balance for v0.1 |
| i18n | next-intl |
| Local UI state | Zustand |
| Client server-state | TanStack Query |
| Forms | React Hook Form + Zod |
| API boundary | Shared backend contract for web and mobile: Supabase clients/RPC for core data, Route Handlers/Edge Functions for trusted vendor operations, OpenAPI-documented REST endpoints for mobile parity |

Supabase is the canonical backend for v0.1 across web and mobile. Do not introduce a custom NestJS or FastAPI backend unless a measured MVP requirement cannot be met through Supabase, Vercel Functions, or Supabase Edge Functions.

## Consequences

Positive:

- One platform covers auth, DB, storage, policies, functions, and vector search.
- RLS can enforce user ownership close to the data.
- The frontend team can move quickly with App Router and Supabase SSR clients.
- Flutter can reuse Supabase Auth, Storage, RLS, and the same domain API instead of creating a second backend.
- Shared catalog search can start in Postgres and avoid a separate vector database.
- Vercel preview deployments remain the natural delivery surface.
- Lava.top matches the founder payment constraint and supports webhook-based coin fulfillment.
- Mobile avoids app-store payment-policy risk in v0.1 by displaying balance and purchase status only.

Tradeoffs:

- Supabase-specific policies and functions become part of the architecture.
- Background removal depends on an external image API for v0.1.
- Marketplace parsing remains inherently best-effort and must have clear failure states.
- TanStack Query and next-intl must be added to the app dependencies before their feature slices.
- Flutter materially increases MVP delivery scope and requires mobile-specific QA, release signing, deep links, and store-review work.
- Lava.top payments for digital coins inside mobile apps carry App Store and Google Play policy risk; v0.1 therefore ships web purchases only, while mobile reflects ledger state after webhook fulfillment.

## Alternatives Considered

- Custom Node/NestJS backend: more control, but unnecessary operational load for v0.1.
- Python/FastAPI backend: useful for ML-heavy systems, but Capsule Zero outfit generation is algorithmic and the MVP does not require a Python service.
- Clerk/Auth0 plus separate Postgres/storage: strong auth products, but adds integration surface and separates identity from RLS-backed data ownership.
- Cloudflare R2/S3 for storage: viable later, but Supabase Storage keeps storage policies next to Postgres ownership for MVP.
- Web-only mobile-responsive MVP: lower scope, but rejected by updated founder requirement for native iOS and Android support.
- Stripe Checkout: previously accepted for coins, superseded by founder requirement to use Lava.top.
- In-app Lava.top purchase CTA for mobile: deferred until store-policy approval or a store-specific fallback is selected.

## References

- Supabase Next.js SSR guide: https://supabase.com/docs/guides/auth/server-side/nextjs
- Supabase AI and vectors: https://supabase.com/docs/guides/ai
- Supabase pgvector: https://supabase.com/docs/guides/database/extensions/pgvector
- Supabase hybrid search: https://supabase.com/docs/guides/ai/hybrid-search
- Flutter Supabase client: https://supabase.com/docs/reference/dart/introduction
- Flutter deep linking: https://docs.flutter.dev/ui/navigation/deep-linking
- Lava.top developer API: https://developers.lava.top/en
- Apple External Purchase: https://developer.apple.com/documentation/storekit/external-purchase
- Google Play external offers: https://developer.android.com/google/play/billing/external/integration
- next-intl: https://next-intl.dev/
- Vercel environment variables: https://vercel.com/docs/environment-variables
