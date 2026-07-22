# API Spec

## Status

Accepted implementation contract for v0.1. The authoritative machine-readable
surface is `docs_capsule_zero/adr/openapi.yaml`; every feature slice updates it,
the generated client, and contract checks together.

> **Monetization freeze (2026-07-16):** `PRODUCT-PLAN.md` D2 supersedes the previous coin/Lava
> contract. The authoritative OpenAPI and generated client intentionally expose no coin balance,
> billing, purchase, payment-status, or payment-webhook surface. Retained provider/runtime types are
> unsupported legacy: do not implement, call, provision, test as a release gate, or restore them to
> code generation until Stage 4 chooses and specifies a new model.

## API Principles

- Ory Kratos owns identity and session state. nginx runs an `auth_request` subrequest against Kratos in front of protected routes; the Go API re-validates the Kratos session on every authenticated request.
- The Go modular monolith exposes the REST API at `/api/*`; the Next.js web app and React Native mobile app both consume the same OpenAPI contract through generated clients.
- Next.js Server Actions may wrap calls to the Go API for in-app mutations; they never embed admin credentials.
- The Go monolith owns database-heavy operations: compatibility validation, outfit regeneration, OPR, gap analysis, and catalog search. Catalog search is Postgres FTS-first in v0.1; hybrid FTS + pgvector ranking ships later with the semantic-search slice per ADR-007.
- Go handlers validate request payloads explicitly against the OpenAPI contract; the current `net/http` router is manual and `scripts/check-api-contract.mjs` provides route/operation drift detection. Web forms mirror relevant constraints with Zod where useful for inline validation.
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
  "opr": 4.0,
  "layeringCoverage": {
    "score": 75,
    "baseLookCount": 64,
    "midCoveredLookCount": 48,
    "outerCoveredLookCount": 48
  }
}
```

## Error Contract

Every REST operation returns the common `ErrorResponse` shape for failures. The OpenAPI contract is authoritative for operation-specific status codes, but the v0.1 taxonomy is:

| HTTP | `ErrorResponse.error.code`   | Meaning                                                                                                    |
| ---: | ---------------------------- | ---------------------------------------------------------------------------------------------------------- |
|  400 | `VALIDATION_ERROR`           | Request syntax, shape, enum, file metadata, or query validation failed                                     |
|  400 | `INVALID_CODE`               | Recovery/verification one-time code is wrong, expired, or already used (spec 035)                          |
|  400 | `INVALID_CURRENT_PASSWORD`   | Password change rejected because the presented current password is wrong (spec 035)                        |
|  401 | `UNAUTHENTICATED`            | Kratos session is missing, expired, or invalid                                                             |
|  403 | `FORBIDDEN`                  | Authenticated user cannot access the requested resource                                                     |
|  404 | `NOT_FOUND`                  | Resource does not exist or is intentionally hidden by ownership rules                                      |
|  409 | `IDEMPOTENCY_CONFLICT`       | Idempotency key, invoice, webhook replay, or optimistic version conflict                                   |
|  409 | `UPLOAD_INCOMPLETE`          | Upload completion ran before the initialized object exists                                                  |
|  409 | `UPLOAD_MISMATCH`            | Stored object size or content type does not match the initialized metadata                                  |
|  422 | `SEMANTIC_VALIDATION_FAILED` | Capsule methodology, palette compatibility, basicity, target correlation, or status-transition rule failed |
|  429 | `RATE_LIMITED`               | Per-client request budget is exhausted; the response includes `Retry-After`                                 |
|  500 | `INTERNAL_ERROR`             | Unexpected application/database failure                                                                     |
|  502 | `INTERNAL_ERROR`             | Upstream identity service is temporarily unavailable during authenticated session resolution                |
|  503 | `FEATURE_UNAVAILABLE`        | Photo uploads are disabled until the operator explicitly enables the rollout                               |
|  503 | `STORAGE_UNAVAILABLE`        | Object Storage is unreachable or signing/readiness failed; no upload target or partial completion is returned |

Server logs may include safe provider error classifications, but must never include credentials, presigned URLs, or secret-bearing raw payloads. Client responses keep messages safe for end users; the only provider target returned by this slice is the explicit short-lived presigned URL capability.

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
| `/api/auth/providers`    |    GET | Public | Which social sign-in providers this deployment offers (spec 037)      |
| `/api/auth/google/start` |   POST | Public | Begin the native Google OIDC flow; consent URL + exchange code        |
| `/api/auth/google/complete` | POST | Public | Exchange the Google callback codes for an authenticated session      |
| `/auth/callback`         |    GET | Public | Stage 2 web OAuth callback; exchanges code and redirects to dashboard |
| `/auth/mobile-callback`  |    GET | Public | Stage 2 mobile OAuth callback; redirects into React Native deep link  |
| `/api/profile`           |    GET | User   | Read current profile                                                  |
| `/api/profile`           |  PATCH | User   | Update display name, locale, country, city, or avatar URL             |
| `/api/profile/avatar`    |   POST | User   | Upload or replace avatar metadata after storage upload                |
| `/api/profile/avatar`    | DELETE | User   | Remove custom avatar                                                  |

## Journey

`Category.layer` is the coarse UI section only. Every API category also carries the machine-readable
`algorithmRole` and nullable `accessorySlot` from the canonical category → role/slot mapping in
`docs_capsule_zero/project/methodology/categories.md`; OPR, Layering Coverage, and recommendation code
MUST consume those fields and must not derive a role from the localized display `name` or treat `tops`
as synonymous with Core. Built-in seed rows persist the mapping, so a UUID resolves without a hidden
name-based lookup. Custom-category validation returns a nullable role/slot pair (`null` when rejected)
before that category can participate in either metric.

| Route                                   | Method | Auth | Purpose                                               |
| --------------------------------------- | -----: | ---- | ----------------------------------------------------- |
| `/api/journey/categories`               |    GET | User | List categories filtered by wardrobe type             |
| `/api/journey/custom-category/validate` |   POST | User | Validate custom category basicity                     |
| `/api/palette/validate`                 |   POST | User | Validate selected color IDs and return blocked colors |
| `/api/capsules`                         |   POST | User | Create capsule from journey selections                |

## Capsules

`Capsule.layeringCoverage` is separate from `opr` and carries the score plus base/mid/outer diagnostics;
`score=null` is the `B=0` / N/A state. Gap and shopping-list `impact` values are role-specific and carry
an explicit `impactUnit`: Core rows report `core_base_looks`, while Layering rows report
`layering_coverage_percentage_points`. Consumers MUST NOT compare or sum the two scales as if they were
both outfit counts. The fixed cross-role priority is defined in `outfit-generation.md` §4.

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
| `/api/uploads/photo/init`                |   POST | User | Validate original-photo metadata and return a presigned PUT contract      |
| `/api/uploads/photo/complete`            |   POST | User | Verify the stored object and idempotently complete one original asset     |
| `/api/uploads/:jobId/background-removal` |   POST | User | Start or retry background removal                                        |
| `/api/uploads/:jobId`                    |    GET | User | Read processing status                                                   |

Spec 040 implements only unattached original wardrobe-photo assets. Init
accepts a basename plus `image/jpeg`, `image/png`, or `image/webp` metadata and
`sizeBytes` from 1 through 10 MiB. The server creates the private object key;
clients cannot choose a path. Its response contains `jobId`, `assetId`, a PUT
`uploadUrl`, the exact `uploadHeaders` to send, and `expiresAt`. The presigned
URL is sensitive and may reveal provider routing details, the bucket name, and
the server-generated object key, so clients and operators must never log it.

Complete is authenticated and owner-bound. It reads the initialized job,
checks the object by `HeadObject`, requires the stored size and content type to
match, then returns the same completed job/asset identity on retries. A missing
object returns `409 UPLOAD_INCOMPLETE`; a size/type mismatch returns
`409 UPLOAD_MISMATCH`; storage unavailability returns
`503 STORAGE_UNAVAILABLE`; another user's identifiers resolve as not found.
The default-off route gate runs before session resolution, so both endpoints
return `503 FEATURE_UNAVAILABLE` without calling Kratos or Postgres while
`OBJECT_STORAGE_UPLOADS_ENABLED` is false. When enabled, they return
`401 UNAUTHENTICATED` without a valid session, `429 RATE_LIMITED` after the
shared session budget is exhausted, and `502 INTERNAL_ERROR` when Kratos is
temporarily unavailable. Init has no conflict response. Database failures
remain 500.
Attaching the resulting asset
to a wardrobe item, frontend wiring, byte decoding/scanning, processing, and
orphan cleanup are later slices.

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

## Admin/Internal

| Route                                 | Method | Auth   | Purpose                                    |
| ------------------------------------- | -----: | ------ | ------------------------------------------ |
| `/api/admin/moderation/items`         |    GET | Admin  | List marketplace items awaiting moderation |
| `/api/admin/moderation/items/:itemId` |  PATCH | Admin  | Approve/reject catalog visibility          |
| `/api/health`                         |    GET | Public | Build identity plus Postgres, Kratos, and private-storage readiness |
| `/livez`                              |    GET | Public | Dependency-free container liveness (server operations only) |

## Domain RPC Functions

| Function                                                   | Purpose                                                   |
| ---------------------------------------------------------- | --------------------------------------------------------- |
| `validate_palette(color_ids text[])`                       | Enforce compatibility matrix and blocked color messaging  |
| `validate_item_for_capsule(item_id uuid, capsule_id uuid)` | Block incompatible item additions                         |
| `regenerate_capsule_outputs(capsule_id uuid)`              | Recompute outfits, OPR, gaps, and shopping list           |
| `search_catalog_fts(query text, filters jsonb)`            | Rank public catalog items with full-text search/filtering |

Deferred semantic-search work adds `search_catalog_hybrid(...)` and `queue_item_embedding(...)` when pgvector, embedding dimensions, and vector indexes are promoted by ADR-007.
