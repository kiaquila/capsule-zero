# Spec 040 — Tasks & Process Memory

## Tasks

- [x] Commit failing config, storage, health, and upload tests before product
  implementation (TDD red commit).
- [x] Add Postgres migrations for owner-bound `upload_jobs` and unattached
  original `item_assets`, including uniqueness/idempotency constraints.
- [x] Implement strict `OBJECT_STORAGE_*` config and the shared S3-compatible
  `internal/storage` adapter (readiness, presigned PUT/GET, metadata lookup).
- [x] Add storage readiness to `/api/health` with safe fail-closed errors and a
  serialized five-second probe cache.
- [x] Implement authenticated photo init/complete with validation, ownership,
  metadata verification, and idempotent completion.
- [x] Keep production upload activation default-off until per-action key
  hardening plus the quota, orphan-cleanup, and wardrobe-attachment slice land.
- [x] Update OpenAPI/API docs, regenerate the client, and pass route/contract
  guards.
- [x] Wire compose/env and actualize affected backend, storage, runtime, test,
  and process-memory docs without reintroducing Supabase.
- [x] Re-check Hetzner status; provision ADR-003 buckets and isolated practical-
  current-bucket credentials; configure exact-origin production CORS.
- [x] Install required variables in `/opt/capsule-zero/.env` without printing or
  persisting secret values, and verify only presence plus ownership/mode.
- [x] Run the redacted real smoke: allowed/disallowed CORS preflight, signed
  10 MB PUT, metadata/read, repeated-safe verification where applicable, and
  cleanup.
- [ ] Run all verification rows in `plan.md` at the final PR head and replace
  every `PENDING` evidence cell.
- [ ] Fill the PR SENAR Done Gate, obtain green required checks/review, and
  resolve every blocking finding before merge-ready status.

## Process Memory

### Decisions

- **2026-07-10 (founder/user):** implement the storage foundation and provision
  the required Hetzner production resources in one cohesive PR. Provisioning
  precedes merge because storage becomes a required health dependency.
- **2026-07-10 (founder/user security acceptance):** direct presigned PUT/GET
  for private personal-photo originals is accepted for v0.1 despite Hetzner
  Object Storage having no default data-at-rest encryption. Controls are a
  private bucket, practical current-bucket server credentials, exact
  `https://capsulezero.app`
  CORS, unguessable server keys, PUT TTL at most five minutes, GET TTL at most
  fifteen minutes, authenticated ownership checks, and no credential/presigned-
  URL logs. Database backups still require client-side encryption.
- **2026-07-10:** the first database shape intentionally records unattached
  original assets. The repository has no landed wardrobe-item schema to own a
  foreign key yet; inventing a parallel item model would violate the reuse
  rule. A later wardrobe slice attaches the asset using the established IDs.
- **2026-07-10:** complete, not init, is the idempotency boundary. The API
  issues a random server-owned key, verifies object metadata, and database
  constraints ensure repeated/concurrent successful completion resolves to
  one asset.
- **2026-07-10:** provisioning all ADR-003 buckets establishes policy
  boundaries only. It does not activate public-catalog delivery or claim that
  encrypted backup scheduling/restores are implemented.
- **2026-07-10:** the production upload routes stay behind
  `OBJECT_STORAGE_UPLOADS_ENABLED=false`. This foundation proves their contract,
  storage path, and concurrency semantics, but activation before owner quota,
  orphan cleanup, and wardrobe attachment would expose an unaffiliated storage-
  cost endpoint.
- **2026-07-10:** a presigned URL is documented as a short-lived bearer
  capability, not an opaque URL. It necessarily reveals provider routing, the
  bucket, server-generated key, and access-key identifier. The secret key is
  never returned or logged.
- **2026-07-10:** `/api/health` keeps Postgres and Kratos fresh while
  serializing/caching only the external Object Storage result for five seconds.
  Upload init still performs a fresh readiness call before signing, and public
  health bursts cannot become an unbounded S3 `HeadBucket` amplifier.
- **2026-07-10:** the runtime key remains in the asset project because Hetzner
  credentials are project-wide; bucket policies allowlist it on the current
  private-assets bucket and explicitly deny it on current public catalog. The
  backup key/bucket live in a separate project, providing a practical current-
  bucket boundary. Both allowlisted keys retain bucket control-plane access;
  the runtime key also receives default access to future asset-project buckets.
  Per-action data-plane keys in dedicated key-only projects are required before
  uploads or backup automation are activated.

### Dead Ends

- Browser-session clipboard content was not available through macOS `pbpaste`.
  Credentials were therefore transferred from the authenticated browser
  session through a one-time FIFO directly into `ssh cz`; no local secret file
  or model-visible value was created.
- The assumed `amazon/aws-cli:2` image tag did not exist. Provisioning switched
  to `latest`, then pinned the resolved immutable digest before policy/CORS
  verification.
- The first public-catalog allowed-origin CORS probe requested `Content-Type`
  for `GET`; the deliberately empty public `AllowedHeaders` correctly denied
  it. The valid browser GET probe was repeated without that header and passed.
- The first standalone storage smoke exported `DATABASE_URL`, but the server
  env canonically stores `API_DATABASE_URL` for Compose interpolation. The
  smoke maps that value only for `config.Load`; no database connection is made.
- A combined `NotAction` deny policy was accepted by Hetzner, but a live
  negative probe showed the same-project runtime key could still update the
  bucket policy. It was rejected as unproven action scoping; the canonical
  `DenyAllUsersButOne` policy was restored and matched by redacted readback.
- Anonymous GET of a missing public key returned 403, which cannot distinguish
  public `GetObject` from a missing-key response without `ListBucket`. It was
  rejected as visibility evidence; the applied public policy plus exact CORS
  checks remain the recorded boundary, and catalog behavior stays out of scope.

### Known Issues / Follow-ups

- Hetzner does not encrypt stored objects by default. The founder accepted
  this bounded personal-photo residual; leaked signed URLs remain usable until
  their short expiry.
- Direct PUT bypasses API inspection of the byte stream. This foundation checks
  stored size/content type at completion but does not yet decode images,
  inspect content, remove metadata, scan malware, or remove abandoned uploads.
- Until the signed PUT expires, it can overwrite the same object with different
  bytes of the signed size/type after completion and leave the persisted ETag
  stale. Production activation remains off; dedicated key-only projects with
  cross-project per-action allows are mandatory, and the quota/cleanup/
  attachment slice must either add checksum/immutable-finalization control or
  explicitly retain this bounded residual.
- `item_assets` stays unattached until the wardrobe bounded-context schema and
  item-photo integration land; no frontend is wired to create uploads in this
  slice, and the production upload feature flag remains false.
- Current bucket policies isolate principals only for buckets that exist now.
  Allowlisted same-project keys retain `s3:*` control-plane access and default
  access to future project buckets. Before activation, issue data-plane keys in
  dedicated key-only projects, grant exact actions cross-project, and retain
  separate bucket-project operator keys for policy rotation.
- Public-catalog behavior, background image processing, backup encryption and
  scheduling, lifecycle/orphan cleanup, and restore drills remain explicitly
  out of scope.
