# Tasks 047 — Production Edge Hardening

## Tasks

- [x] Connect the production deploy job through Tailscale workload identity.
- [x] Close public SSH and restrict origin web ports to Cloudflare proxy ranges.
- [x] Activate Cloudflare proxying, strict TLS, DNSSEC, and scoped edge controls.
- [x] Codify trusted real-IP restoration, default-deny vhosts, probe blocking, and
  conservative request/connection limits in `infra/nginx-host/**`.
- [x] Preserve `PATCH`, `DELETE`, and the other canonical application methods in the
  nginx request guard while continuing to reject `TRACE`/`CONNECT`.
- [x] Extend the deploy wrapper's transactional nginx backup/install/rollback set.
- [x] Fail closed before installing the dual-host vhost unless the live certificate
  covers both public hostnames.
- [x] Enable encrypted daily off-site backups after the restore drill.
- [x] Upgrade Next.js from `16.2.6` to the OSV-fixed `16.2.11` patch after the
  corrected PR head exposed the newly published advisories.
- [x] Address the first Codex review findings and prepare the corrected head for the
  required current-head checks and second Codex review.

## Process Memory

### Dead Ends

- **Bot Fight Mode was enabled, then disabled.** On Cloudflare Free it cannot be scoped
  or bypassed and challenged the API health monitor. Scoped WAF/rate-limit controls keep
  the useful boundary without making health verification unreliable.
- **Treating a narrow method whitelist as generic hardening broke the API contract.**
  The first guard allowed only `GET`, `HEAD`, `POST`, and `OPTIONS`, but the canonical
  OpenAPI and live profile route use `PATCH`, and the contract includes `DELETE`.
  Hardening now rejects only methods outside the normal application set.

### Decisions

- **2026-07-22 Cloudflare activation was brought forward from the former Stage-2
  deferral.** The apex and `www` are proxied now; the origin firewall trusts only
  Cloudflare web ranges, nginx trusts `CF-Connecting-IP` only from those ranges, and the
  public-catalog object-storage CDN remains a separate future slice.
- **2026-07-22 deploy SSH became Tailscale-only.** GitHub Actions uses OIDC workload
  identity and an ephemeral `tag:ci` node; operator devices and CI can reach only the
  production host's SSH port under the tailnet ACL.
- **2026-07-22 the Object Storage backup residual was accepted with an uploader
  boundary.** The upload-only key still cannot read or delete data. The uploader emits a
  fixed local header set with no caller-controlled metadata, while encryption, schedule,
  retention, and a full restore drill close the remaining activation gates.
- **2026-07-23 the failing current-head OSV gate became the regression test for a
  framework patch.** The scanner reported nine fixable advisories against
  `next@16.2.6`; the dependency and lockfile moved only to `16.2.11`. The full app
  lint/CSS-lint/typecheck/production-build chain and the same OSV scanner image pass.

### Known Issues

- Cloudflare proxy ranges are a repository snapshot and must be refreshed in nginx and
  both origin firewalls whenever Cloudflare publishes a change.
- Production remains the only environment; every deploy-relevant merge to `main` goes
  directly to `capsulezero.app`.
- Personal-photo upload routes remain disabled until quota, orphan cleanup, and wardrobe
  attachment land.
