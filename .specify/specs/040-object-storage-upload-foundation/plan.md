# Spec 040 — Plan & Verification

## Approach

Deliver one cohesive implementation PR, with production provisioning sequenced
before any merge that would make storage a required health dependency:

1. Add feature memory and commit failing Go tests first (TDD).
2. Add migrations and the provider-neutral S3 adapter/configuration.
3. Add storage readiness to health and implement authenticated init/complete.
4. Actualize OpenAPI, regenerate the client, wire compose/env, and update all
   affected active docs in the same change.
5. Re-check Hetzner status, provision the ADR-003 buckets/credentials/CORS, and
   install production secrets without exposing their values.
6. Run unit/contract/config checks and the real signed PUT/read/CORS/cleanup
   smoke; record command/check evidence below.
7. Complete Process Memory and the PR SENAR Done Gate before declaring the PR
   merge-ready.

The API is deployed only after its required object-storage env and private
bucket exist. Provisioning the catalog/backup storage boundary does not make
the excluded catalog or backup application behavior complete.

## Verification

Replace every `PENDING` cell with command, test, diff, screenshot, live-check,
or linked-check evidence from the final PR head; an AI-written summary alone is
not evidence.

| # | Acceptance criterion | Required evidence | Evidence |
|---|---|---|---|
| 1 | Failing tests precede implementation | Git history shows the red-test commit before implementation; captured failing `go test` result | `7f25927`, `85b7eaa`, and `f7577c2` are test-only commits before the implementation commit. Captured red runs: `cd api && go test ./...` (undefined config/storage/uploads symbols); `go test ./internal/httpx ./internal/uploads` (trailing JSON accepted, malformed UUID not 400); `go test ./internal/config ./internal/uploads ./cmd/api` (missing feature gate and health-probe cache). |
| 2 | Strict env and explicit S3 client | Config/storage unit tests for missing/invalid values, endpoint/credential selection, TTLs, timeout/retry bounds, and secret-safe errors | `cd api && go test ./internal/config ./internal/storage` passes. `object_storage_test.go` covers required env, exact HTTPS Hetzner region endpoint, and default-off activation; `aws_test.go` covers exact Put/Get inputs and TTLs, signed headers, metadata/404 mapping, required fields, and network bounds. `aws.go` constructs only a static credential provider and explicit `BaseEndpoint`. |
| 3 | Storage-gated health | Health handler tests for storage healthy/error plus a rendered/live health probe | `cd api && go test ./cmd/api -run Health` passes healthy/degraded storage and proves Postgres/Kratos stay fresh while only the serialized Object Storage probe is cached for five seconds. Production `storage-ready=ok` from the live client confirms the configured private bucket; upload init performs a separate fresh probe. |
| 4 | Init validates and returns a safe signed contract | Handler/service tests for happy path, auth, MIME/size/JSON validation, hostile filename, signing failure, and response non-disclosure | `cd api && go test ./internal/httpx ./internal/uploads ./cmd/api` passes: MIME/size/basename/trailing-JSON/auth/storage failures have no job/URL side effect; the enabled happy path returns IDs, signed headers, and expiry. The route test proves default-disabled requests return 503 before limiter/session resolution or any provider/database call. |
| 5 | Complete validates object and fails closed | Tests for missing object, wrong size/type, outage, cross-user access, and no asset/status mutation on failure | `cd api && go test ./internal/uploads -run 'TestComplete'` passes missing/mismatch/outage/cross-owner/idempotent cases plus malformed UUID rejection before repository access. |
| 6 | Complete is idempotent/concurrency-safe | Repeat/concurrent completion test plus migration uniqueness/transaction evidence | Against fresh `postgres:16`, `TEST_DATABASE_URL=<local ephemeral> go test -tags=integration -race -run TestRepoCompleteIsConcurrentAndIdempotent ./internal/uploads` passed: two simultaneous completions returned one asset and one completed job. Repository SQL uses `FOR UPDATE`; migration enforces unique asset/key and owner-bound composite FK constraints. |
| 7 | Database schema is durable and owner-bound | Migration test or clean Postgres migration; schema/constraint inspection for `upload_jobs` and unattached original `item_assets` | All three migrations applied to fresh ephemeral `postgres:16`; inspection returned `migrations=3`, `upload-constraints=11`, `asset-constraints=9`. A wrong-owner asset insert failed (`owner-fk-negative=pass`); the valid transition produced `asset-count=1`, `job-status=completed`. |
| 8 | API contract and generated client are synchronized | `node scripts/check-api-contract.mjs` and API client generation check | `npm run check:api-contract` passes: `55 route-methods verified, 17 Go route registrations covered`, then `Verified API clients for 55 operations`; `npm --prefix app run typecheck` passes. |
| 9 | Go quality gates pass | `cd api && go vet ./... && go test ./...` | `cd api && go vet ./...`, `go test ./...`, and `go test -race ./internal/storage ./internal/uploads ./internal/httpx ./cmd/api` all pass. |
| 10 | Compose/env wiring is valid and has no retired coupling | `docker compose --env-file deploy/compose.env.example config --quiet` plus targeted `rg`/diff review | Production and `-f docker-compose.yml -f docker-compose.dev.yml` dev config both pass `docker compose ... config --quiet`; dev uses non-secret disabled placeholders. `npm run check:repo`, feature-memory guard, and targeted diff review pass; no new Supabase coupling is introduced. |
| 11 | ADR-003 bucket/key/CORS topology is live | Hetzner/CLI evidence naming bucket, project/region, visibility, dedicated key-only projects, exact cross-project actions, and redacted CORS policy; no credential values | [Official status](https://status.hetzner.com/incident/ebd62173-d902-4e75-939a-265c0b3f1ddb) was re-checked on 2026-07-10 and HEL retained as the advised new-bucket region. Bucket projects remain `15203114` (private/public assets, HEL) and `15296835` (private Object-Locked backups, FSN). Dedicated runtime-key project `15302873` and backup-key project `15302925` are bucketless (`list-buckets=0`). Redacted policy readback and live matrix passed: runtime `ListBucket` on private plus `PutObject`/`GetObject`/`DeleteObject` only for `item-originals/*` and `smoke/spec-040/*`; control-plane/public/backup access denied, including an explicit runtime-principal `s3:*` deny across public catalog. Backup normal `PutObject` under `postgres/*` passed; explicit principal denies blocked Head/Get/version Get, ACL get/put, retention/legal-hold get/put, object/version delete, governance bypass, and bucket/version listing, while policy/CORS/lock-config reads, multipart listing, outside-prefix/assets writes, `public-read`, and AllUsers grant-read probes were also denied. Hetzner/RGW still accepts Object Lock mode/retain-until/legal-hold headers on the original `PutObject`; this cannot expose or delete existing data but remains a documented write-time storage-DoS/cost activation gate for future backup automation. Hetzner UI readback confirmed deletion of the old runtime/backup keys and both temporary policy operators; the new cross-project keys remain. |
| 12 | Production env is installed safely | `ssh cz` evidence of required variable names/presence and protected file ownership/mode only; values stay redacted | Safe `ssh cz` readback after atomic credential rotation: `/opt/capsule-zero/.env` is `root:root` mode `600`; every canonical `OBJECT_STORAGE_*` and `BACKUP_S3_*` key appears exactly once; legacy `BACKUP_OBJECT_STORAGE_*` names are absent; `OBJECT_STORAGE_UPLOADS_ENABLED=false`. Values were not printed or persisted in evidence. |
| 13 | Real signed object-store smoke passes | Redacted result for 10 MB signed PUT, metadata/read, allowed-origin preflight, disallowed-origin negative, and object deletion | Post-revocation production-endpoint `cmd/storage-smoke` with the rotated dedicated runtime credential returned exactly: `storage-ready=ok`; `signed-put=ok bytes=10485760`; `head-object=ok`; `signed-get=ok checksum-match`; `cleanup=ok`. Private exact-origin PUT preflight with `content-type` returned 200 with exact ACAO, PUT, `content-type`, and max-age 300; attacker origin returned 403 without ACAO. Public exact-origin GET preflight without request headers returned 200 with exact ACAO, GET, and max-age 300; attacker origin returned 403 without ACAO. Backup exact-origin preflight returned 403 without ACAO, confirming absent backup CORS. No URL/key/credential was printed. |
| 14 | Full repository/SENAR gates pass at PR head | Required GitHub checks, `git diff --check`, feature-memory guard, no unresolved blocking review, PR Done Gate | **Not yet satisfied:** local gates and independent security/DB/docs reviews are resolved; link the draft PR checks and fill the PR Done Gate after the final implementation commit is pushed. Do not declare merge-ready before this row is replaced with current-head evidence. |

## Risks and mitigations

- **Production deploy ordering.** Adding storage to readiness before env/bucket
  provisioning would break CD. Provision and smoke first; merge/deploy second.
- **Credential and signed-URL leakage.** Browser/CLI output can expose values.
  Copy credentials directly into the protected server env, suppress command
  tracing, redact smoke output, and never persist URLs in tests or docs.
- **Provider behavior differs from AWS S3.** Exercise the actual Hetzner
  endpoint for PUT, HEAD/read, CORS, and cleanup instead of treating unit tests
  as compatibility proof.
- **Direct upload cannot validate bytes before ingress.** Completion verifies
  exact stored metadata and fails closed; content decoding/scanning and orphan
  cleanup remain explicit follow-ups.
- **Unattached assets can become orphans.** This slice deliberately lacks the
  wardrobe relationship. Random owner-bound keys and durable job state make a
  later cleanup/attachment slice possible. Production upload routes stay
  default-off until quota, cleanup, and attachment controls deliberately land.
- **Hetzner has no default at-rest encryption.** The founder accepted the
  private-photo residual for this bounded foundation; backup contents remain
  forbidden until client-side encryption automation exists.
- **Provider policy behavior needs negative live probes.** A cross-project
  backup `PutObject` allow alone unexpectedly permitted `HeadObject`/
  `GetObject` on Hetzner. The applied backup policy therefore adds explicit
  principal denies for reads, ACL/direct Object Lock controls, deletes, and
  bucket/version lists, plus Put-time ACL conditions; live probes verify those
  controls instead of assuming AWS action mapping. The provider still accepts
  Object Lock mode/retain-until/legal-hold headers as part of `PutObject`, so
  backup automation must strip/reject them and retain explicit risk acceptance
  or await a provider fix. Superseded same-project keys were revoked after env
  rotation and policy verification.
- **Public health traffic can amplify provider probes.** The handler keeps
  Postgres/Kratos probes fresh but serializes and caches the external Object
  Storage result for five seconds, so a burst cannot fan out into one S3
  request per caller. Init performs its own fresh probe before signing.
