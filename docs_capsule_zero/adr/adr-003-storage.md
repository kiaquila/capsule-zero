# ADR-003: Storage

## Status

Accepted (rewritten 2026-06-27 for the production-stack pivot; revised 2026-07-10 to supersede DigitalOcean Spaces with Hetzner Object Storage).

## Context

Capsule Zero stores visual assets for:

- user avatars
- original garment photos
- background-removed garment photos (when the Stage 2 self-hosted model ships)
- marketplace-imported product photos
- thumbnails and derived display variants

The storage architecture must support both web uploads and React Native camera/gallery uploads.

Personal photos must never become public in v0.1. Marketplace-imported items may enter the shared item database after moderation. The quality gate requires upload plus optional background removal to complete in under 5 seconds whenever the user opts into background removal — this gate is enforced once the self-hosted Capsule Zero image model ships in Stage 2.

The previous Phase 4 choice (Supabase Storage + Photoroom/remove.bg) is dropped. The storage replacement must stay compatible with direct web and mobile uploads, integrate cleanly with the Go monolith, and keep production infrastructure inside Hetzner after the 2026-07-02 hosting migration. A CDN is no longer assumed in v0.1; Cloudflare/CDN activation is Stage 2.

## Decision

Use **Hetzner Object Storage** for object storage. Use a self-hosted **Capsule Zero image model** behind a Go worker for background removal — deferred to Stage 2.

### Buckets

| Bucket                         | Region posture                                                | Visibility | Purpose                                                                 |
| ------------------------------ | ------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------- |
| `capsulezero-prod-private-assets` | HEL while the Hetzner high-traffic advisory recommends HEL; otherwise re-benchmark HEL vs NBG before provisioning | private    | User avatars, original wardrobe photos, processed variants, marketplace imports |
| `capsulezero-prod-public-catalog` | Same primary region as private assets                         | public     | Approved catalog imagery for semantic search results after moderation   |
| `capsulezero-prod-backups`       | FSN, separate Hetzner project/key from application assets      | private    | Client-side encrypted `pg_dump` backups with Object Lock/lifecycle retention |

Logical asset classes live as prefixes inside the private asset bucket:
`avatars/`, `item-originals/`, `item-processed/`, and
`marketplace-imports/`. Multiple Hetzner buckets share the account-level object
storage base quota, so separate buckets/projects are used for policy isolation
rather than because of base-cost pressure.

The app does not create buckets at runtime. Operators create buckets,
credentials, CORS, lifecycle, and Object Lock through Hetzner Console plus
S3-compatible tooling before enabling the storage slice.

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
- Use **public object URLs** only for approved shared catalog images copied to the public catalog bucket after moderation. A CDN/front-door is Stage 2.
- Use **signed PUT URLs** (TTL ≤ 5 min) for direct browser/mobile uploads, with size and content-type bounds verified by the Go API before issue.
- Server-side credentials live only in the droplet's encrypted `.env`.
- Enforce upload constraints before storage: JPEG, PNG, WebP; max 10 MB.
- Normalize processed display images to WebP where quality permits.
- CORS on production asset buckets allows `https://capsulezero.app` only; local origins belong to separate dev/test buckets.
- Nightly `pg_dump` of Postgres uploads to the backup bucket with client-side encryption, Object Lock enabled at bucket creation if retention locking is used, and at least 14 day retention.
- Hetzner Object Storage has no default data-at-rest encryption. Backups must be encrypted before upload. Direct signed PUT/GET for personal photos is accepted only with an explicit privacy/security decision; otherwise the storage slice must use an SSE-C/API-proxy design.
- Do not rely on object notifications; the client must call `/api/uploads/photo/complete`, and that endpoint must be idempotent.
- Do not design critical flows around `CopyObject`; Hetzner documents that it may fail even when buckets are in the same location.
- Browser uploads, API `HeadObject`, signed reads, and cleanup jobs must retry transient 5xx/timeouts with exponential backoff while reusing the same random object key.

### Upload flow

1. Client requests an upload target from the Go API (`POST /api/uploads/photo/init`).
2. The API validates metadata and returns a signed PUT URL plus an `upload_jobs` row id.
3. The client uploads directly to Hetzner Object Storage.
4. The client calls `POST /api/uploads/photo/complete` with the job id.
5. The API checks the object exists, records `item_assets`, and (when Stage 2 ships) enqueues a background-removal job in Redis.
6. The image worker writes the processed variant to the processed prefix and updates `item_assets`.
7. The item preview shows the processed variant if available; otherwise it falls back to the original and exposes retry.

## Consequences

Positive:

- Storage stays in the same provider family as the production server after the Hetzner migration.
- S3-compatible tooling and the AWS SDK for Go v2 still fit the planned `internal/storage` adapter.
- Direct browser uploads via signed PUT URLs bypass the API for the byte stream, keeping the Go monolith light.
- Adapter boundary (`internal/storage`) lets us swap to R2/AWS S3 with no business-logic change.
- No paid background-removal vendor in the loop — image quality and unit cost become things we control.

Tradeoffs:

- Hetzner Object Storage currently has a high-traffic advisory; production provisioning must re-check status and prefer HEL while the advisory remains active.
- There is no built-in CDN. Public catalog delivery uses native object URLs in v0.1; CDN/front-door work is Stage 2.
- There is no default data-at-rest encryption. Backups are encrypted client-side; personal-image storage needs an explicit acceptance or SSE-C/API-proxy follow-up.
- Hetzner does not provide built-in cross-location bucket replication; cross-region asset replication is a later resilience task after deletion/privacy semantics are defined.
- We own the image model. Until it ships, background removal is unavailable and the 5 second gate is dormant.
- Backups and lifecycle policies are our responsibility — we ship the cron with the production runtime spec.
- Signed URL leakage handling is on us: short TTLs and audit logs in the Go API.

## References

- Hetzner Object Storage overview: https://docs.hetzner.com/storage/object-storage/overview/
- Hetzner Object Storage general FAQ: https://docs.hetzner.com/storage/object-storage/faq/general/
- Hetzner Object Storage CORS: https://docs.hetzner.com/storage/object-storage/howto-protect-objects/cors/
- Hetzner Object Storage S3 credentials and key scoping: https://docs.hetzner.com/storage/object-storage/faq/s3-credentials/
- Hetzner Object Storage supported actions: https://docs.hetzner.com/storage/object-storage/supported-actions/
- Hetzner Object Lock retention: https://docs.hetzner.com/storage/object-storage/howto-protect-objects/protect-object-lock-retention/
- Hetzner Object Storage status advisory: https://status.hetzner.com/incident/ebd62173-d902-4e75-939a-265c0b3f1ddb
- AWS SDK for Go v2 (used as the S3-compatible client): https://aws.github.io/aws-sdk-go-v2/docs/
- WebP encoding in Go (`golang.org/x/image/webp`): https://pkg.go.dev/golang.org/x/image/webp
