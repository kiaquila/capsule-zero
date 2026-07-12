# Spec 039 — Tasks & Process Memory

## Tasks

- [x] Add this spec folder with goal, scope, acceptance criteria, waiver, plan, and
   process memory.
- [x] Update ADR-001 and ADR-003 to make Hetzner Object Storage the active
   decision.
- [x] Update active SSOT docs: AGENTS, constitution, backend, mobile, devops,
   phase gates, launch plan, and runtime spec 024.
- [x] Update env template and local API/readme comments from Spaces-specific names
   to provider-neutral Object Storage naming.
- [x] Update legal subprocessor row to Hetzner-only storage and remove the CDN
   claim.
- [x] Add supersession notes to historical specs/process-memory files that
   preserve DigitalOcean Spaces evidence.
- [x] Run grep and compose validation.
- [ ] Open PR and request Codex review.

## Process Memory

### Decisions

- **2026-07-10:** DigitalOcean Spaces is superseded by Hetzner Object Storage
  for v0.1. The old DO decision survived the 2026-07-02 hosting migration in
  active ADRs and env docs; the founder clarified that storage should also live
  in Hetzner.
- **2026-07-10:** Do not put canonical wardrobe photos on the server root disk,
  a one-node MinIO, or a Hetzner Cloud Volume. The server has enough free root
  disk for OS/Docker/Postgres, but object storage is the right boundary for
  browser/mobile signed uploads and future catalog assets.
- **2026-07-10:** While Hetzner's Object Storage high-traffic advisory remains
  active, provisioning prefers HEL for new primary asset buckets despite the
  production server being in NBG. Re-check status and run a real signed upload
  smoke immediately before bucket creation.
- **2026-07-10:** v0.1 docs must not promise a CDN. Hetzner Object Storage has
  native public object URLs; a CDN/front-door is Stage 2.
- **2026-07-10:** Backups use a separate Hetzner Object Storage bucket/project
  and client-side encryption. Object Lock must be enabled at bucket creation if
  used for retention.

### Dead Ends

- **Rewrite historical specs as if DigitalOcean Spaces was never chosen —
  rejected.** Specs 033/038 and convergence notes contain dated evidence and PR
  review history. They now get supersession notes instead.
- **Provision buckets in this docs PR — rejected.** The code does not yet use an
  object storage client, and creating credentials/buckets before the smoke
  checklist risks unused secrets/resources. Provision with the storage adapter
  slice.

### Known Issues

- Docker log rotation is still absent on `cz-hz` (`/etc/docker/daemon.json` does
  not exist). This PR records the finding but does not restart Docker; log
  rotation belongs with the ops/backups slice because applying it may require a
  daemon restart.
