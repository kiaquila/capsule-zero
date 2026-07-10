# Spec 040 — Object Storage Upload Foundation

## Goal

Ship the first production object-storage application slice on top of the
Hetzner decision established by spec 039: a provider-neutral Go S3 adapter,
authenticated original-item-photo upload initialization/completion, durable
Postgres metadata, and production storage provisioning verified by a real
signed upload.

The slice must fail closed. An unavailable or misconfigured object store must
never produce a usable upload target, mark a missing or mismatched object as
complete, or make the API health endpoint report ready.

## Scope

**In:**

- `api/internal/storage`: an S3-compatible client configured for Hetzner
  Object Storage, with readiness (`HeadBucket`), signed PUT (TTL at most five
  minutes), signed GET (TTL at most fifteen minutes), object metadata lookup,
  and bounded timeout/retry behavior.
- Strict `OBJECT_STORAGE_*` runtime configuration: production requires the
  HTTPS endpoint, region, access key, secret key, and private-assets bucket;
  missing or invalid values stop API startup rather than selecting an implicit
  provider/default credential chain.
- `/api/health`: report the storage dependency and return `503` while its
  readiness probe fails.
- Authenticated `POST /api/uploads/photo/init` for original wardrobe-item
  photos: validate JPEG/PNG/WebP metadata and the 10 MB limit, create a
  server-owned random object key plus queued upload job, and return a
  short-lived signed PUT contract without exposing the private bucket/key.
- Authenticated `POST /api/uploads/photo/complete`: owner-bind the job, inspect
  the uploaded object, reject missing or mismatched metadata, and idempotently
  create/return one original `item_assets` record.
- Postgres migrations for `upload_jobs` and original `item_assets`. Assets in
  this foundation are deliberately unattached: the wardrobe-item relationship
  is added by the later wardrobe bounded-context slice.
- OpenAPI, generated client, compose/env wiring, backend/architecture docs,
  and the relevant spec-024 verification/process-memory references.
- Production provisioning from the ADR-003 topology: asset buckets in the
  currently recommended primary region, backup bucket/key isolated in its
  own Hetzner project, least-scope practical credentials, exact-origin CORS,
  server secrets in `/opt/capsule-zero/.env`, and a real signed-upload smoke
  with cleanup.

**Out:**

- Web/mobile provider wiring, upload controls, progress UI, or any other
  frontend/user-interface work.
- Attaching an uploaded asset to a wardrobe item or changing wardrobe-item
  APIs/schema beyond the unattached storage metadata foundation.
- Redis jobs, background removal, image decoding/transcoding, processed
  variants, the image worker, or asserting the five-second processing gate.
- Public-catalog application behavior, moderation/copy flows, public URL
  delivery, or CDN/front-door work. Provisioning the bucket from ADR-003 does
  not activate those behaviors.
- Backup scheduling, `pg_dump`, encryption/retention jobs, restore drills, or
  lifecycle automation. Provisioning the isolated backup bucket/key does not
  declare the backup phase complete.

## Security and privacy decision

**2026-07-10 (founder/user acceptance):** proceed with direct, presigned
PUT/GET for private personal-photo originals on Hetzner Object Storage despite
Hetzner having no default data-at-rest encryption. For this v0.1 foundation,
the accepted controls are a private bucket, scoped server credentials, exact
production-origin CORS, server-generated unguessable object keys, PUT TTL of
at most five minutes, GET TTL of at most fifteen minutes, authenticated and
owner-bound API operations, and no logging of credentials or presigned URLs.
Backups still require client-side encryption before any backup data is stored.

The accepted residual risk is that original photo bytes are not encrypted by
Hetzner by default, and a leaked presigned URL remains usable until its short
expiry. Direct PUT also bypasses API byte inspection: this slice verifies the
declared size/content type with object metadata at completion, but actual image
decoding, malware/content inspection, orphan cleanup, and SSE-C/API-proxy
alternatives remain follow-ups before broader storage use.

## Acceptance Criteria

1. API startup requires and validates the complete private-object-storage env
   contract and uses explicit static credentials plus the configured S3
   endpoint; no missing/invalid configuration silently falls back.
2. The shared storage adapter exposes readiness, signed PUT, signed GET, and
   metadata lookup primitives. It uses the configured bucket, bounded
   retries/timeouts, the ADR TTL limits, and never logs credentials or signed
   URLs.
3. `/api/health` includes `storage`; it returns ready only when Postgres,
   Kratos, and the private bucket are all reachable, and returns `503` with a
   safe dependency error when storage fails.
4. An authenticated valid init request (JPEG/PNG/WebP, `1..10 MiB`) creates one
   owner-bound queued job with a server-generated random `item-originals/`
   key and returns job/asset identifiers, the signed PUT URL, required upload
   headers, and expiry. The response exposes neither credentials nor a raw
   private bucket/object path.
5. Init rejects unauthenticated, unsupported/empty/oversized, malformed, or
   storage-signing-failure cases without returning an upload URL; user input
   cannot choose or traverse the object key.
6. Complete is owner-bound and checks that the object exists and matches the
   initialized size and content type before persisting an original asset.
   Missing/mismatched objects and storage outages fail closed without creating
   an asset or marking the job completed.
7. Repeating complete for an already completed owned job is idempotent: it
   returns the same asset and does not create a duplicate row. Concurrent
   completion is protected by database constraints/transaction semantics, and
   another user cannot discover or complete the job.
8. OpenAPI, route guards, generated client, compose/env examples, and active
   backend/storage documentation describe the implemented contract; no
   Supabase or provider-specific legacy coupling is added.
9. The three ADR-003 production buckets and isolated practical-scope keys are
   provisioned; production CORS permits only `https://capsulezero.app` and the
   required methods/headers; app credentials are installed only in the
   protected server env file.
10. A real production-endpoint smoke proves signed PUT of a 10 MB object,
    metadata/read access, expected CORS preflight behavior, and cleanup. No
    secret or presigned URL appears in repository files, CI output, PR text, or
    captured verification evidence.

## Negative scenarios (SENAR)

1. A required env value is missing, the endpoint is non-HTTPS/invalid, or the
   private bucket is unavailable: startup/readiness fails and init returns no
   signed target.
2. Init receives an unsupported MIME type, zero-byte payload, payload over
   10 MiB, malformed JSON, or an unauthenticated request: no job and no URL are
   created.
3. A caller supplies a hostile filename/path: storage still uses only the
   server-generated owner/asset key.
4. Complete runs before upload, after a wrong-size/type upload, or during an S3
   outage: no asset is created and the queued job is not reported complete.
5. A different authenticated user supplies a valid job/asset identifier: the
   API reveals no ownership or storage-path information and performs no write.
6. Complete is called repeatedly or concurrently for the same successful job:
   every successful response resolves to the same single asset row.
7. A CORS preflight uses a localhost or attacker origin: production object
   storage does not return an allow-origin grant.

## TDD contract

This is application code under a spec numbered at least 025. Tests for config,
health, validation, ownership, object mismatch/outage, and completion
idempotency are committed in a demonstrably failing state before the product
implementation that makes them pass. Infrastructure provisioning is verified
by config validation and the real smoke rather than a synthetic failing test.
