# ADR-003: Storage

## Status

Accepted (rewritten 2026-06-27 for the production-stack pivot).

## Context

Capsule Zero stores visual assets for:

- user avatars
- original garment photos
- background-removed garment photos (when the Stage 2 self-hosted model ships)
- marketplace-imported product photos
- thumbnails and derived display variants

The storage architecture must support both web uploads and React Native camera/gallery uploads.

Personal photos must never become public in v0.1. Marketplace-imported items may enter the shared item database after moderation. The quality gate requires upload plus optional background removal to complete in under 5 seconds whenever the user opts into background removal — this gate is enforced once the self-hosted Capsule Zero image model ships in Stage 2.

The previous Phase 4 choice (Supabase Storage + Photoroom/remove.bg) is dropped. The replacement must run alongside the production droplet, ship a CDN out of the box, and integrate cleanly with the Go monolith.

## Decision

Use **DigitalOcean Spaces** for object storage. Use a self-hosted **Capsule Zero image model** behind a Go worker for background removal — deferred to Stage 2.

### Buckets

| Bucket / prefix       | Visibility | Purpose                                                                |
| --------------------- | ---------- | ---------------------------------------------------------------------- |
| `avatars`             | private    | User avatar originals and cropped variants                             |
| `item-originals`      | private    | User-uploaded wardrobe photos                                          |
| `item-processed`      | private    | Background-removed and thumbnail variants (Stage 2)                    |
| `marketplace-imports` | private    | Parsed marketplace photos before moderation                            |
| `catalog-public`      | public     | Approved catalog imagery for semantic search results after moderation  |
| `backups`             | private    | `pg_dump` Postgres backups uploaded by a nightly cron                  |

DigitalOcean Spaces offers a single bucket per origin by default. Buckets above are implemented as **path prefixes inside one Capsule Zero bucket** (e.g. `s3://capsulezero/avatars/...`), with policy and signed-URL TTL controlled by the Go storage adapter. This keeps the surface inside one DO billing line and one CDN origin.

### Image processing

Background removal is performed by the self-hosted Capsule Zero model running as a separate Go (or Python-inference) worker container. Until that worker ships:

- v0.1 stores the original photo only;
- `item_assets` records the original variant and the processed variant slot stays empty;
- the wardrobe UI shows the original photo;
- the 5 second processing gate is not asserted until Stage 2.

### Storage rules

- Store every object key with a user or item prefix, for example `<bucket-prefix>/<user_id>/<item_id>/<asset_id>.webp`.
- Store file metadata in Postgres through `item_assets`; storage paths alone are not source of truth.
- Use **signed GET URLs** (TTL ≤ 15 min) for private image reads, served by the Go API.
- Use **public CDN URLs** only for approved shared catalog images copied to the public prefix after moderation.
- Use **signed PUT URLs** (TTL ≤ 5 min) for direct browser/mobile uploads, with size and content-type bounds verified by the Go API before issue.
- Server-side credentials live only in the droplet's encrypted `.env`.
- Enforce upload constraints before storage: JPEG, PNG, WebP; max 10 MB.
- Normalize processed display images to WebP where quality permits.
- CORS on the bucket allows `https://capsulezero.app` and the configured dev origin only.
- Nightly `pg_dump` of Postgres uploads to `backups/` with 14 day retention.

### Upload flow

1. Client requests an upload target from the Go API (`POST /api/uploads/photo/init`).
2. The API validates metadata and returns a signed PUT URL plus an `upload_jobs` row id.
3. The client uploads directly to Spaces.
4. The client calls `POST /api/uploads/photo/complete` with the job id.
5. The API checks the object exists, records `item_assets`, and (when Stage 2 ships) enqueues a background-removal job in Redis.
6. The image worker writes the processed variant to the processed prefix and updates `item_assets`.
7. The item preview shows the processed variant if available; otherwise it falls back to the original and exposes retry.

## Consequences

Positive:

- Storage, metadata, and authorization sit inside one provider (DigitalOcean) we already use for compute.
- Built-in Spaces CDN — no extra wiring for cache.
- Direct browser uploads via signed PUT URLs bypass the API for the byte stream, keeping the Go monolith light.
- Adapter boundary (`internal/storage`) lets us swap to R2/AWS S3 with no business-logic change.
- No paid background-removal vendor in the loop — image quality and unit cost become things we control.

Tradeoffs:

- Spaces upload latency is higher than dedicated CDN edge writes. Acceptable for v0.1.
- We own the image model. Until it ships, background removal is unavailable and the 5 second gate is dormant.
- Backups and lifecycle policies are our responsibility — we ship the cron with the production runtime spec.
- Signed URL leakage handling is on us: short TTLs and audit logs in the Go API.

## References

- DigitalOcean Spaces: https://www.digitalocean.com/products/spaces
- Spaces S3 API compatibility: https://docs.digitalocean.com/products/spaces/reference/s3-compatibility/
- Spaces CDN: https://docs.digitalocean.com/products/spaces/how-to/enable-cdn/
- AWS SDK for Go (used as the Spaces client): https://aws.github.io/aws-sdk-go-v2/docs/
- WebP encoding in Go (`golang.org/x/image/webp`): https://pkg.go.dev/golang.org/x/image/webp
