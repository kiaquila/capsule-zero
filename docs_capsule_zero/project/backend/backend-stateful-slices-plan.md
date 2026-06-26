# Backend Stateful Slices Plan

Date: 2026-06-26

Purpose: turn the current mock-first/provider-gated backend into stateful backend slices that support every user-facing UI mutation already present in the web app. Each slice is intended to become a separate spec-driven work package with tests written before implementation.

## Source State

Evidence:

- `git fetch --all --prune` was run on 2026-06-26 before this audit.
- GitHub source of truth: `origin/main` is at `c8d84d8` (`Make cookie consent ePrivacy-compliant (#44)`).
- Open PR #45, `[codex] Add real Supabase Docker Compose runtime`, is open against `main`, not draft, and currently blocked by a failing `AI Review` check.
- Local `main` is stale versus `origin/main` by `1 31` in `git rev-list --left-right --count main...origin/main`; the current worktree also contains unrelated WIP. This plan uses `origin/main` plus the visible PR #45 branch as evidence and does not assume local WIP is merged.

Baseline interpretation:

- `origin/main` is still mock-first: `CAPSULE_PROVIDER_MODE=supabase` is an integration gate in `app/src/lib/providers/registry.ts`.
- PR #45 is the expected runtime baseline for stateful work: it adds `app/src/lib/providers/supabase/index.ts`, switches production toward real Supabase mode, adds Compose/Supabase runtime files, and adds migrations `0003_runtime_provider_alignment.sql` and `0004_atomic_coin_spend.sql`.
- The plan below should start only after PR #45 is either merged or its equivalent runtime/provider baseline is recreated in the target branch.

## Inventory Of Stubs And Missing Stateful Surfaces

### API Route Layer

OpenAPI defines 44 operations in `docs_capsule_zero/adr/openapi.yaml`. The app currently has only one route handler:

- `app/src/app/api/health/route.ts`

All other OpenAPI operations still need route handlers or an intentional decision that web-only Server Actions own the surface and OpenAPI/mobile will follow later. Because the mobile app is expected to consume the same API contract, the preferred path is to implement route handlers and let Server Actions call the same domain services.

Missing route groups:

- Auth callbacks: `GET /auth/callback`, `GET /auth/mobile-callback`
- Profile: `GET/PATCH /api/profile`, `POST/DELETE /api/profile/avatar`
- Journey/methodology: `GET /api/journey/categories`, `POST /api/journey/custom-category/validate`, `POST /api/palette/validate`
- Capsules: create/current/get/update/items/add/remove/replace/outfits/gaps/shopping-list
- Items: list/create/get/update/delete/favorite/status
- Uploads: init/complete/background-removal/get job
- Marketplace import: create/get/confirm
- Catalog: search/get/add
- Billing: Lava invoice/status, coin spend, Lava webhook
- Admin moderation: list/update moderation items

### Provider Contract Gaps

`app/src/lib/providers/contracts.ts` has useful ports, but it does not yet cover every UI/OpenAPI mutation.

Already present:

- `AuthPort`: sign up, sign in, recovery, sign out, current session.
- `ProfileRepository`: get/update profile basics.
- `WardrobeRepository`: list/get/create item, update status, set favorite.
- `StoragePort`: create photo upload target, complete upload, signed asset URL.
- `ImageProcessingPort`: start background removal, get upload job.
- `MarketplaceImportPort`: create/get/confirm import.
- `CatalogSearchPort`: search/add catalog item.
- `BillingPort`: coin packs, Lava invoice/status, spend, webhook replay.
- `CapsuleRepository`: get current capsule, create capsule.
- `MethodologyPort`: validate palette, list journey categories.

Missing or too narrow:

- Profile avatar upload/delete should be an explicit profile/storage service, not only `ProfileUpdate.avatarUrl`.
- Username availability is currently a hard-coded stub in `app/src/features/profile/actions.ts`.
- Profile language is in `ProfileUpdate`, but the current profile form action does not persist it from the UI path.
- Wardrobe item update/delete is in OpenAPI but missing from `WardrobeRepository`.
- Item photo replacement needs a first-class method to attach/replace assets.
- Marketplace imports are too narrow if kept as a single `url`; the active UI and OpenAPI require a `urls` array of up to 5 links.
- Capsule membership add/remove/replace is in OpenAPI but missing from `CapsuleRepository`.
- Capsule output reads for outfits, gaps, shopping list are in OpenAPI but missing from provider contracts.
- Custom category validation is in OpenAPI but missing from `MethodologyPort`.
- Repair notes, resale metadata, and "visible in catalog" behavior in the UI need explicit schema/contract decisions.
- Moderation list/update is in OpenAPI but has no provider/admin service.

### Database And Algorithm Stubs

`supabase/migrations/0001_initial_schema.sql` includes intentional contract placeholder functions:

- `validate_item_for_capsule(item_id, capsule_id)` always returns compatible.
- `regenerate_capsule_outputs(capsule_id)` always returns zero outfit count, zero OPR, and zero gap count.
- `search_catalog_hybrid(query, filters)` is a simple public item name `ILIKE` query with rank `0::real`, not semantic/pgvector search.
- `queue_item_embedding(item_id)` queues an embedding job, but there is no worker/provider implementation.

PR #45 adds an atomic coin spend RPC, which is good baseline work, but Lava webhook replay still needs full event/audit idempotency around `lava_events`, signature verification, and provider payload normalization.

### UI Mutations That Are Local-Only Today

These actions are visible to users but mutate React state only or show a design-only notice:

- Guided Journey:
  - photo upload creates `blob:` previews only.
  - marketplace link parsing is local string logic.
  - catalog add only appends local journey items.
  - palette compatibility is local UI logic.
  - Create capsule uses `window.setTimeout` and redirects without persisting.
- Profile:
  - avatar upload/delete changes preview only.
  - password change is Stage 1 design-only.
  - delete account is Stage 1 design-only.
  - username availability is a hard-coded local reserved-name set.
- My Items:
  - create/edit/delete item is local state only.
  - favorite toggle is local state only.
  - move to sale/repair is local state only.
  - photo replacement is local preview only.
- Favorites:
  - unfavorite, add to capsule, delete, move sale/repair are local state only.
- Uncapsulated:
  - add to capsule, move sale/repair, edit/delete/favorite/photo are local state only.
- For Sale:
  - return to My Items, add to capsule, delete, edit, favorite, catalog visibility are local state only.
- For Repair:
  - mark fixed, delete, edit, favorite, repair note/photo are local state only.
- Capsule Result:
  - favorite, remove, replace, add item are local state only.

### External Integration Gates

These should remain explicit gates and must not silently fake success in production:

- Photoroom background removal.
- Marketplace parser/provider.
- Lava.top invoices and webhooks.
- Google OAuth and Apple Sign-In are MVP Stage 2.
- Embedding provider for pgvector semantic search.

## Prioritization Principles

1. Close visible UI state first: if the user can press it today, it needs a backend mutation or an explicit "design-only" guard.
2. Start with identity and ownership because every later slice depends on authenticated user state and RLS.
3. Separate storage from domain mutations: avatar and clothing image upload deserve their own slices.
4. Keep capsule creation and capsule algorithm separate. Creation can persist a plan; the algorithm engine must be designed and tested independently.
5. Preserve provider ports as the backend boundary. Route handlers and Server Actions should call shared services, not duplicate logic.
6. Write tests before implementation. Each slice must update `.specify/specs/<id>/plan.md` with evidence, including at least one negative scenario.

## Slice Plan

### Slice 00 - Runtime Baseline And Backend Test Harness

Suggested spec: `.specify/specs/024-backend-runtime-test-harness/`

Goal:

- Merge or recreate the PR #45 runtime/provider baseline.
- Add a repeatable backend test lane for provider contracts, route handlers, and Supabase RPC/RLS.

Tests first:

- Add a test command that can run provider/service tests without a browser.
- Add a route-handler test pattern for authenticated and unauthenticated requests.
- Extend `supabase/tests/rls_contract.sql` to assert any new functions and tables before implementation.
- Keep `npm run preflight` green.

Implementation:

- Resolve PR #45 AI Review failure and merge, or branch from PR #45 head.
- Decide test runner for app backend tests. Current repo has no app test runner configured; add the smallest maintained option that fits Next/TS.
- Add test fixtures for signed app session, mock provider, and Supabase service-role isolation.
- Document local commands in the spec `plan.md`.

Acceptance:

- `CAPSULE_PROVIDER_MODE=supabase` works in the local runtime.
- `/api/health` reports Supabase/storage/semantic search configured and external gates pending when credentials are absent.
- Test harness can run one provider test and one route-handler test in CI.

### Slice 01 - Auth, Session, And Profile Basics

Suggested spec: `.specify/specs/025-auth-profile-state/`

Goal:

- Make registration, login, logout, recovery, current session, and profile basics stateful and verified.
- Support the UI paths in `AuthPanel` and profile save.

Tests first:

- Sign-up creates an auth user and a `profiles` row.
- Sign-in returns a signed app session cookie and dashboard/profile loaders can read it.
- Logout clears session and protected pages redirect.
- Invalid credentials return a safe error.
- Password recovery calls Supabase and does not reveal account existence.
- `PATCH /api/profile` updates display name, country, city, and locale for the owner only.
- Username availability test is either backed by a real unique/reserved table or removed from active UI scope.

Implementation:

- Add route handlers: `GET /api/profile`, `PATCH /api/profile`, auth callback handlers if needed by Supabase flow.
- Refactor `saveProfileAction` to call shared profile service and stop persisting extra mock-only preferences as the source of truth.
- Replace `isUsernameAvailableStub` with a real contract or explicitly downgrade username to client-only display until schema exists.
- Ensure `ProfileRepository.updateProfile` supports locale from the profile/language UI path.

Acceptance:

- A real user can sign up, sign in, update profile basics, refresh the page, and see persisted values.
- Cross-user profile access is blocked by tests.

### Slice 02 - Profile Avatar Upload And Deletion

Suggested spec: `.specify/specs/026-profile-avatar-storage/`

Goal:

- Back the existing avatar UI with Supabase Storage and `profiles.avatar_asset_id`.

Tests first:

- JPEG/PNG/WebP accepted according to the MVP decision; unsupported MIME and oversize files are rejected.
- Avatar upload target flow creates a scoped `avatars` upload destination, then upload completion creates an `item_assets` row with `variant = 'avatar'`.
- `POST /api/profile/avatar` attaches an existing avatar `assetId` to the profile, matching the current OpenAPI `AvatarRequest` shape.
- Delete clears `profiles.avatar_asset_id` and either deletes or tombstones the storage object according to the spec.
- A different user cannot read private avatar assets unless the product intentionally exposes signed URLs.

Implementation:

- Add profile avatar service methods for attach/delete and a documented upload target path for avatar assets.
- Use the current OpenAPI upload route names as the starting point: either extend `POST /api/uploads/photo/init` and `POST /api/uploads/photo/complete` to support `purpose = 'avatar'` and `bucket = avatars` with generated-client updates in the same slice, or add explicit avatar upload-target routes after documenting them in OpenAPI before implementation.
- Keep `POST /api/profile/avatar` as the metadata attach route and `DELETE /api/profile/avatar` as the detach/delete route.
- Wire `ProfileShell.chooseAvatar` and `removeAvatar` to upload/delete instead of local preview only.
- Return signed/public avatar URL in profile data and navigation snapshots.

Acceptance:

- Avatar survives refresh and appears in profile/navigation.
- Delete reverts to default initials/avatar.

### Slice 03 - Wardrobe Item CRUD, Favorite, And Status

Suggested spec: `.specify/specs/027-wardrobe-item-state/`

Goal:

- Persist all visible My Items, Favorites, Uncapsulated, For Sale, and For Repair item mutations that do not require image upload.

Tests first:

- `POST /api/items` creates `items` plus `wardrobe_entries` for the authenticated user.
- `PATCH /api/items/{itemId}` updates name, category, color dots, brand, material, price, source URL, and catalog visibility rules where in scope.
- `DELETE /api/items/{itemId}` removes the user wardrobe entry and only deletes private owned item rows when safe.
- `POST /api/items/{itemId}/favorite` idempotently sets the requested `favorite` boolean and updates favorites lists; retries must not invert state.
- `PATCH /api/items/{itemId}/status` moves items between `active`, `uncapsulated`, `for_sale`, `for_repair`.
- Moving to sale/repair removes capsule membership and triggers capsule recomputation once the algorithm slice exists.
- Cross-user mutation attempts return 403/404.

Implementation:

- Extend `WardrobeRepository` with `updateItem`, `deleteItem`, and asset/link update support.
- Add route handlers: item list/create/get/update/delete/favorite/status.
- Wire My Items/Favorites/Uncapsulated/For Sale/For Repair local handlers to Server Actions or route calls.
- Add schema/migration if repair notes, sale notes, or catalog visibility need fields beyond current `items.visibility`.

Acceptance:

- Item create/edit/favorite/status/delete survive refresh on all wardrobe pages.
- Statistics and navigation counts come from persisted state, not local adjustments only.

### Slice 04 - Clothing Photo Upload And Item Asset Storage

Suggested spec: `.specify/specs/028-item-photo-upload-storage/`

Goal:

- Persist clothing photos from Guided Journey and wardrobe detail screens.

Tests first:

- `POST /api/uploads/photo/init` validates file metadata and returns a signed upload target.
- Supabase signed upload stores object under `item-originals`.
- `POST /api/uploads/photo/complete` registers `item_assets` and updates upload job status.
- A completed uploaded asset can be attached to a new or existing wardrobe item.
- Invalid MIME, oversize, missing job, and cross-user completion are rejected.
- Private item images are served through signed URLs and do not become public catalog assets.

Implementation:

- Add upload route handlers.
- Add item asset attach/replace service.
- Wire My Items photo picker and Guided Journey upload tab to real signed upload flow.
- Keep auto-tagging out of this slice unless a deterministic local classifier contract is explicitly approved.

Acceptance:

- Uploaded clothing image persists, survives refresh, and is visible on My Items/capsule pages.

### Slice 05 - Catalog Search And Add From Shared DB

Suggested spec: `.specify/specs/029-catalog-search-add-state/`

Goal:

- Back the Journey "Search Catalog" tab and catalog favorites/add-to-capsule paths with backend state.

Tests first:

- `GET /api/catalog/search` returns public catalog items by query and filters.
- `POST /api/catalog/items/{itemId}/add` creates or reuses a wardrobe entry with `from_catalog = true`.
- Adding the same catalog item twice is idempotent per user.
- Private items never appear in catalog search.
- Query/filter tests cover category, color, and empty result cases.

Implementation:

- Add catalog route handlers.
- Use PR #45 `CatalogSearchPort` initially, but mark `search_catalog_hybrid` as basic search until the semantic slice.
- Wire Guided Journey catalog add to create real wardrobe entries or journey draft references.
- Decide whether catalog favorites require adding to wardrobe first or a separate favorites table.

Acceptance:

- Catalog selections survive refresh and can be used in capsule creation.

### Slice 06 - Marketplace Import Adapter And Confirmation

Suggested spec: `.specify/specs/030-marketplace-import-state/`

Goal:

- Replace local URL parsing in Guided Journey with a persisted import job and confirmed wardrobe item.

Tests first:

- `POST /api/imports/marketplace` accepts the OpenAPI `urls` array, validates the maximum of 5 links, creates persisted import state for every URL, and calls a provider adapter.
- Missing provider config returns a safe integration error in production-like mode.
- Provider success stores parsed candidates.
- Provider failure stores failed status and safe error code.
- `POST /api/imports/{importId}/confirm` creates an item/wardrobe entry and records the confirmed underlying `items.id`.
- Imported marketplace items are private first; public catalog exposure goes through moderation.

Implementation:

- Add marketplace route handlers.
- Widen `MarketplaceImportPort` and provider schemas from single `url` to `urls` so the backend matches the Journey multi-link UI and generated clients.
- Introduce adapter interface with HTTP provider implementation plus test double.
- Wire Journey link tab to persisted imports.
- Add moderation enqueue if `isPublic` or imported item sharing is selected.

Acceptance:

- Pasted marketplace URLs produce persisted candidate cards; confirmed candidate survives refresh as a wardrobe item.

### Slice 07 - Minimal Stateful Capsule Creation

Suggested spec: `.specify/specs/031-capsule-create-state/`

Goal:

- Persist a capsule from Guided Journey selections without yet solving the full outfit/gap algorithm.

Tests first:

- `POST /api/capsules` persists only the fields currently present in `CreateCapsuleRequest`: name, wardrobe type, category targets, and locked palette color IDs.
- Selected wardrobe entries are attached through `POST /api/capsules/{capsuleId}/items`, or the slice updates OpenAPI/generated clients before adding item IDs to capsule creation.
- Minimum category count is enforced.
- Palette validation is called and incompatible palettes are rejected.
- Duplicate item IDs are rejected or deduped consistently in the membership-add step.
- User cannot add another user's wardrobe entry to the capsule.
- `GET /api/capsules/current` returns the latest capsule for dashboard/result pages.

Implementation:

- Add capsule create/current route handlers.
- Wire Guided Journey `createCapsule` to real backend call instead of timeout.
- Convert local journey items into real wardrobe entries before attaching them to the capsule.
- Persist selected wardrobe type, categories, and palette through capsule creation; persist selected item membership through the add-item route.
- If the product needs atomic create-with-items, update `docs_capsule_zero/adr/openapi.yaml` and generated clients before changing the route/provider request shape.

Acceptance:

- User can complete the Journey, redirect to result/dashboard, refresh, and see the same persisted capsule.

### Slice 08 - Capsule Algorithm Engine

Suggested spec: `.specify/specs/032-capsule-algorithm-engine/`

Goal:

- Replace placeholder algorithm functions with a tested Capsule Zero engine for compatibility, outfit generation, OPR, gap analysis, and shopping list.

Tests first:

- Unit tests for color compatibility using `docs_capsule_zero/project/methodology/colors.md`.
- Unit tests for category/layer outfit construction using `outfit-generation.md`.
- Unit tests for OPR: `outfits / items`, including zero-item plan state.
- Unit tests for gap rules using `gap-analysis.md`: structural, color, combinability, layer balance.
- Integration tests for `validate_item_for_capsule`: compatible, incompatible, achromatic, missing item/capsule, cross-user.
- Integration tests for `regenerate_capsule_outputs`: writes `outfits`, `outfit_items`, `gap_recommendations`, updates `capsules.item_count`, `outfit_count`, `opr`.
- Negative scenario: incompatible item is blocked with explanation and alternative path.

Implementation:

- Decide implementation home: TypeScript domain service with DB writes, SQL RPC, or hybrid. Prefer TypeScript for algorithm readability unless performance demands SQL.
- Replace `validate_item_for_capsule` placeholder or route it through the domain service.
- Replace `regenerate_capsule_outputs` placeholder or make it a thin RPC invoked by the domain service.
- Add route handlers: `GET /api/capsules/{capsuleId}/outfits`, `/gaps`, `/shopping-list`.
- Ensure capsule create and management slices call regeneration after every mutation.

Acceptance:

- Capsule result, dashboard OPR, outfits, gaps, and shopping list are computed from persisted wardrobe/capsule state.
- Algorithm evidence covers at least one negative scenario and one fully achromatic capsule.

### Slice 09 - Capsule Management Mutations

Suggested spec: `.specify/specs/033-capsule-management-state/`

Goal:

- Persist Capsule Result add/remove/replace actions and recompute outputs.

Tests first:

- `POST /api/capsules/{capsuleId}/items` validates item compatibility and adds membership.
- `DELETE /api/capsules/{capsuleId}/items/{entryId}` removes membership and moves item to `uncapsulated` only if no capsule remains.
- `POST /api/capsules/{capsuleId}/items/{entryId}/replace` validates replacement, swaps membership, and moves replaced item to `uncapsulated`.
- Duplicate add is idempotent or returns a clear conflict.
- Incompatible replacement is rejected with explanation.
- Every mutation calls algorithm regeneration and updates OPR/gaps/outfits.

Implementation:

- Extend `CapsuleRepository` with add/remove/replace and output read methods.
- Add capsule item route handlers.
- Wire Capsule Result local handlers to backend calls.
- Refresh result/dashboard snapshots after mutation.

Acceptance:

- Capsule add/remove/replace survives refresh and updates computed outputs.

### Slice 10 - Wardrobe Lifecycle Details

Suggested spec: `.specify/specs/034-wardrobe-lifecycle-state/`

Goal:

- Finish lifecycle-specific behavior for Uncapsulated, For Sale, and For Repair.

Tests first:

- Add to capsule from Uncapsulated validates compatibility and persists membership.
- Move to For Sale removes capsule membership and excludes item from stats.
- Return from For Sale goes to Uncapsulated, not back into prior capsule.
- Move to For Repair removes membership and excludes item from stats.
- Mark fixed returns item to Uncapsulated and clears repair notes if the product chooses that behavior.
- Repair notes persist if kept in MVP scope.

Implementation:

- Add schema for repair notes and optional sale metadata if required by UI acceptance.
- Reuse item status and capsule membership services from slices 03 and 09.
- Wire lifecycle pages to backend calls.

Acceptance:

- Lifecycle pages are fully stateful and dashboard/navigation counts match persisted state.

### Slice 11 - Semantic Search And Embeddings

Suggested spec: `.specify/specs/035-semantic-search-engine/`

Goal:

- Upgrade basic catalog search from `ILIKE` to the MVP semantic/shared database behavior.

Tests first:

- Embedding jobs are created for public catalog items.
- Search combines pgvector similarity, Postgres text search, and filters.
- Search returns stable rank ordering for seeded fixtures.
- Empty embedding provider config degrades safely in local/stage.
- Private wardrobe photos never enter public semantic search in v0.1.

Implementation:

- Add embedding provider adapter behind a gate.
- Implement worker/job handling for `queue_item_embedding`.
- Replace `search_catalog_hybrid` placeholder with real FTS/vector logic.
- Add observability for embedding failures.

Acceptance:

- Search for natural language queries returns ranked public catalog matches with images and can add them to wardrobe/capsules.

### Slice 12 - Billing, Coins, And Lava Webhooks

Suggested spec: `.specify/specs/036-billing-coins-state/`

Goal:

- Finish Lava payment and coin ledger behavior after core wardrobe/capsule state is stable.

Tests first:

- Coin pack list returns active configured packs.
- Invoice creation requires Lava credentials and persists `lava_invoices`.
- Webhook signature verification rejects invalid payloads.
- Webhook replay is idempotent using `lava_events`.
- Paid webhook credits coins exactly once.
- Coin spends are atomic and idempotent via `spend_coins_atomic`.
- Mobile purchase CTAs remain absent in v0.1.

Implementation:

- Add billing route handlers.
- Add `lava_events` event ingestion and signature verification.
- Ensure profile coin balance is derived or kept consistent with ledger.
- Wire any web purchase UI only when product scope requires it.

Acceptance:

- Coin balance changes only through verified server-side ledger operations.

### Slice 13 - Moderation And Public Imported Items

Suggested spec: `.specify/specs/037-catalog-moderation-state/`

Goal:

- Support US-025 public imported items without exposing private user photos.

Tests first:

- Imported marketplace items default to private or moderation pending.
- Personal photo uploads never become public in v0.1.
- Admin moderation list returns pending items only to authorized admins.
- Approve changes item visibility to public and queues embedding.
- Reject keeps item private/non-searchable.

Implementation:

- Add admin authorization policy.
- Add moderation route handlers.
- Add item visibility transition service.
- Connect approved items to semantic embedding queue.

Acceptance:

- Shared catalog grows only through explicit moderation and never leaks private wardrobe content.

## Recommended Execution Order

1. Slice 00 - unblock/merge PR #45 runtime baseline and add backend tests.
2. Slice 01 - auth/session/profile basics.
3. Slice 02 - profile avatar.
4. Slice 03 - wardrobe CRUD/favorite/status.
5. Slice 04 - clothing photo upload/storage.
6. Slice 05 - catalog search/add.
7. Slice 06 - marketplace import.
8. Slice 07 - minimal capsule creation.
9. Slice 08 - capsule algorithm engine.
10. Slice 09 - capsule management.
11. Slice 10 - wardrobe lifecycle details.
12. Slice 11 - semantic embeddings.
13. Slice 12 - billing/coins.
14. Slice 13 - moderation/public imported items.

The only intentional priority tension is Marketplace vs Capsule Creation. If the product goal is "complete the Journey end-to-end with any items," do Slice 07 before Slice 06 and use uploaded/catalog items first. If the product goal is "three upload methods are fully credible before capsule creation," keep Slice 06 before Slice 07.

## Spec Template For Each Slice

Each new spec should include:

- `## Goal`: one user-visible stateful capability.
- `## Scope`: exact UI screens, route handlers, provider ports, migrations, and external gates.
- `## Non-goals`: especially external provider credentials, Stage 2 OAuth, and design-only profile security actions when out of scope.
- `## Acceptance Criteria`: testable Given/When/Then rows.
- `## Test Plan`: unit, integration, route, RLS/RPC, and one negative scenario before implementation.
- `## Verification`: command/evidence table in `plan.md`.
- `## Process Memory`: dead ends, decisions, known issues in `tasks.md`.

## Immediate Next Spec Candidate

Start with `.specify/specs/024-backend-runtime-test-harness/` unless PR #45 is already merged and green by the time execution starts. If #45 is green and merged, start with `.specify/specs/025-auth-profile-state/`.

Minimum first execution checklist:

- Fresh `git fetch --all --prune`.
- Confirm PR #45 state with `gh pr view 45`.
- Branch from `origin/main` after merge or from the approved PR #45 head.
- Create the slice spec package.
- Write failing tests for that slice.
- Implement only enough backend/UI wiring to pass those tests.
- Update feature memory and PR SENAR checklist before declaring the slice done.
