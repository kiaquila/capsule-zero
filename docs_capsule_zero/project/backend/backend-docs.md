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

| Module             | Responsibility                                                                       |
| ------------------ | ------------------------------------------------------------------------------------ |
| Auth/Profile       | Supabase session, profile row, language, avatar, optional location                   |
| Wardrobe           | User item entries, item metadata, favorites, for-sale/for-repair/uncapsulated states |
| Capsule            | Capsule creation, locked palette, category targets, membership changes               |
| Methodology        | Color compatibility, basic category validation, OPR, outfit generation, gap analysis |
| Uploads            | File validation, storage metadata, optional background removal                       |
| Marketplace Import | URL parsing, parsed candidates, confirmation, moderation queue                       |
| Catalog Search     | Public item search using FTS + pgvector                                              |
| Billing            | Lava.top invoice creation, webhook idempotency, coin ledger                          |

## Database Schema

### Identity And Billing

| Table         | Purpose                                                                                                  |
| ------------- | -------------------------------------------------------------------------------------------------------- |
| `profiles`    | App profile keyed by `auth.users.id`: display name, avatar, language, country, city, cached coin balance |
| `coin_ledger` | Append-only coin purchase/spend/refund log                                                               |
| `lava_events` | Processed Lava.top webhook event IDs or contract/invoice IDs for idempotency                             |

Canonical ownership column name is `user_id`. Shared items use a two-table ownership pattern: `items.visibility` controls catalog exposure, while `wardrobe_entries.user_id` controls each user's relationship to an item.

`lava_events` must be migration-backed before Lava.top integration:

| Field               | Type                 | Notes                                                              |
| ------------------- | -------------------- | ------------------------------------------------------------------ |
| `id`                | text PK              | Lava.top event ID, contract ID, or invoice-derived idempotency key |
| `lava_invoice_id`   | text nullable        | Invoice/payment traceability                                       |
| `event_type`        | text                 | Provider event type, for example `payment.success`                 |
| `payload_hash`      | text                 | Hash of normalized payload for replay/debug checks                 |
| `payload`           | jsonb                | Raw provider payload for audit/debug                               |
| `processing_status` | text                 | `received`, `processed`, `ignored`, or `failed`                    |
| `received_at`       | timestamptz          | Server-generated                                                   |
| `processed_at`      | timestamptz nullable | Set after idempotent fulfillment attempt                           |
| `error_message`     | text nullable        | Failure detail safe for internal logs                              |

`coin_ledger.lava_event_id` is nullable for non-Lava spends/refunds, but when present it references `lava_events.id`. Coin spend entries use `reason = 'extra_capsule'` or `reason = 'photo_enhancement'` and are created only by server-side code after balance and idempotency validation.

### Static Methodology Data

| Table                 | Purpose                                                              |
| --------------------- | -------------------------------------------------------------------- |
| `color_catalog`       | Seeded 51-color system with IDs, groups, names, HEX values           |
| `category_catalog`    | Seeded garment categories, wardrobe type applicability, outfit layer |
| `compatibility_rules` | Seeded compatibility matrix for color groups                         |

### Items And Assets

| Table                 | Purpose                                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `items`               | Canonical item metadata: name, category, colors, brand, material, source URL, source type, owner, visibility, moderation state |
| `wardrobe_entries`    | Per-user relationship to an item: active/uncapsulated/for_sale/for_repair, favorite, from catalog, user overrides              |
| `item_assets`         | Storage object metadata for original, processed, thumbnail, marketplace, and avatar variants                                   |
| `upload_jobs`         | Status and error tracking for photo uploads, background removal, marketplace parsing, and embeddings                           |
| `marketplace_imports` | Submitted URLs, parse status, parsed candidates, confirmed item link                                                           |
| `moderation_queue`    | Internal approval flow before marketplace items become public catalog entries                                                  |
| `item_embeddings`     | pgvector vectors and searchable text for public catalog items                                                                  |

### Capsules

| Table                      | Purpose                                                                   |
| -------------------------- | ------------------------------------------------------------------------- |
| `capsules`                 | User capsule: wardrobe type, locked palette flag, item/outfit counts, OPR |
| `capsule_palette_colors`   | Selected immutable color IDs per capsule                                  |
| `capsule_category_targets` | Selected category targets and quantities from Journey Step 2              |
| `capsule_items`            | Wardrobe entries included in a capsule                                    |
| `outfits`                  | Generated static outfit combinations                                      |
| `outfit_items`             | Items included in each generated outfit                                   |
| `gap_recommendations`      | Category/color/priority/impact recommendations                            |

## RLS Baseline

- Enable RLS on all application tables.
- Users can read/write only rows where `user_id = auth.uid()` or where ownership is proven through an explicit join such as `wardrobe_entries.user_id`.
- Public catalog reads are allowed only when `items.visibility = 'public'`.
- Personal uploads and their assets are never public in v0.1.
- Marketplace-imported items start private or moderation-pending, then become public only after approval.
- Coin ledger inserts and Lava.top event writes are server-only through Route Handlers or Edge Functions using server credentials. Client Supabase sessions can read only their own ledger rows.
- Admin moderation routes use server-only credentials and must not expose service-role keys to the browser.

## Storage

Buckets:

- `avatars`
- `item-originals`
- `item-processed`
- `marketplace-imports`
- `catalog-public`

Storage metadata lives in `item_assets`; storage object paths are not the source of truth. Private images are read through signed URLs. `catalog-public` is a public bucket, but only approved shared catalog images may be copied there after moderation.

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

| Variable                        | Scope                 | Purpose                                             |
| ------------------------------- | --------------------- | --------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | browser/server        | Supabase project URL                                |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser/server        | Supabase anon key                                   |
| `SUPABASE_SERVICE_ROLE_KEY`     | server only           | Admin/server operations                             |
| `PHOTOROOM_API_KEY`             | server only           | Primary background removal provider                 |
| `REMOVE_BG_API_KEY`             | server only, optional | Fallback background removal provider                |
| `LAVA_API_KEY`                  | server only           | API key for requests to Lava.top                    |
| `LAVA_WEBHOOK_API_KEY`          | server only           | Key expected in Lava.top webhook `X-Api-Key` header |
| `LAVA_API_URL`                  | server only           | Lava.top API base URL                               |
| `LAVA_COINS_5_PRODUCT_ID`       | server only           | Lava.top product ID for the 5-coin pack             |
| `LAVA_COINS_15_PRODUCT_ID`      | server only           | Lava.top product ID for the 15-coin pack            |
| `LAVA_COINS_30_PRODUCT_ID`      | server only           | Lava.top product ID for the 30-coin pack            |
| `NEXT_PUBLIC_APP_URL`           | browser/server        | Absolute app URL for callbacks                      |
| `MOBILE_DEEP_LINK_SCHEME`       | server/mobile         | Mobile return URL scheme for auth callbacks         |
| `EMBEDDING_PROVIDER`            | server only           | Catalog embedding provider switch                   |

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

Runtime provisioning commands, evidence format, and provider dashboard checks
are tracked in `docs_capsule_zero/project/devops/sprint-0-runtime-provisioning.md`.

## Seed Data

Seed data must include:

- 51 color records from `docs_capsule_zero/project/methodology/colors.md`
- garment categories from `docs_capsule_zero/project/methodology/categories.md`
- compatibility matrix from `docs_capsule_zero/project/methodology/colors.md`
- coin pack definitions matching market docs: 5, 15, 30 coin packs
- a small public catalog fixture for semantic search smoke testing

## References

- Stack ADR: `docs_capsule_zero/adr/adr-001-stack.md`
- Auth ADR: `docs_capsule_zero/adr/adr-002-auth.md`
- Storage ADR: `docs_capsule_zero/adr/adr-003-storage.md`
- API spec: `docs_capsule_zero/adr/api-spec.md`
