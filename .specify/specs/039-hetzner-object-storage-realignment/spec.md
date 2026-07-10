# Spec 039 — Hetzner Object Storage realignment

## Goal

Retire the stale DigitalOcean Spaces storage decision from active Capsule Zero
architecture and align v0.1 planning around Hetzner Object Storage.

The 2026-07-02 hosting migration moved production compute to Hetzner. On
2026-07-10 the founder clarified that storage should live in Hetzner as well.
This spec updates the decision source of truth before the first upload/storage
backend slice is implemented, so new Go code does not inherit the old
DigitalOcean-specific env contract, CDN assumptions, bucket topology, or backup
runbooks.

## Scope

**In:**

- ADR-001 and ADR-003: replace DigitalOcean Spaces with Hetzner Object Storage,
  remove the built-in CDN premise, document the HEL-vs-NBG status gate, and
  record Hetzner-specific security limits.
- Active SSOT docs: `AGENTS.md`, constitution, backend/mobile/devops docs,
  phase gates, runtime spec 024, and launch plan.
- User-facing legal subprocessor copy: name Hetzner storage only and remove the
  CDN claim until a CDN actually fronts public catalog assets.
- Env contract: replace `SPACES_*` planning with provider-neutral
  `OBJECT_STORAGE_*` and `BACKUP_S3_*` keys.
- Historical process-memory files: add dated supersession notes where they
  preserve old DigitalOcean/Spaces evidence.

**Out:**

- Implementing the Go storage adapter, upload endpoints, avatar slice, or image
  worker.
- Creating production buckets or credentials. That requires the exact Hetzner
  Console project/key choices and should be done with the storage slice smoke
  checklist so no unused secrets or billable resources drift ahead of code.
- Restarting Docker or changing the production server. This spec performs only
  read-only server verification.

## Context

The production server audit on `ssh cz` shows the current root disk has about
28 GB free and no attached Volume. That is enough for OS, Docker, Postgres, and
logs, but it is not the canonical home for user wardrobe photos. Hetzner Cloud
Volumes remain block storage for bounded scratch/model cache, not object
storage for browser/mobile signed uploads.

Hetzner Object Storage is S3-compatible and available in `fsn1`, `nbg1`, and
`hel1`. The official status page currently carries an Object Storage
high-traffic advisory and recommends creating new buckets in HEL while the
advisory remains active. The Go implementation must re-check status at
provisioning time and run a real signed 10 MB upload smoke before finalizing a
region.

Hetzner Object Storage has no default data-at-rest encryption and supports only
SSE-C for server-side encryption. v0.1 keeps direct browser/mobile signed PUTs
for personal photos only if that risk is explicitly accepted in privacy/security
review; encrypted database backups are mandatory.

## Acceptance Criteria

1. Active architecture docs name Hetzner Object Storage, not DigitalOcean
   Spaces, for v0.1 file storage.
2. Active env/runbook docs use `OBJECT_STORAGE_*` and `BACKUP_S3_*`, not
   `SPACES_*`.
3. Active docs no longer claim a built-in object-storage CDN. Public catalog
   delivery uses the native Hetzner object URL until a Stage-2 CDN is wired.
4. ADR-003 records the bucket topology, CORS stance, retry/idempotency
   requirements, backup bucket posture, and no-default-at-rest-encryption gate.
5. Historical docs that still mention DigitalOcean Spaces carry a dated
   supersession note instead of being silently rewritten.
6. `docker compose --env-file deploy/compose.env.example config --quiet` still
   validates on a clean checkout.

## Negative Scenario

An agent preparing the next backend storage slice must not be able to follow an
active doc into provisioning a DigitalOcean Spaces bucket, using `SPACES_*`
variables, or promising Spaces CDN URLs. Grep should show any remaining
DigitalOcean Spaces references as historical/superseded only.

## TDD Waiver

This is a documentation, architecture, and env-contract realignment. It changes
no application runtime behavior and introduces no new user-facing product code,
so the failing-test-first loop does not apply. Verification is by compose config
validation, grep checks, and source review.
