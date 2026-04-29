# Backend Docs

## Stack

Capsule Zero v0.1 uses Supabase as the canonical backend:

- Supabase Auth for email/password, Google OAuth, and Apple Sign-In
- Supabase PostgreSQL for application data
- Row Level Security for ownership and privacy
- Supabase Storage for avatars, wardrobe photos, processed images, and catalog assets
- Supabase Edge Functions or Vercel Route Handlers for server-only jobs and vendor calls
- PostgreSQL full-text search plus pgvector for shared catalog search
- Lava.top invoices/payment links and webhooks for web coin purchases

Next.js Route Handlers act as the app-facing API boundary for uploads, marketplace import, catalog search, billing, and webhooks. Flutter mobile apps consume the same Supabase schema, RPC functions, storage policies, and REST endpoints, but v0.1 mobile payments are read-only balance/status views. Server Actions may call the same domain services for authenticated web mutations.

## Core Backend Modules

| Module | Responsibility |
|---|---|
| Auth/Profile | Supabase session, profile row, language, avatar, optional location |
| Wardrobe | User item entries, item metadata, favorites, for-sale/for-repair/uncapsulated states |
| Capsule | Capsule creation, locked palette, category targets, membership changes |
| Methodology | Color compatibility, basic category validation, OPR, outfit generation, gap analysis |
| Uploads | File validation, storage metadata, optional background removal |
| Marketplace Import | URL parsing, parsed candidates, confirmation, moderation queue |
| Catalog Search | Public item search using FTS + pgvector |
| Billing | Lava.top invoice creation, webhook idempotency, coin ledger |

## Database Schema

### Identity And Billing

| Table | Purpose |
|---|---|
| `profiles` | App profile keyed by `auth.users.id`: display name, avatar, language, country, city, cached coin balance |
| `coin_ledger` | Append-only coin purchase/spend/refund log |
| `lava_events` | Processed Lava.top webhook event IDs or contract/invoice IDs for idempotency |

### Static Methodology Data

| Table | Purpose |
|---|---|
| `color_catalog` | Seeded 51-color system with IDs, groups, names, HEX values |
| `category_catalog` | Seeded garment categories, wardrobe type applicability, outfit layer |
| `compatibility_rules` | Seeded compatibility matrix for color groups |

### Items And Assets

| Table | Purpose |
|---|---|
| `items` | Canonical item metadata: name, category, colors, brand, material, source URL, source type, owner, visibility, moderation state |
| `wardrobe_entries` | Per-user relationship to an item: active/uncapsulated/for_sale/for_repair, favorite, from catalog, user overrides |
| `item_assets` | Storage object metadata for original, processed, thumbnail, marketplace, and avatar variants |
| `upload_jobs` | Status and error tracking for photo uploads, background removal, marketplace parsing, and embeddings |
| `marketplace_imports` | Submitted URLs, parse status, parsed candidates, confirmed item link |
| `moderation_queue` | Internal approval flow before marketplace items become public catalog entries |
| `item_embeddings` | pgvector vectors and searchable text for public catalog items |

### Capsules

| Table | Purpose |
|---|---|
| `capsules` | User capsule: wardrobe type, locked palette flag, item/outfit counts, OPR |
| `capsule_palette_colors` | Selected immutable color IDs per capsule |
| `capsule_category_targets` | Selected category targets and quantities from Journey Step 2 |
| `capsule_items` | Wardrobe entries included in a capsule |
| `outfits` | Generated static outfit combinations |
| `outfit_items` | Items included in each generated outfit |
| `gap_recommendations` | Category/color/priority/impact recommendations |

## RLS Baseline

- Enable RLS on all application tables.
- Users can read/write only rows they own.
- Public catalog reads are allowed only when `items.visibility = 'public'`.
- Personal uploads and their assets are never public in v0.1.
- Marketplace-imported items start private or moderation-pending, then become public only after approval.
- Coin ledger inserts and Lava.top event writes are server-only.
- Admin moderation routes use server-only credentials and must not expose service-role keys to the browser.

## Storage

Buckets:

- `avatars`
- `item-originals`
- `item-processed`
- `marketplace-imports`
- `catalog-public`

Storage metadata lives in `item_assets`; storage object paths are not the source of truth. Private images are read through signed URLs. Public catalog imagery may use public URLs only after moderation.

## Background Jobs

Initial job types:

- `background_removal`
- `marketplace_parse`
- `item_embedding`
- `capsule_recompute`

MVP implementation can use Route Handlers or Supabase Edge Functions. Jobs must write status to `upload_jobs`, expose retry for recoverable failures, and record duration for the 5 second quality gate.

## Sprint 0 Backend Gate

Before product feature implementation, create migration-backed backend artifacts:

- `supabase/migrations/0001_initial_schema.sql` with tables, indexes, foreign keys, enum/check constraints, seed references, and RPC signatures.
- `supabase/migrations/0002_storage_policies.sql` or equivalent storage policy migration for every bucket.
- `supabase/tests/` coverage for owner isolation, public catalog access, private asset reads, server-only coin ledger writes, and webhook idempotency.
- API contract sync with `docs_capsule_zero/adr/openapi.yaml`, including generated TypeScript and Dart clients.

Feature PRs must not introduce ad hoc schema changes outside migrations.

## Environment Variables

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | browser/server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | browser/server | Supabase publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Admin/server operations |
| `PHOTOROOM_API_KEY` | server only | Primary background removal provider |
| `REMOVE_BG_API_KEY` | server only, optional | Fallback background removal provider |
| `LAVA_API_KEY` | server only | API key for requests to Lava.top |
| `LAVA_WEBHOOK_API_KEY` | server only | Key expected in Lava.top webhook `X-Api-Key` header |
| `LAVA_API_URL` | server only | Lava.top API base URL |
| `NEXT_PUBLIC_APP_URL` | browser/server | Absolute app URL for callbacks |
| `MOBILE_DEEP_LINK_SCHEME` | server/mobile | Mobile return URL scheme for auth callbacks |
| `EMBEDDING_PROVIDER` | server only | Catalog embedding provider switch |

## Local Development

Required local setup before backend implementation:

1. Create Supabase project or local Supabase stack.
2. Apply database migrations for schema, RLS, and seed data.
3. Seed `color_catalog`, `category_catalog`, and `compatibility_rules` from methodology docs.
4. Create storage buckets and policies.
5. Configure Google and Apple OAuth providers.
6. Configure Lava.top products, API key, and webhook URL for web purchases.
7. Add `.env.local` under `app/` with the variables above.
8. Add mobile env/config for Supabase URL, publishable key, app links, and deep-link scheme.

## Seed Data

Seed data must include:

- 51 color records from `docs_capsule_zero/project/methodology/colors.md`
- garment categories from `docs_capsule_zero/project/methodology/categories.md`
- compatibility matrix from `capsule-methodology.md`
- coin pack definitions matching market docs: 5, 15, 30 coin packs
- a small public catalog fixture for semantic search smoke testing

## References

- Stack ADR: `docs_capsule_zero/adr/adr-001-stack.md`
- Auth ADR: `docs_capsule_zero/adr/adr-002-auth.md`
- Storage ADR: `docs_capsule_zero/adr/adr-003-storage.md`
- API spec: `docs_capsule_zero/adr/api-spec.md`
