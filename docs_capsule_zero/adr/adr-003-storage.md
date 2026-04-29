# ADR-003: Storage

## Status

Accepted.

## Context

Capsule Zero stores visual assets for:

- user avatars
- original garment photos
- background-removed garment photos
- marketplace-imported product photos
- thumbnails and derived display variants

The storage architecture must support both web uploads and native mobile camera/gallery uploads.

Personal photos must never become public in v0.1. Marketplace-imported items may enter the shared item database after moderation. The MVP quality gate requires upload plus optional background removal to complete in under 5 seconds whenever the user opts into background removal.

## Decision

Use Supabase Storage for MVP file storage.

Use private buckets for user-owned and moderation-sensitive files:

| Bucket | Visibility | Purpose |
|---|---|---|
| `avatars` | private | User avatar originals and cropped variants |
| `item-originals` | private | User-uploaded wardrobe photos |
| `item-processed` | private | Background-removed and thumbnail variants |
| `marketplace-imports` | private | Parsed marketplace photos before moderation |
| `catalog-public` | public or signed-read | Approved catalog imagery for semantic search results |

Use Photoroom API as the primary background removal provider through a server-side adapter. Keep remove.bg as a fallback adapter if Photoroom does not meet the MVP latency/quality target on real wardrobe images.

## Storage Rules

- Store every object path with a user or item prefix, for example `user_id/item_id/asset_id.webp`.
- Store file metadata in Postgres through `item_assets`.
- Do not rely on storage paths alone as source of truth.
- Use signed URLs for private image reads.
- Use public URLs only for approved shared catalog images.
- Keep service-role storage operations server-side only.
- Enforce upload constraints before storage: JPEG, PNG, WebP; max 10 MB.
- Normalize processed display images to WebP where quality permits.

## Background Removal Flow

1. User uploads an original photo to `item-originals`.
2. The app creates an `upload_jobs` row.
3. If background removal is off, the original asset becomes the selected display image.
4. If background removal is on, a server-side job sends the image to the background removal adapter.
5. The processed image is written to `item-processed`.
6. `item_assets` records both original and processed variants.
7. The item preview shows the processed variant if available; otherwise it falls back to original and exposes retry.

## Consequences

Positive:

- Storage, metadata, RLS, and user ownership are managed in one backend.
- Private photos remain private by default.
- The adapter boundary keeps the app independent from one image vendor.
- Public catalog imagery can be separated from personal uploads.

Tradeoffs:

- Supabase Storage policies must be designed carefully, especially for per-user folders and mobile direct uploads.
- External background removal adds latency, cost, and provider availability risk.
- The 5 second quality gate must be measured with real images before launch.

## References

- Supabase Storage overview: https://supabase.com/docs/guides/storage
- Supabase Storage access control: https://supabase.com/docs/guides/storage/security/access-control
- Supabase standard uploads: https://supabase.com/docs/guides/storage/uploads/standard-uploads
- Photoroom background removal API: https://www.photoroom.com/api/remove-background
- remove.bg API: https://www.remove.bg/api
