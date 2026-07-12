# ADR-003: Storage

## Status

Accepted (rewritten 2026-06-27 for the production-stack pivot; revised
2026-07-10 to supersede DigitalOcean Spaces with Hetzner Object Storage;
least-privilege credential topology hardened 2026-07-11).

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

### Provisioned production topology (2026-07-11)

- `capsulezero-prod-private-assets` and
  `capsulezero-prod-public-catalog` exist in **HEL** under Hetzner project
  `15203114`.
- The application runtime credential belongs to dedicated key-only project
  `15302873`, which has no buckets. Its cross-project private-assets policy
  allows `s3:ListBucket` on the bucket plus `s3:PutObject`, `s3:GetObject`, and
  `s3:DeleteObject` only on `item-originals/*` and `smoke/spec-040/*`. The
  public-catalog policy keeps anonymous `s3:GetObject` and explicitly denies
  this runtime principal `s3:*`.
- `capsulezero-prod-backups` exists in **FSN** under isolated Hetzner project
  `15296835`, with Object Lock enabled at bucket creation. Its writer
  credential belongs to dedicated key-only project `15302925`, which also has
  no buckets. Its cross-project policy is deliberately hybrid: normal
  `s3:PutObject` under `postgres/*` is allowed, while explicit denies were
  live-proven for object/version reads, ACL get/put, retention and legal-hold
  get/put, object/version deletes, governance bypass, bucket/version/multipart
  listing, and policy/CORS/Object-Lock-configuration reads. Header conditions
  also deny dangerous canned ACLs and AllUsers grant-read on `PutObject`.
  Backup CORS is absent.

  Hetzner/RGW still accepts `PutObject` requests carrying Object Lock mode,
  retain-until, or legal-hold headers despite the explicit retention/legal-hold
  action denies. This does not grant the writer read or delete access to
  existing data, but it permits creation of newly locked objects and therefore
  leaves a bounded write-time storage-DoS/cost-amplification residual. Backup
  automation must sanitize and forbid these headers and obtain explicit risk
  acceptance or a provider fix before activation. The bucket must remain free
  of plaintext database data; its creation does not complete backup encryption,
  scheduling, retention, or restore verification.

The data-plane credentials are stored only in the protected production env
file; neither key-only project owns a bucket, so the credentials do not gain
default access to future buckets in the bucket-owning projects. Bucket-policy
administration remains separate from runtime data-plane access. On 2026-07-11
policy readback, the runtime matrix, the backup hybrid-policy audit with the
Object Lock header exception above, both key-only projects' bucketless state,
and an atomic env rotation passed. The env remained
`root:root` mode `600`, and `OBJECT_STORAGE_UPLOADS_ENABLED=false` remained
unchanged. The superseded same-project runtime and backup keys plus both
temporary policy-operator keys were then deleted in the Hetzner Console;
only the new cross-project data-plane keys remain.

Production CORS is intentionally narrow. The private bucket allows only the
`https://capsulezero.app` origin for signed `PUT`, `GET`, and `HEAD` requests,
only the signed `Content-Type` request header, exposes `ETag`, and uses a short
preflight cache. The public-catalog bucket allows the same exact origin for
read methods only. No wildcard, localhost, preview, or attacker origin belongs
in either production policy. Post-hardening live probes passed on 2026-07-11:
private exact-origin PUT preflight with `Content-Type` returned `200` with the
exact allow-origin/method/header values and max-age `300`, while the attacker
origin returned `403` without `Access-Control-Allow-Origin`; public exact-origin
GET preflight without request headers returned `200` with the exact
allow-origin, GET method, and max-age `300`, while the attacker origin returned
`403` without an allow-origin header;
backup preflight returned `403` without an allow-origin header. After old-key
revocation, the standalone Go smoke passed readiness, signed PUT of exactly
10 MiB (`10485760` bytes), `HeadObject`, signed GET with matching checksum, and
cleanup. A Console screenshot alone is not sufficient.

### Image processing

Background removal is performed by the self-hosted Capsule Zero model running as a separate Go (or Python-inference) worker container. Until that worker ships:

- v0.1 stores the original photo only;
- `item_assets` records only the `original` variant; no processed-variant row
  or slot exists in the spec-040 schema;
- the wardrobe UI shows the original photo;
- the 5 second processing gate is not asserted until Stage 2.

### Storage rules

- Store every object key with a user or item prefix, for example `<bucket-prefix>/<user_id>/<item_id>/<asset_id>.webp`.
- Store file metadata in Postgres through `item_assets`; storage paths alone are not source of truth.
- Use **signed GET URLs** (TTL ≤ 15 min) for private image reads, served by the Go API.
- Use **public object URLs** only for approved shared catalog images copied to the public catalog bucket after moderation. A CDN/front-door is Stage 2.
- Use **signed PUT URLs** (TTL ≤ 5 min) for direct browser/mobile uploads, with size and content-type bounds verified by the Go API before issue.
- Server-side credentials live only in the protected plaintext
  `/opt/capsule-zero/.env`, owned by `root:root` with mode `600`, or provider
  dashboards. Filesystem encryption has not been established.
- Enforce upload constraints before storage: JPEG, PNG, WebP; max 10 MB.
- Normalize processed display images to WebP where quality permits.
- CORS on production asset buckets allows `https://capsulezero.app` only; local origins belong to separate dev/test buckets.
- Nightly `pg_dump` automation is deferred to spec-024 Phase 5. When it lands,
  it uploads only client-side-encrypted data to the already Object-Locked
  backup bucket and enforces at least 14 day retention. Activation additionally
  requires the uploader to sanitize/forbid Object Lock mode, retain-until, and
  legal-hold headers plus explicit acceptance of the remaining provider risk or
  a provider fix.
- Hetzner Object Storage has no default data-at-rest encryption. Backups must be encrypted before upload. On 2026-07-10 the founder explicitly accepted direct signed PUT/GET for the bounded v0.1 personal-photo-original foundation, with private storage, short TTLs, exact-origin CORS, owner-bound API operations, opaque random object keys, and no credential/presigned-URL logging. A presigned URL itself is not opaque: its host, path, and signature query necessarily expose the bucket, object key, and access-key ID. Treat it as a short-lived bearer capability. Image-byte inspection, orphan cleanup, and an SSE-C/API-proxy alternative remain follow-ups before broader storage use.
- A holder can replay a signed PUT before its five-minute expiry and overwrite
  the same final object with bytes that satisfy the signed size/content-type
  constraints. A replay after completion can therefore make the persisted ETag
  stale because idempotent completion does not re-read the object. The founder
  accepts this bounded residual for the original-only foundation; staging keys,
  conditional writes, or an API proxy must be reconsidered before expanding
  the flow to broader asset classes.
- Do not rely on object notifications; the client must call `/api/uploads/photo/complete`, and that endpoint must be idempotent.
- Do not design critical flows around `CopyObject`; Hetzner documents that it may fail even when buckets are in the same location.
- Browser uploads, API `HeadObject`, signed reads, and cleanup jobs must retry transient 5xx/timeouts with exponential backoff while reusing the same random object key.

### Upload flow

1. Client requests an upload target from the Go API (`POST /api/uploads/photo/init`).
2. The API validates metadata and returns a signed PUT URL plus the public
   `jobId` and `assetId` identifiers.
3. The client uploads directly to Hetzner Object Storage.
4. The client calls `POST /api/uploads/photo/complete` with both `jobId` and
   `assetId`.
5. The API checks the exact size/content type, records one `original`
   `item_assets` row, and moves the `photo_upload` job from `queued` to
   `completed`. No Redis work is enqueued by the current slice.
6. When Stage 2 ships, the image worker may write a processed variant and the
   UI may prefer it; neither behavior is present in the spec-040 foundation.

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
- Backups and lifecycle policies are our responsibility; automation remains
  deferred to spec-024 Phase 5 even though the isolated bucket/key are ready.
- Signed URL leakage and replay handling are on us: short TTLs bound exposure,
  but cannot revoke or prevent same-key replay before expiry.

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
