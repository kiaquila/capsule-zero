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
| 1 | Failing tests precede implementation | Git history shows the red-test commit before implementation; captured failing `go test` result | PENDING |
| 2 | Strict env and explicit S3 client | Config/storage unit tests for missing/invalid values, endpoint/credential selection, TTLs, timeout/retry bounds, and secret-safe errors | PENDING |
| 3 | Storage-gated health | Health handler tests for storage healthy/error plus a rendered/live health probe | PENDING |
| 4 | Init validates and returns a safe signed contract | Handler/service tests for happy path, auth, MIME/size/JSON validation, hostile filename, signing failure, and response non-disclosure | PENDING |
| 5 | Complete validates object and fails closed | Tests for missing object, wrong size/type, outage, cross-user access, and no asset/status mutation on failure | PENDING |
| 6 | Complete is idempotent/concurrency-safe | Repeat/concurrent completion test plus migration uniqueness/transaction evidence | PENDING |
| 7 | Database schema is durable and owner-bound | Migration test or clean Postgres migration; schema/constraint inspection for `upload_jobs` and unattached original `item_assets` | PENDING |
| 8 | API contract and generated client are synchronized | `node scripts/check-api-contract.mjs` and API client generation check | PENDING |
| 9 | Go quality gates pass | `cd api && go vet ./... && go test ./...` | PENDING |
| 10 | Compose/env wiring is valid and has no retired coupling | `docker compose --env-file deploy/compose.env.example config --quiet` plus targeted `rg`/diff review | PENDING |
| 11 | ADR-003 bucket/key/CORS topology is live | Hetzner/CLI evidence naming bucket, project/region, visibility, key scope, and redacted CORS policy; no credential values | PENDING |
| 12 | Production env is installed safely | `ssh cz` evidence of required variable names/presence and protected file ownership/mode only; values stay redacted | PENDING |
| 13 | Real signed object-store smoke passes | Redacted result for 10 MB signed PUT, metadata/read, allowed-origin preflight, disallowed-origin negative, and object deletion | PENDING |
| 14 | Full repository/SENAR gates pass at PR head | Required GitHub checks, `git diff --check`, feature-memory guard, no unresolved blocking review, PR Done Gate | PENDING |

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
  later cleanup/attachment slice possible; no UI exposes this foundation yet.
- **Hetzner has no default at-rest encryption.** The founder accepted the
  private-photo residual for this bounded foundation; backup contents remain
  forbidden until client-side encryption automation exists.
