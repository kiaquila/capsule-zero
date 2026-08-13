# Tasks 033 — Production CD Activation

## Tasks

### Server provisioning (operator, 2026-07-02)

- [x] Hetzner CX23 created (Ubuntu 26.04, `178.105.95.17`); DNS A `capsulezero.app` repointed; `dev.capsulezero.app` record deleted
- [x] Base system: docker.io + docker-compose-v2 + nginx 1.28 + certbot + git; 2 G swap; ufw 22/80/443
- [x] `deploy` user with fresh `capsule-zero-prod-ci` keypair; sudoers restricted to `/usr/local/sbin/capsule-zero-deploy`
- [x] Root-owned `/opt/capsule-zero` checkout (read-only GitHub deploy key) + GHCR `read:packages` login
- [x] Root-owned `/opt/capsule-zero/.env` with generated secrets (Resend URI is a placeholder — courier inert while recovery/verification are disabled)
- [x] Let's Encrypt cert for `capsulezero.app` (standalone issuance; webroot + `reload-host-nginx.sh` deploy hook for renewals)
- [x] Host nginx vhost installed; distro `server_tokens` conflict resolved (commented in `/etc/nginx/nginx.conf`)

### Repo changes (this PR)

- [x] `.github/workflows/cd-prod.yml` — two-image build + SSH deploy; replaces `cd-dev.yml`
- [x] `infra/scripts/capsule-zero-deploy` — prod wrapper (two image refs, full-stack up, `/api/health` smoke); replaces the dev wrapper
- [x] Delete `docker-compose.dev-server.yml` + `infra/nginx-host/dev.capsulezero.app.conf`
- [x] Modernize `infra/nginx-host/capsulezero.app.conf` for nginx 1.28 (`http2 on;`)
- [x] `docs_capsule_zero/project/devops/prod-cd-pipeline.md` (replaces `dev-cd-pipeline.md`); `infra/nginx-host/README.md` rewrite
- [x] Actualize AGENTS.md (§8, phase status, hosting, Sprint-0 rows), CLAUDE.md, constitution §V, `nginx-reverse-proxy.md`, `sprint-0-runtime-provisioning.md`
- [x] `PROD_DEPLOY_*` GitHub secrets set; first CD run green; prod smoke evidence attached (plan rows 3–9) — run [28602708611](https://github.com/kiaquila/capsule-zero/actions/runs/28602708611) + [evidence comment on PR #64](https://github.com/kiaquila/capsule-zero/pull/64#issuecomment-4868518412) (2026-07-02)

### Follow-ups (not this PR)

- [x] Auth hardening before real-provider QA (carried from spec 024 `tasks.md` Known Issues): throttle `whoami`/`logout`/`profile`; Kratos Argon2 `iterations: 2`; `openapi ↔ Go` contract guard; `profiles.email` UNIQUE + `pg_advisory_lock` migrator; least-privilege Postgres app role — delivered by `.specify/specs/034-auth-hardening/` (prod role rollout tracked there)
- [ ] Recovery + email verification completion slice (flow-aware `/auth` UI, Go endpoints, re-enable Kratos flows, real Resend SMTP + SPF/DKIM, re-expose exact `/self-service/*` paths)
- [ ] Decide the registration account-enumeration residual (verification-gated sign-up vs auto-login) inside the recovery/verification slice
- [ ] Decommission the old DigitalOcean droplet once prod is verified (data: nothing to migrate — it never ran the backend)
- [ ] Reintroduce a preview/dev environment when the team wants pre-prod isolation again (re-derive from spec 026 + this pipeline)
- [x] Cloudflare front-door — activated 2026-07-22 in spec 047 with apex +
  `www`, Full (strict) TLS, DNSSEC, Cloudflare-only origin ingress, and active
  real-IP restoration

## Process Memory

### Dead Ends

- **Deploying the backend to the old DigitalOcean droplet was investigated and abandoned.**
  The box ran 458 MiB RAM / 1 vCPU / 8.7 GB disk at 88% — the Sprint 0 resize
  (≥ 4 GB / 2 vCPU / 80 GB) was never executed, and two full stacks (dev + prod) could
  never fit. The founder chose a cheaper Hetzner CX23 over resizing DO.
- **An earlier draft of this spec (as `033-auth-full-activation`) planned wiring the
  backend into the dev edge first.** Obsoleted the same day: the founder deleted
  `dev.capsulezero.app` and decided to test on production directly (pre-launch, no users),
  so the dev-edge phases were dropped in favor of prod CD.

### Decisions

- **2026-08-13 PR #101 review fix: automated rollback is fenced to one Kratos runtime
  epoch.** The previous `workflow_dispatch` path could check out a pre-upgrade commit and
  run Kratos v1.3.1 against a database already migrated by v26.2.0. The shared
  `scripts/check-kratos-rollback-boundary.sh` now compares the exact pinned
  `kratos-migrate` image at current `origin/main` and the requested target. Both CD and
  the root-owned wrapper fail closed on a mismatch before Compose runs. Same-runtime app
  rollbacks remain available; a cross-runtime recovery requires a separately approved
  restore of a database snapshot compatible with the target runtime. Reuse check:
  `infra/scripts/capsule-zero-deploy` was extended for server-side enforcement, while a
  standalone checker was necessary so the GitHub workflow can enforce the same policy
  before SSH.
- **2026-07-02 hosting migrated DigitalOcean → Hetzner CX23; dev environment
  decommissioned.** Founder decision: cheaper capacity that actually clears the Phase-0
  gate (2 vCPU / 4 GB / 40 GB vs the unresized 458 MiB droplet), and a single production
  environment until launch — every merge to `main` deploys to `capsulezero.app`.
- **2026-07-02 the 40 GB included disk is sufficient; no Hetzner volume purchased.**
  Measured on the old box: the entire workload is ≈ 1.35 GB (images 1.01 GB deduped,
  containers 10 MB, build cache 327 MB). Budget on CX23: ≈ 8–10 GB used, ~30 GB free.
  Growth goes to object storage, not local disk. A network volume would also be slower
  for Postgres than local NVMe. The object-storage provider was later revised from
  DigitalOcean Spaces to Hetzner Object Storage on 2026-07-10 (spec 039).
- **2026-07-02 plain Ubuntu OS image over the Hetzner "Docker CE" app image.** Docker is
  installed from Ubuntu's own repos (`docker.io` + `docker-compose-v2` — same packages the
  old box ran); app images drift and carry pre-baked config that has to be reverse-engineered.
- **2026-07-02 prod deploys always `--no-build`.** The server pulls SHA-pinned GHCR images
  only; building on a 4 GB box competes with live services and bypasses CI provenance.
- **2026-07-02 a fresh `capsule-zero-prod-ci` SSH keypair + `PROD_DEPLOY_*` secrets**
  instead of reusing the dev keypair/secrets: the dev private key exists only inside
  GitHub secrets (unreadable), and clean naming survives a future dev-environment revival.
- **2026-07-02 GHCR pull auth and the GitHub read deploy key were copied from the old
  box** (same owner, same purpose) rather than minting new tokens — one less operator
  round-trip; rotate whenever desired.
- **2026-07-02 Kratos SMTP stays a syntactically-valid placeholder.** Recovery and
  verification flows are disabled this slice (spec 024 decision), so the courier never
  dials out; the compose `:?` guard still enforces the key's presence. Resend + SPF/DKIM
  land with the recovery/verification slice.
- **2026-07-02 Cloudflare front-door deferred to Stage 2.** Founder decision: v0.1 pre-launch
  runs direct DNS → host nginx (no proxy layer to debug while the stack is young). The
  realip/CF-ranges edge config already shipped stays inert, and the Cloudflare-IP-ranges
  refresh mechanism (spec 024 Known Issues hardening note) moves to the Stage-2 activation
  rather than pre-real-QA hardening.
- **2026-07-22 spec 047 supersedes the Cloudflare deferral and public deploy
  transport.** Cloudflare is active for the apex + `www`; the origin web
  firewall trusts only Cloudflare ranges. Public TCP/22 is closed and the
  GitHub-hosted deploy runner joins Tailscale through OIDC as an ephemeral
  `tag:ci` node before invoking the unchanged root-owned wrapper.
- **2026-07-02 nginx 1.28 (Ubuntu 26.04) required two edge adjustments:** the vhost moved
  to the modern `http2 on;` directive, and the distro's http-level `server_tokens build;`
  had to be commented out in `/etc/nginx/nginx.conf` because the shared snippet owns that
  directive (duplicate-directive boot failure otherwise).

- **2026-07-02 PR #65 Codex P2 ×2 (77bdf52 review):** (1) **the Cloudflare Stage-2
  deferral is now swept through every doc that prescribed Cloudflare in the active
  path**, not only AGENTS/constitution: `adr-001-stack.md` DNS row, spec 024 `spec.md`
  scope bullet + DNS constraint, `phase-5-entrance-checklist.md` server/DNS gates (also
  actualized DO→Hetzner there), and the `phase-4-council.md` status preamble supersedes
  DI-006 / DI-020 in those respects while the dated register keeps its 2026-06-27
  wording as history. (2) **plan.md rows 3–9 now carry the actual evidence in the
  Verification table itself** (run link, statuses, throttle results, dated) per the
  SENAR contract — the tasks.md checkbox alone was not the canonical evidence location.
- **2026-07-02 PR #65 Codex P2 ×2 (309353d review — second sweep pass):** the operator
  runbooks the first pass missed are actualized: `sprint-0-runtime-provisioning.md`
  (Cloudflare preconditions marked Stage 2, direct-DNS `A` record precondition, the
  "DNS and Cloudflare" bring-up step split into v0.1 direct DNS vs Stage-2 activation,
  "real Cloudflare from the first deploy" dropped from the posture line),
  `backend-docs.md` (front-door stack row + Phase-5 completion item), and
  `docker-compose-deploy.md` Ingress (direct DNS wording; realip bullet marked inert
  until Stage 2). The stale `DigitalOcean droplet ≥ 4 GB / 80 GB` host constraint in
  spec 024 `spec.md` is retargeted to the Hetzner CX23 gate (≥ 2 vCPU / 4 GB) in the
  same pass.

- **2026-07-02 PR #65 Codex P2 (9e7e5cb review — third pass, DO→Hetzner class):** the same
  sweep discipline applied to the retired DigitalOcean hosting claims: `adr-001-stack.md`
  Hosting row + founder-constraint bullet, spec 024 `spec.md` Goal line, `backend-docs.md`
  stack intro, `docker-compose-deploy.md` intro, `phase-4-council.md` constraint bullet +
  Sprint-0 row, `adr-007` context line, and `gsd-convergence-validation.md` operational-fit
  bullet now all state the Hetzner CX23 (or carry a dated inline supersession note) instead
  of prescribing the retired DO droplet / 80 GB gate.
- **2026-07-02 PR #65 Codex P2 (6e6e48b review — fourth pass):** the adr-001 "Why
  DigitalOcean Spaces and not Cloudflare R2" rationale rested on same-provider billing
  with DO hosting, which the Hetzner migration invalidated. Rewritten for the
  cross-provider topology: Spaces stays on its remaining merits (mature S3 API behind
  the ADR-003 storage port, built-in CDN, no new provider relationship — R2 would couple
  storage to Cloudflare before the Stage-2 front-door), with the Stage-2 activation or a
  real storage cost line item as the re-evaluation triggers. Superseded 2026-07-10 by
  spec 039: storage follows compute into Hetzner Object Storage.
- **2026-07-02 PR #65 Codex P2 (4d618b3 review — fifth pass):** the
  `docker-compose-deploy.md` First Start section listed `CF_DNS_API_TOKEN` (and other
  future-slice keys) under "Required keys at minimum", so a v0.1 operator would block
  bootstrap on a Stage-2 credential. The list is rewritten to state exactly the
  `${VAR:?…}`-guarded Phase-2 keys from `docker-compose.yml` as the minimum, with
  CF/Object Storage/Resend/mobile keys under an explicit "later-phase, not required for v0.1
  bootstrap" block.
- **2026-07-02 PR #65 Codex P2 (aba8f17 review — sixth pass):**
  `backend-stateful-slices-plan.md` still named Cloudflare "on the droplet" as the spec
  024 prerequisite for every backend slice — fixed to the Hetzner/direct-DNS reality.
  The same manual pass caught the ADR-003 "one provider for storage and compute"
  consequence (the adr-001 storage-rationale finding one file over) and the
  "production droplet" constraint wording in ADR-002/ADR-003. Generic "droplet" jargon
  (env-file phrasing etc.) is left alone — only provider/topology claims are in scope.
- **2026-07-02 PR #65 Codex P2 (d315dd7 review — seventh pass):** the adr-001 "Why
  Cloudflare and not nginx rate-limit alone" rationale and the "absorbs the noisy
  traffic floor" consequence still read as current protection — both now carry the
  Stage-2 framing plus the v0.1 direct-DNS tradeoff (host nginx `limit_req` + the Go
  limiter carry rate-limiting; the missing DDoS floor is an accepted pre-launch risk).
  `gsd-convergence-validation.md` gets the deferral note in its DNS/front-door decision
  row and a dated revision note after the founder-approval quote (the quote itself
  stays verbatim as the 2026-06-27 record).
- **2026-07-02 PR #65 Codex P2 (c4ccfd0 review — eighth pass):** the second copy of the
  "Cloudflare absorbs the noisy traffic floor" sentence — in the non-dated Accepted
  Architecture Summary of `phase-4-council.md` — gets the same Stage-2/direct-DNS
  qualifier its adr-001 twin received in the seventh pass.

### Known Issues

- **Production is the only environment.** Docs/tests-only merges skip deploy, but any
  deploy-relevant merge to `main` goes straight to `capsulezero.app`. Acceptable
  pre-launch (no users); revisit before commercial launch.
- **`KRATOS_SMTP_CONNECTION_URI` is a non-functional placeholder** until Resend is
  configured — fine while recovery/verification are disabled; becomes a hard blocker for
  the recovery/verification slice.
- The old DigitalOcean droplet still runs the retired Phase-1 web containers; it serves no
  traffic (DNS moved) and awaits decommission.
- `x-real-ip` / realip Cloudflare ranges are active. Keep the repository
  snapshot and both origin firewalls synchronized with Cloudflare's published
  IPv4/IPv6 ranges (spec 047 Known Issues).
- The GitHub `environment:` hardening (scoping `PROD_DEPLOY_*` to a protected environment)
  is optional and not configured; consider before launch.
