# Spec 033 — Production CD Activation (Hetzner migration, full-stack deploy on merge)

> **Operational hardening update (2026-07-22):** spec 047 supersedes this
> slice's original direct-DNS/public-SSH posture. The same CD pipeline now joins
> Tailscale through GitHub OIDC before SSH; Cloudflare fronts the apex + `www`;
> origin web ingress is Cloudflare-only; public TCP/22 is closed. This spec
> remains the source for the build-in-CI/pull-on-server deployment contract.

## Goal

Every merge to `main` that changes deploy-relevant code automatically builds the **web**
and **api** images in CI, pushes them to GHCR, and deploys the **full production stack**
(Postgres + Kratos + Go API + Next.js web behind the host-nginx edge) to
`https://capsulezero.app` on the new Hetzner server. Success criterion (founder,
2026-07-02): *the latest application is live on `capsulezero.app`, deployed through the
GitHub pipeline* — registration and login work end-to-end against the real backend.

**Context.** After PR #57 merged, auth on the deployed edges still returned 500: the dev
edge was web-only by design (spec 026) and the production stack had never been rolled out
— the old 458 MiB DigitalOcean droplet could not host it (the Sprint 0 resize was never
executed). The founder resolved this by (a) migrating hosting to a Hetzner CX23
(2 vCPU / 4 GB / 40 GB, Ubuntu 26.04) at `178.105.95.17`, and (b) **decommissioning the
dev environment entirely** — `dev.capsulezero.app` DNS is deleted; the product is
pre-launch with no users, so testing happens directly on production until a preview
environment is reintroduced.

## Scope

### In

- **One-time server provisioning (operator, performed 2026-07-02):** Docker + compose v2,
  2 G swap, ufw (22/80/443), host nginx + certbot with a fresh `capsulezero.app`
  Let's Encrypt lineage, unprivileged `deploy` user restricted to the root-owned sudo
  wrapper, root-owned `/opt/capsule-zero` checkout with read-only GitHub deploy key and
  `read:packages` GHCR login, root-owned `.env` with generated secrets
  (`deploy/compose.env.example` contract). Recorded in
  `docs_capsule_zero/project/devops/prod-cd-pipeline.md`.
- **`.github/workflows/cd-prod.yml`** (replaces `cd-dev.yml`): change-gate on
  deploy-relevant paths; buildx builds of `app/Dockerfile` (`--target runner`) and
  `api/Dockerfile`; push `ghcr.io/kiaquila/capsule-zero-{web,api}:sha-<gitsha>` + moving
  `:prod` tags; SSH deploy as `deploy` running only
  `/usr/local/sbin/capsule-zero-deploy`; `workflow_dispatch` rollback by `image_sha`
  within the current pinned-Kratos runtime epoch. Cross-runtime rollback is fail-closed
  because an older binary cannot safely reuse an already-upgraded auth schema.
- **`infra/scripts/capsule-zero-deploy`** (replaces `capsule-zero-dev-deploy`): validates
  both immutable image refs + SHA, updates `/opt/capsule-zero`, `pull web api` +
  `up -d --no-build` (never builds on the server), waits for `api` and `web` health,
  syncs `infra/nginx-host/**` with backup/rollback, smokes
  `http://127.0.0.1:3000/en`, `https://capsulezero.app/en`, and
  `https://capsulezero.app/api/health`.
- **Dev-environment retirement:** delete `docker-compose.dev-server.yml`,
  `infra/nginx-host/dev.capsulezero.app.conf`, the dev wrapper, and the dev CD workflow;
  `PROD_DEPLOY_*` GitHub secrets replace `DEV_DEPLOY_*`.
- **Host-nginx modernization** for Ubuntu 26.04 / nginx 1.28 (`http2 on;` directive; the
  distro-level `server_tokens` conflict documented in `infra/nginx-host/README.md`).
- **Docs actualization in the same change:** AGENTS.md (§8 dev-edge bullet, phase status,
  hosting rows, Sprint-0 follow-up), CLAUDE.md, constitution §V hosting,
  `prod-cd-pipeline.md` (new), `nginx-reverse-proxy.md` / `sprint-0-runtime-provisioning.md`
  labels, `infra/nginx-host/README.md`.

### Out (tracked as follow-ups in `tasks.md`)

- The deferred auth hardening set from spec 024 (throttle `whoami`/`logout`/`profile`,
  Argon2 `t≥2`, `openapi ↔ Go` contract guard, `profiles.email` UNIQUE + advisory-lock
  migrator, least-privilege DB role).
- Password recovery + email verification completion slice (Kratos flows stay disabled;
  `KRATOS_SMTP_CONNECTION_URI` holds a placeholder until Resend is configured — safe
  because the courier never sends while those flows are off).
- Reintroducing a preview/dev environment; Redis / Object Storage /
  observability phases of spec 024; wardrobe/capsule/catalog/billing domains on the Go API.
  The Cloudflare front-door was out of this original slice and later landed in spec 047.
- Decommissioning the old DigitalOcean droplet (operator decision once prod is verified).

## Negative Scenarios

- **Docs/tests-only merge does not deploy.** The gate job skips (green) when no
  deploy-relevant path changed.
- **A non-allowlisted image ref is rejected.** The wrapper refuses any argument that is
  not an immutable `ghcr.io/kiaquila/capsule-zero-{web,api}:sha-<40hex>` ref, and any SHA
  not reachable from `origin/main`.
- **A cross-Kratos-runtime rollback is rejected.** The workflow and deploy wrapper compare
  the pinned `kratos-migrate` image at current `origin/main` and the requested target;
  mismatched versions fail before the live stack changes. Such a recovery needs a
  separately approved restore of a database snapshot compatible with the target runtime.
- **Unhealthy deploy fails loudly.** If `api` or `web` never reaches `healthy`, the
  wrapper dumps service logs and exits non-zero — the workflow run goes red.
- **Bad nginx sync self-heals.** If the synced host-nginx config fails `nginx -t` or the
  post-reload smoke, the wrapper restores the previous config and reloads it.
- **Missing secret fails fast.** The compose `${VAR:?…}` contract aborts boot when a
  required secret is absent from `/opt/capsule-zero/.env`.

TDD waiver: this spec is entirely infrastructure/delivery wiring and docs — no
application-code behavior changes. Evidence is config validation, the live CD run, and
deployed-edge smokes per constitution §VII; the `test` check does not gate new tests here.
