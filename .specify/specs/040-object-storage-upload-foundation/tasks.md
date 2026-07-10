# Spec 040 — Tasks & Process Memory

## Tasks

- [ ] Commit failing config, storage, health, and upload tests before product
  implementation (TDD red commit).
- [ ] Add Postgres migrations for owner-bound `upload_jobs` and unattached
  original `item_assets`, including uniqueness/idempotency constraints.
- [ ] Implement strict `OBJECT_STORAGE_*` config and the shared S3-compatible
  `internal/storage` adapter (readiness, presigned PUT/GET, metadata lookup).
- [ ] Add storage readiness to `/api/health` with safe fail-closed errors.
- [ ] Implement authenticated photo init/complete with validation, ownership,
  metadata verification, and idempotent completion.
- [ ] Update OpenAPI/API docs, regenerate the client, and pass route/contract
  guards.
- [ ] Wire compose/env and actualize affected backend, storage, runtime, test,
  and process-memory docs without reintroducing Supabase.
- [ ] Re-check Hetzner status; provision ADR-003 buckets and isolated practical-
  scope credentials; configure exact-origin production CORS.
- [ ] Install required variables in `/opt/capsule-zero/.env` without printing or
  persisting secret values, and verify only presence plus ownership/mode.
- [ ] Run the redacted real smoke: allowed/disallowed CORS preflight, signed
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
  private bucket, scoped server credentials, exact `https://capsulezero.app`
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

### Dead Ends

- None recorded yet. Add failed approaches and why they were rejected during
  implementation; do not erase them before completion.

### Known Issues / Follow-ups

- Hetzner does not encrypt stored objects by default. The founder accepted
  this bounded personal-photo residual; leaked signed URLs remain usable until
  their short expiry.
- Direct PUT bypasses API inspection of the byte stream. This foundation checks
  stored size/content type at completion but does not yet decode images,
  inspect content, remove metadata, scan malware, or remove abandoned uploads.
- `item_assets` stays unattached until the wardrobe bounded-context schema and
  item-photo integration land; no frontend is wired to create uploads in this
  slice.
- Public-catalog behavior, background image processing, backup encryption and
  scheduling, lifecycle/orphan cleanup, and restore drills remain explicitly
  out of scope.
