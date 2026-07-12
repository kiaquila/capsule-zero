# /api — Go modular monolith

The implemented API covers auth/profile plus the spec-040 private original-photo
upload foundation. Runtime delivery is tracked in
[spec 024](../.specify/specs/024-production-stack-runtime/) and the current
storage slice in
[spec 040](../.specify/specs/040-object-storage-upload-foundation/).

Current layout:

```text
cmd/
  api/                           <- wiring, net/http ServeMux, health probe
  storage-smoke/                 <- redacted signed upload/read/cleanup probe
internal/
  auth/                          <- Kratos session and auth flows
  config/                        <- fail-closed runtime configuration
  db/                            <- pgx pool and embedded migration runner
  httpx/                         <- JSON request/response helpers
  kratos/                        <- Kratos client
  profiles/                      <- profile repository and handlers
  ratelimit/                     <- in-process request throttling
  storage/                       <- S3-compatible private Object Storage adapter
  uploads/                       <- authenticated photo init/complete lifecycle
migrations/
  0001_initial_auth.sql
  0002_profiles_email_unique.sql
  0003_object_storage_uploads.sql
Dockerfile                       <- multi-stage Go build to distroless runtime
```

The runtime router is the standard-library `net/http` `ServeMux`; it is not an
OpenAPI-generated router. `docs_capsule_zero/adr/openapi.yaml` remains the
client contract, while `scripts/check-api-contract.mjs` is a textual guard that
keeps the OpenAPI operations aligned with `api-spec.md`. Go route and handler
behavior is verified by package tests.

The current upload schema supports only `photo_upload` jobs transitioning from
`queued` to `completed`, plus unattached `original` item assets. Redis queue
consumers, processed variants, backup automation, and the remaining product
bounded contexts are deferred to later slices.
