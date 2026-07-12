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
- [x] Keep production upload activation default-off until the quota,
  orphan-cleanup, and wardrobe-attachment slice lands.
- [x] Update OpenAPI/API docs, regenerate the client, and pass route/contract
  guards.
- [x] Wire compose/env and actualize affected backend, storage, runtime, test,
  and process-memory docs without reintroducing Supabase.
- [x] Re-check Hetzner status; provision the ADR-003 buckets and exact-origin
  production CORS.
- [x] Create bucketless runtime-key project `15302873` and backup-key project
  `15302925`; apply and live-test cross-project action policies for the asset
  and backup bucket projects.
- [x] Install required variables in `/opt/capsule-zero/.env` without printing or
  persisting secret values, atomically rotate to the dedicated credentials, and
  verify only canonical presence, `root:root` mode `600`, and uploads disabled.
- [x] Revoke the superseded same-project runtime/backup credentials and both
  temporary policy operators after dedicated-policy/env-rotation checks.
- [x] Run the final redacted real smoke with the rotated runtime credential:
  allowed/disallowed CORS preflight, signed 10 MB PUT, metadata/read, and
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
  private bucket, dedicated bucketless server credentials with cross-project
  action policies, exact `https://capsulezero.app` CORS, unguessable server
  keys, PUT TTL at most five minutes, GET TTL at most fifteen minutes,
  authenticated ownership checks, and no credential/presigned-URL logs.
  Database backups still require client-side encryption.
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
- **2026-07-10:** the first provisioning pass kept the runtime key in the asset
  project and the backup key beside the isolated backup bucket. That practical
  current-bucket boundary retained bucket control-plane and future-bucket
  access. **Superseded 2026-07-11** by dedicated bucketless key-only projects
  and cross-project action policies; the old same-project credentials were
  revoked after the new policies, env rotation, and negative matrix passed.
- **2026-07-11:** runtime credentials live in bucketless project `15302873` and
  backup credentials in bucketless project `15302925` (`list-buckets=0` for
  both). Asset buckets remain in project `15203114` / HEL and the Object-Locked
  backup bucket in project `15296835` / FSN. Runtime policy grants `ListBucket`
  on the private bucket and `PutObject`/`GetObject`/`DeleteObject` only under
  `item-originals/*` and `smoke/spec-040/*`; public catalog retains anonymous
  `GetObject` and explicitly denies the runtime principal `s3:*`. Backup policy
  allows `PutObject` under `postgres/*` and explicitly denies object/version
  reads, ACL get/put, retention/legal-hold get/put, object/version deletes,
  governance bypass, and bucket/version listing. Put-time ACL conditions reject
  dangerous canned ACLs and explicit grantee headers. The redacted live matrix
  passed all runtime probes plus a normal backup write and every listed backup
  denial, including policy/CORS/lock-config reads, multipart listing,
  outside-prefix/assets writes, `public-read`, and AllUsers grant-read. Hetzner/
  RGW still accepts Object Lock mode/retain-until/legal-hold headers on the
  original `PutObject`; that cannot expose/delete existing data but remains a
  bounded write-time storage-DoS/cost gate for future backup automation.
  Production env rotation passed with `root:root` mode `600` and uploads still
  false. The old runtime/backup keys and both temporary policy operators were
  deleted, leaving the new cross-project keys. The post-revocation 10 MiB
  signed PUT/HEAD/GET/checksum/delete smoke passed with cleanup; exact-origin
  private/public CORS, attacker-origin denial, and absent backup CORS were
  reconfirmed.

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
  it. The valid exact-origin GET preflight was repeated without that header and
  passed.
- The first standalone storage smoke used the full API `config.Load`, but the
  server env canonically stores `API_DATABASE_URL` for Compose interpolation.
  Codex Review caught that hidden dependency; the smoke now uses the reusable
  Object-Storage-only loader, with a regression test proving `DATABASE_URL` is
  unnecessary.
- A combined `NotAction` deny policy was accepted by Hetzner, but a live
  negative probe showed the same-project runtime key could still update the
  bucket policy. It was rejected as unproven action scoping; the canonical
  `DenyAllUsersButOne` policy was restored and matched by redacted readback.
- A cross-project backup policy granting only `PutObject` still allowed
  `HeadObject`/`GetObject` on the written object in live Hetzner probes. The
  policy therefore uses explicit principal denies for reads, ACL/direct Object
  Lock control, deletes, governance bypass, and listing. Put-time conditions
  successfully deny dangerous canned/grantee ACLs. Generic `Null:false` and
  wildcard conditions intended to reject all sensitive Put headers also denied
  normal writes and were rolled back. Specific Object Lock conditions were
  accepted by the policy API but did not stop Object Lock headers supplied on
  `PutObject`, so that remaining provider behavior is recorded rather than
  overstated as exact write-only isolation.
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
  stale. Production activation remains off; the quota/cleanup/attachment slice
  must either add checksum/immutable-finalization control or explicitly retain
  this bounded residual.
- `item_assets` stays unattached until the wardrobe bounded-context schema and
  item-photo integration land; no frontend is wired to create uploads in this
  slice, and the production upload feature flag remains false.
- Public-catalog behavior, background image processing, backup encryption and
  scheduling, lifecycle/orphan cleanup, and restore drills remain explicitly
  out of scope.
- Hetzner/RGW accepts Object Lock mode/retain-until/legal-hold headers on a
  `PutObject` authorized for the backup prefix even while direct retention and
  legal-hold actions are denied. A compromised writer therefore cannot read or
  delete existing data, but it could create retained/held versions and amplify
  storage cost. Backup automation must reject those headers and explicitly
  accept this residual or wait for a provider fix before activation.
