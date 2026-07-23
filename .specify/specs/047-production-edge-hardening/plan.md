# Plan 047 — Production Edge Hardening

## Approach

Keep Cloudflare and Tailscale as narrow transport boundaries rather than application
dependencies. Cloudflare is the only public web path to the Hetzner origin; Tailscale is
the only SSH path. nginx still terminates the authenticated origin TLS connection and
owns application routing, trusted client-address restoration, and sustained per-client
limits.

The GitHub-hosted deploy runner receives a short-lived Tailscale identity through OIDC.
No long-lived Tailscale client secret is stored in GitHub. The existing root-owned deploy
wrapper remains the only sudo entry point and installs repository-managed nginx files
transactionally with config validation, smoke checks, and rollback.

Backups are encrypted in process pipes before upload. The server holds only the public
`age` recipient and the prefix-bounded upload-only Object Storage credential; the private
decryption key stays off-server. The uploader constructs its own fixed request headers so
the provider's residual acceptance of Object Lock headers cannot be reached through
caller input.

## Verification

| # | Acceptance criterion | Evidence |
|---|---|---|
| 1 | Workflow and deploy wrapper are syntactically valid | `actionlint .github/workflows/cd-prod.yml`; `bash -n infra/scripts/capsule-zero-deploy`; `shellcheck infra/scripts/capsule-zero-deploy` |
| 2 | Tailscale action uses the documented OIDC inputs and a real pinned client release | Tailscale workload-identity docs (`oauth-client-id`, `audience`, `tags`, `id-token: write`); `gh api repos/tailscale/github-action/commits/306e68a486fd2350f2bfc3b19fcd143891a4a2d8`; `gh api repos/tailscale/tailscale/releases/tags/v1.98.9` |
| 3 | nginx config loads and preserves canonical API methods while rejecting abusive methods | Isolated nginx config test plus method probes: `PATCH` and `DELETE` reach the routed server (not `405`); `TRACE` returns `405` |
| 4 | Cloudflare serves the apex and `www` with strict HTTPS and expected security headers; an apex-only certificate fails closed | Read-only `curl` edge probes; live `openssl x509 -checkhost` for both names; deploy-wrapper syntax/static checks |
| 5 | Direct-origin web traffic and public SSH are unavailable | Read-only direct-origin TCP/HTTP probes time out or are denied; Cloudflare edge probes remain successful |
| 6 | Operator Tailscale SSH and live nginx configuration work | `tailscale ping cz`; read-only `ssh cz 'sudo nginx -t'`; repository-managed nginx files match the live host |
| 7 | Encrypted backup automation is scheduled and its restore path was proven before enablement | Read-only `systemctl status capsule-zero-backup.service`; `systemctl list-timers capsule-zero-backup.timer`; live operator restore-drill evidence recorded with the rollout |
| 8 | Active architecture and operator docs describe the deployed topology | Targeted drift scan across AGENTS/CLAUDE, constitution, ADR-001, active runtime specs, architecture summaries, backend docs, and devops runbooks |
| 9 | Repository validation passes | `git diff --check`; `node scripts/check-repo-baseline.mjs`; `node scripts/check-feature-memory.mjs --worktree` |
| 10 | Current PR head is merge-ready | PR #94 required checks `baseline-checks`, `guard`, `AI Review`, `test`, and `osv-scan` green; no unresolved blocking review thread; merge state clean |
