# Backend Stateful Slices Plan

> Rewritten 2026-06-27 for the production-stack pivot. Previous Supabase-shaped slice plan lives in git history.

## Purpose

Map every user-visible mutation in the approved HTML prototypes to a backend slice in the Go modular monolith. Each slice becomes its own spec under `.specify/specs/<id>-…/` with tests written before implementation. There is no Stage 1 mock-first layer — every slice ships against real Postgres / Kratos / Spaces from the first PR (see ADR-006).

## Prerequisite

Slices below depend on `.specify/specs/024-production-stack-runtime/` shipping first. That spec brings up the Go monolith, Kratos, Postgres, Redis, nginx, Spaces, Cloudflare, and Resend in docker-compose on the droplet. `/app` remains the canonical frontend while its retired Supabase provider is removed domain by domain.

## Bounded Contexts In The Monolith

Slice work modifies packages inside `/api/internal/`:

- `auth` — Kratos session, user resolution
- `profile` — profiles, language, avatar metadata
- `wardrobe` — items, wardrobe_entries, favorites, statuses
- `capsule` — capsules, palette, members, outputs
- `methodology` — color compatibility, OPR, gap analysis (pure logic)
- `upload` — signed PUT URLs, upload_jobs, asset attach
- `marketplace` — link parser adapters, import jobs
- `catalog` — FTS-first search and public reads; pgvector upgrades in slice 11
- `billing` — Lava.top stub, invoice + webhook handlers, coin ledger (v0.2 wiring)
- `moderation` — admin moderation queue
- `storage` — Spaces client wrapper
- `email` — Resend client wrapper
- `eventbus` — Redis-backed job enqueue / consume

## Slice 01 — Auth, Session, Profile Basics

Spec: `.specify/specs/023-auth-profile-state/`

Goal: registration, login, logout, password recovery, current session, and profile read/update fully stateful behind Kratos and the Go API.

Tests first:

- Sign-up creates a Kratos identity and a `profiles` row, with `display_name` defaulting from email.
- Sign-in returns a Kratos session cookie that the Go API recognises.
- Logout clears the session and protected routes redirect.
- Invalid credentials return a safe inline error.
- Password recovery sends a Resend email and does not reveal account existence.
- `PATCH /api/profile` updates display name, country, city, locale for the owner only.
- Cross-user profile reads return 403/404.

Implementation:

- `internal/auth`: Kratos session middleware; `RequireSession(handler)` helper.
- `internal/profile`: repository + service + handlers for `GET /api/profile`, `PATCH /api/profile`.
- Kratos courier configured against Resend SMTP; verification + recovery templates ship with the slice.
- Web frontend renders Kratos self-service flows in `app/src/app/[locale]/auth/...`.

## Slice 02 — Profile Avatar Upload

Spec: `.specify/specs/024-profile-avatar-storage/`

Goal: upload/replace/delete avatar against Spaces, persist `profiles.avatar_asset_id`.

Tests first:

- JPEG/PNG/WebP accepted, oversize/MIME-invalid rejected.
- `POST /api/uploads/photo/init` with `purpose=avatar` returns a signed PUT URL targeting the `avatars/` prefix.
- `POST /api/uploads/photo/complete` writes `item_assets` with `variant=avatar` and the originating user owns it.
- `POST /api/profile/avatar` attaches an `assetId` to the profile.
- `DELETE /api/profile/avatar` detaches and (optionally) deletes the storage object.
- Cross-user avatar reads return signed URLs only for owner.

## Slice 03 — Wardrobe Item CRUD, Favorite, Status

Spec: `.specify/specs/025-wardrobe-item-state/`

Goal: persist every wardrobe mutation visible on My Items, Favorites, Uncapsulated, For Sale, For Repair (everything except photo upload itself).

Tests first:

- `POST /api/items` creates `items` + `wardrobe_entries` rows for the owner.
- `PATCH /api/items/{id}` updates editable fields; cross-user 403.
- `DELETE /api/items/{id}` removes the wardrobe entry; private items are deleted, catalog items keep `items` and only drop the entry.
- `POST /api/items/{id}/favorite` is idempotent.
- `PATCH /api/items/{id}/status` cycles between `active|uncapsulated|for_sale|for_repair`.
- Moving an item to `for_sale`/`for_repair` removes capsule membership and triggers OPR/outfit recompute.

## Slice 04 — Clothing Photo Upload And Item Asset Storage

Spec: `.specify/specs/026-item-photo-upload-storage/`

Goal: photo uploads from Guided Journey and wardrobe detail screens persist to Spaces and attach to items.

Tests first:

- Signed PUT URL flow works under the size/MIME bounds.
- `item_assets` records the original variant.
- Attach/replace asset on a wardrobe item is idempotent.
- Cross-user signed-URL reuse returns 403.
- Background-removal job is not enqueued in v0.1 (the worker code stays dormant until Stage 2).

## Slice 05 — Catalog Search And Add

Spec: `.specify/specs/027-catalog-search-add-state/`

Goal: Journey "Search Catalog" tab and "Add to wardrobe" against the shared catalog.

Tests first:

- `GET /api/catalog/search` returns ranked public items by FTS query and filters.
- `POST /api/catalog/items/{id}/add` creates or reuses a wardrobe entry with `from_catalog=true`.
- Private items never appear in catalog search.
- Empty/filtered/zero-result paths covered.

Note: this slice uses FTS-only ranking. Semantic ranking via pgvector ships in slice 11.

## Slice 06 — Marketplace Import

Spec: `.specify/specs/028-marketplace-import-state/`

Goal: replace local URL parsing in Guided Journey with persisted import jobs and confirmed wardrobe items.

Tests first:

- `POST /api/imports/marketplace` accepts up to 5 URLs and creates persisted import state per URL.
- Best-effort parser produces candidate items; provider failure stores `failed` with safe error code.
- `POST /api/imports/{id}/confirm` creates a private wardrobe item; public exposure requires moderation.
- Cross-user import reads return 403.

## Slice 07 — Minimal Stateful Capsule Creation

Spec: `.specify/specs/029-capsule-create-state/`

Goal: persist a capsule from Journey selections; defer the full outfit/gap engine to slice 08.

Tests first:

- `POST /api/capsules` persists name, wardrobe type, category targets, locked palette color IDs.
- Selected wardrobe entries attach through `POST /api/capsules/{id}/items`.
- Minimum category count is enforced.
- Incompatible palettes are rejected.
- Duplicate item IDs are rejected or deduped consistently.
- `GET /api/capsules/current` returns the latest capsule.

## Slice 08 — Capsule Algorithm Engine

Spec: `.specify/specs/030-capsule-algorithm-engine/`

Goal: implement compatibility, outfit generation, OPR, gap analysis, shopping list in `internal/methodology` as pure Go logic.

Tests first:

- Unit tests for color compatibility against `colors.md` matrix.
- Unit tests for 7-layer outfit construction from `outfit-generation.md`.
- OPR formula tested on zero-item, single-item, full-capsule.
- Gap rules from `gap-analysis.md`: structural, color, combinability, layer balance.
- Integration test: compatibility blocks incompatible add with explanation + alternative.
- Integration test: capsule mutation triggers regenerate and writes `outfits`, `outfit_items`, `gap_recommendations`, updates `capsules.item_count`, `outfit_count`, `opr`.

Implementation:

- `internal/methodology` holds the algorithm; `internal/capsule` orchestrates DB writes around it. No SQL RPC.

## Slice 09 — Capsule Management Mutations

Spec: `.specify/specs/031-capsule-management-state/`

Goal: persist Capsule Result add/remove/replace and recompute outputs.

Tests first:

- `POST /api/capsules/{id}/items` validates compatibility and adds membership.
- `DELETE /api/capsules/{id}/items/{entryId}` removes membership and moves item to `uncapsulated` when no capsule remains.
- `POST /api/capsules/{id}/items/{entryId}/replace` validates the replacement, swaps membership, marks replaced item `uncapsulated`.
- Duplicate add is idempotent or returns 409.
- Every mutation calls the algorithm engine.

## Slice 10 — Wardrobe Lifecycle Details

Spec: `.specify/specs/032-wardrobe-lifecycle-state/`

Goal: finish lifecycle-specific behavior for Uncapsulated, For Sale, For Repair.

Tests first:

- Add to capsule from Uncapsulated validates compatibility and persists membership.
- Move to For Sale removes membership and excludes the item from stats.
- Return from For Sale goes to Uncapsulated.
- Move to For Repair removes membership and excludes the item from stats.
- Mark fixed returns the item to Uncapsulated.
- Repair notes persist if kept in v0.1 scope.

## Slice 11 — Semantic Search With pgvector

Spec: `.specify/specs/033-semantic-search-engine/`

Goal: upgrade catalog search from FTS-only to hybrid FTS + pgvector ranking.

Tests first:

- Embedding jobs are produced for public catalog items and consumed by the worker.
- Search combines pgvector similarity, FTS, and filters with stable ordering on seeded fixtures.
- Empty/failed embedding config degrades to FTS-only.
- Private wardrobe photos never enter public semantic search.

## Slice 12 — Billing And Lava Webhooks (v0.2)

Spec: `.specify/specs/034-billing-coins-state/`

Goal: ship Lava.top integration and coin ledger after the core wardrobe flows.

Tests first:

- Coin pack list returns configured packs.
- Invoice creation requires real Lava credentials and persists invoice state.
- Webhook signature verification rejects invalid payloads.
- Webhook replay is idempotent via `lava_events`.
- Paid webhook credits coins exactly once.
- Coin spends are atomic and idempotent.
- Mobile purchase CTAs remain absent.

## Slice 13 — Moderation And Public Catalog (v0.2)

Spec: `.specify/specs/035-catalog-moderation-state/`

Goal: support US-025 public imported items without leaking private photos.

Tests first:

- Imported marketplace items default to private or moderation pending.
- Personal uploads never become public in v0.1.
- Admin moderation list returns pending items only to admin role.
- Approve → public + enqueue embedding job.
- Reject keeps the item private/non-searchable.

## Recommended Execution Order

`022 → 023 → 024 → 025 → 026 → 027 → 028 → 029 → 030 → 031 → 032 → 033 → 034 → 035`

The only intentional priority tension is marketplace import (028) vs minimal capsule creation (029). If the product goal is "complete the Journey end-to-end with any items", do 029 before 028. If "three upload methods are fully credible before capsule creation", keep 028 before 029.

## Spec Template (every slice)

- `## Goal` — one user-visible stateful capability.
- `## Scope` — UI screens, API routes, internal packages, migrations.
- `## Negative Scenarios` — at least one explicit failure path.
- `## Acceptance Criteria` — testable Given/When/Then rows.
- `## Test Plan` — unit, integration, route handler, and one negative scenario before implementation.
- `## Verification` — command/evidence table in `plan.md`.
- `## Process Memory` — Dead Ends / Decisions / Known Issues in `tasks.md`.
