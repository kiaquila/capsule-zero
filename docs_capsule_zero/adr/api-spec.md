# API Spec

## Status

Accepted for v0.1 planning. Before Stage 1 feature implementation, Sprint 0 must finalize the implementation OpenAPI contract at `docs_capsule_zero/adr/openapi.yaml`. Every feature slice must preserve the resource boundaries and auth rules below.

## API Principles

- Ory Kratos owns identity and session state. nginx runs an `auth_request` subrequest against Kratos in front of protected routes; the Go API re-validates the Kratos session on every authenticated request.
- The Go modular monolith exposes the REST API at `/api/*`; the Next.js web app and React Native mobile app both consume the same OpenAPI contract through generated clients.
- Next.js Server Actions may wrap calls to the Go API for in-app mutations; they never embed admin credentials.
- The Go monolith owns database-heavy operations: compatibility validation, outfit regeneration, OPR, gap analysis, and catalog search. Catalog search is Postgres FTS-first in v0.1; hybrid FTS + pgvector ranking ships later with the semantic-search slice per ADR-007.
- All request payloads are validated against the OpenAPI schema in Go (via a typed router such as `oapi-codegen`) and mirrored on the web with Zod where useful for inline form validation.
- All mutating routes require an authenticated user unless explicitly marked as webhook.
- Authorization is enforced in Go on every request — there is no Postgres RLS.

## Implementation Contract Artifacts

Sprint 0 must create and verify these artifacts before Stage 1 product feature work:

| Artifact                | Location                                                                                             | Purpose                                                                |
| ----------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| OpenAPI contract        | `docs_capsule_zero/adr/openapi.yaml`                                                                 | Authoritative REST path, auth, request, response, and error schemas    |
| TypeScript client/types | `app/src/lib/api/generated/`                                                                         | Web client/server API types generated from OpenAPI                     |
| React Native client     | deferred until the React Native scaffold defines `mobile/lib/api/generated/` or its replacement path | TypeScript client for the React Native app generated from OpenAPI      |
| Go schema/handlers      | `api/internal/httpapi/` + `api/migrations/`                                                          | Typed Go handlers from OpenAPI and embedded SQL migration files            |
| Contract tests          | `api/tests/contract/` or equivalent CI target                                                        | Auth/error conventions and representative endpoint schema verification |

Endpoint names may change only with the OpenAPI contract, generated clients, and contract tests updated in the same PR.

The generator writes the canonical web client to `app/src/lib/api/generated/openapi.ts`. Do not regenerate a `/web` client target. The stale Flutter scaffold and mobile generated outputs were removed on 2026-07-01; mobile TypeScript generation is intentionally deferred until the React Native scaffold lands and defines its source layout in the same PR.

OpenAPI operations marked `x-client-availability: web` must not be wired into mobile purchase UI. Mobile generation may include low-level types for status reads, but mobile v0.1 must not expose invoice creation as a user action.

## Common Schemas

### Error

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  }
}
```

### Color Dot

```json
{
  "id": "A1",
  "name": "Black",
  "hex": "#1C1C1C",
  "group": "achromatic"
}
```

### Item

```json
{
  "id": "uuid",
  "name": "White cotton shirt",
  "categoryId": "uuid",
  "colorIds": ["A3"],
  "brand": "string|null",
  "material": "string|null",
  "price": 120,
  "sourceType": "photo_upload|marketplace|catalog",
  "visibility": "private|moderation_pending|public",
  "imageUrl": "signed-or-public-url",
  "fromCatalog": false
}
```

### Capsule

```json
{
  "id": "uuid",
  "name": "Core capsule",
  "wardrobeType": "women|men|mixed",
  "paletteColorIds": ["A1", "A3", "D9"],
  "paletteLocked": true,
  "itemCount": 28,
  "outfitCount": 112,
  "opr": 4.0
}
```

### Coin Spend

Clients request paid app actions through a server endpoint instead of writing to the ledger directly:

```json
{
  "reason": "extra_capsule|photo_enhancement",
  "targetId": "uuid|null",
  "idempotencyKey": "client-generated-string"
}
```

The server derives the coin amount from the reason, verifies the user's balance, validates the target resource, applies idempotency, and writes the negative `coin_ledger` row.

`targetId` is reason-specific and must be enforced by the server:

- `reason=extra_capsule` requires the capsule UUID receiving the paid expansion.
- `reason=photo_enhancement` requires the item UUID or upload job UUID being enhanced.
- `targetId=null` is invalid for both v0.1 spend reasons unless a future server-owned reason explicitly documents that null target.

## Error Contract

Every REST operation returns the common `ErrorResponse` shape for failures. The OpenAPI contract is authoritative for operation-specific status codes, but the v0.1 taxonomy is:

| HTTP | `ErrorResponse.error.code`   | Meaning                                                                                                    |
| ---: | ---------------------------- | ---------------------------------------------------------------------------------------------------------- |
|  400 | `VALIDATION_ERROR`           | Request syntax, shape, enum, file metadata, or query validation failed                                     |
|  400 | `INVALID_CODE`               | Recovery/verification one-time code is wrong, expired, or already used (spec 035)                          |
|  400 | `INVALID_CURRENT_PASSWORD`   | Password change rejected because the presented current password is wrong (spec 035)                        |
|  401 | `UNAUTHENTICATED`            | Kratos session is missing, expired, or invalid                                                             |
|  402 | `INSUFFICIENT_BALANCE`       | Coin balance is too low for a paid action                                                                  |
|  403 | `FORBIDDEN`                  | User is authenticated but cannot access the resource or webhook key is invalid                             |
|  404 | `NOT_FOUND`                  | Resource does not exist or is intentionally hidden by ownership rules                                      |
|  409 | `IDEMPOTENCY_CONFLICT`       | Idempotency key, invoice, webhook replay, or optimistic version conflict                                   |
|  422 | `SEMANTIC_VALIDATION_FAILED` | Capsule methodology, palette compatibility, basicity, target correlation, or status-transition rule failed |

Server logs may include provider/raw details, but client responses must keep messages safe for end users and never expose service-role credentials, Lava.top secrets, or private storage paths.

## Auth

The Go API wraps Ory Kratos API self-service flows for sign-up, login, session
resolution, logout, code-method password recovery, code-method email
verification, and password change (spec 035). Recovery and verification codes
are bound to their Kratos flow, so the start endpoints return a `flowId` the
completion endpoints must reference. OAuth callbacks are kept in the contract
as Stage 2 boundaries for Google OAuth and Apple Sign-In.

| Route                    | Method | Auth   | Purpose                                                               |
| ------------------------ | -----: | ------ | --------------------------------------------------------------------- |
| `/api/auth/registration` |   POST | Public | Create a password account and return a session or email-confirm state |
| `/api/auth/login`        |   POST | Public | Establish a password session                                          |
| `/api/auth/whoami`       |    GET | Public | Resolve the presented session token, or return an empty auth response |
| `/api/auth/recovery`     |   POST | Public | Start code-method recovery; returns the flow the code is bound to     |
| `/api/auth/recovery/complete` | POST | Public | Exchange the emailed code, or a recovery continuation retry, for a new password and a session |
| `/api/auth/verification` |   POST | Public | Start or resend a code-method email verification                      |
| `/api/auth/verification/complete` | POST | Public | Confirm the address with the emailed code                    |
| `/api/auth/password`     |   POST | User   | Change the password (current password required; re-auths internally)  |
| `/api/auth/logout`       |   POST | Public | Revoke the presented session token; idempotent when absent            |
| `/auth/callback`         |    GET | Public | Stage 2 web OAuth callback; exchanges code and redirects to dashboard |
| `/auth/mobile-callback`  |    GET | Public | Stage 2 mobile OAuth callback; redirects into React Native deep link  |
| `/api/profile`           |    GET | User   | Read current profile                                                  |
| `/api/profile`           |  PATCH | User   | Update display name, locale, country, city, or avatar URL             |
| `/api/profile/avatar`    |   POST | User   | Upload or replace avatar metadata after storage upload                |
| `/api/profile/avatar`    | DELETE | User   | Remove custom avatar                                                  |

## Journey

| Route                                   | Method | Auth | Purpose                                               |
| --------------------------------------- | -----: | ---- | ----------------------------------------------------- |
| `/api/journey/categories`               |    GET | User | List categories filtered by wardrobe type             |
| `/api/journey/custom-category/validate` |   POST | User | Validate custom category basicity                     |
| `/api/palette/validate`                 |   POST | User | Validate selected color IDs and return blocked colors |
| `/api/capsules`                         |   POST | User | Create capsule from journey selections                |

## Capsules

| Route                                             | Method | Auth | Purpose                                                 |
| ------------------------------------------------- | -----: | ---- | ------------------------------------------------------- |
| `/api/capsules/current`                           |    GET | User | Read active capsule for dashboard                       |
| `/api/capsules/:capsuleId`                        |    GET | User | Read capsule detail                                     |
| `/api/capsules/:capsuleId`                        |  PATCH | User | Rename capsule or update non-palette metadata           |
| `/api/capsules/:capsuleId/items`                  |   POST | User | Add wardrobe entry to capsule after compatibility check |
| `/api/capsules/:capsuleId/items/:entryId`         | DELETE | User | Remove item from capsule and recompute                  |
| `/api/capsules/:capsuleId/items/:entryId/replace` |   POST | User | Replace item and recompute                              |
| `/api/capsules/:capsuleId/outfits`                |    GET | User | Read generated outfits                                  |
| `/api/capsules/:capsuleId/gaps`                   |    GET | User | Read gap analysis                                       |
| `/api/capsules/:capsuleId/shopping-list`          |    GET | User | Read shopping list                                      |

## Wardrobe Items

| Route                         | Method | Auth | Purpose                                                          |
| ----------------------------- | -----: | ---- | ---------------------------------------------------------------- |
| `/api/items`                  |    GET | User | List user's wardrobe entries with filters                        |
| `/api/items`                  |   POST | User | Create item metadata from confirmed upload/import/catalog result |
| `/api/items/:itemId`          |    GET | User | Read item detail                                                 |
| `/api/items/:itemId`          |  PATCH | User | Edit name, category, colors, brand, material, price              |
| `/api/items/:itemId`          | DELETE | User | Delete private item or remove user's wardrobe entry              |
| `/api/items/:itemId/favorite` |   POST | User | Toggle favorite                                                  |
| `/api/items/:itemId/status`   |  PATCH | User | Move to active, uncapsulated, for sale, or for repair            |

## Uploads

| Route                                    | Method | Auth | Purpose                                                                  |
| ---------------------------------------- | -----: | ---- | ------------------------------------------------------------------------ |
| `/api/uploads/photo/init`                |   POST | User | Validate metadata and return storage target/signed upload data if needed |
| `/api/uploads/photo/complete`            |   POST | User | Create item asset metadata after upload                                  |
| `/api/uploads/:jobId/background-removal` |   POST | User | Start or retry background removal                                        |
| `/api/uploads/:jobId`                    |    GET | User | Read processing status                                                   |

## Marketplace Imports

| Route                            | Method | Auth | Purpose                                                    |
| -------------------------------- | -----: | ---- | ---------------------------------------------------------- |
| `/api/imports/marketplace`       |   POST | User | Submit one or more product URLs                            |
| `/api/imports/:importId`         |    GET | User | Read parse status and parsed candidate data                |
| `/api/imports/:importId/confirm` |   POST | User | Confirm selected photo and editable tags, then create item |

## Catalog Search

| Route                            | Method | Auth | Purpose                                            |
| -------------------------------- | -----: | ---- | -------------------------------------------------- |
| `/api/catalog/search`            |    GET | User | FTS-first search over public catalog items         |
| `/api/catalog/items/:itemId`     |    GET | User | Read public catalog item                           |
| `/api/catalog/items/:itemId/add` |   POST | User | Add public catalog item to user's wardrobe/capsule |

## Billing

| Route                                 | Method | Auth                     | Purpose                                                                                        |
| ------------------------------------- | -----: | ------------------------ | ---------------------------------------------------------------------------------------------- |
| `/api/billing/lava/invoice`           |   POST | User, web only for v0.1  | Create Lava.top invoice/payment link for a coin pack                                           |
| `/api/billing/lava/status/:invoiceId` |    GET | User                     | Check a Lava.top invoice/payment status                                                        |
| `/api/billing/coins/spend`            |   POST | User                     | Spend coins for `extra_capsule` or `photo_enhancement` through a server-validated ledger write |
| `/api/webhooks/lava`                  |   POST | `X-Api-Key` webhook auth | Fulfill `payment.success` events into `coin_ledger` and record failures                        |

Mobile apps must not expose a Lava.top purchase CTA, external payment link, or in-app purchase prompt in v0.1. Mobile may read coin balance and invoice/payment status that originated from web purchases after webhook-backed fulfillment.

## Admin/Internal

| Route                                 | Method | Auth   | Purpose                                    |
| ------------------------------------- | -----: | ------ | ------------------------------------------ |
| `/api/admin/moderation/items`         |    GET | Admin  | List marketplace items awaiting moderation |
| `/api/admin/moderation/items/:itemId` |  PATCH | Admin  | Approve/reject catalog visibility          |
| `/api/health`                         |    GET | Public | Deployment health + build identity: `ok`, `commit`, `builtAt` (link-time `-ldflags`, `"unknown"` when un-injected), `postgres`, `kratos`; degraded dependency → 503 with the same body (spec 036) |

## Domain RPC Functions

| Function                                                   | Purpose                                                   |
| ---------------------------------------------------------- | --------------------------------------------------------- |
| `validate_palette(color_ids text[])`                       | Enforce compatibility matrix and blocked color messaging  |
| `validate_item_for_capsule(item_id uuid, capsule_id uuid)` | Block incompatible item additions                         |
| `regenerate_capsule_outputs(capsule_id uuid)`              | Recompute outfits, OPR, gaps, and shopping list           |
| `search_catalog_fts(query text, filters jsonb)`            | Rank public catalog items with full-text search/filtering |

Deferred semantic-search work adds `search_catalog_hybrid(...)` and `queue_item_embedding(...)` when pgvector, embedding dimensions, and vector indexes are promoted by ADR-007.
