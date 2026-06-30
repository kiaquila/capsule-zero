# Tasks 026 — Dev Continuous Deployment Pipeline

## Tasks

- [x] Amend Constitution VII + CLAUDE.md/AGENTS.md/tests/README.md: TDD failing-test-first
      loop applies to application code only; infra/docs/support out of scope.
- [x] `.github/workflows/cd-dev.yml` — gate / build / deploy on push to `main` + dispatch.
- [x] `docker-compose.dev-server.yml` — isolated `capsule-zero-dev` project, web on 127.0.0.1:3001.
- [x] `docker-compose.yml` — publish prod web on 127.0.0.1:3000; gate in-docker nginx behind `docker-edge`.
- [x] `infra/nginx-host/` — host nginx vhosts (prod 3000, dev 3001) + shared snippet + README.
- [x] Host-nginx edge deployed on the droplet; prod cut over from in-docker nginx (live, 200).
- [x] Dev stack up on the droplet (web 127.0.0.1:3001); dev TLS cert issued; live `https://dev.capsulezero.app` → 200.
- [x] `docs_capsule_zero/project/devops/dev-cd-pipeline.md` — operator runbook (host nginx + cutover + cert).
- [ ] Operator one-time setup for the pipeline: `deploy` user + CI key, GitHub secrets,
      GHCR pull login, dev checkout owned by `deploy`. Until then dev serves a seed image.
- [ ] First green `main` run (post-merge): build → GHCR → deploy replaces the seed image.

## Process Memory

### Dead Ends

- **Build on the droplet (`git pull && docker compose build`).** Rejected: a small droplet
  running prod cannot also build a Next.js image without risking OOM/latency. CI builds; the
  droplet only pulls.
- **`docker/build-push-action` + `type=gha` cache.** Avoided in favor of raw `docker buildx`
  with a `type=registry` cache image — raw run-step buildx lacks the GitHub Actions cache
  runtime tokens `type=gha` needs, and pinning third-party action SHAs offline was error-prone.
- **`dorny/paths-filter` for the change gate.** Replaced with a plain `git diff
  --name-only before..sha` + `grep` allowlist (no external action SHA to verify). The grep
  consumes input via a here-string under `pipefail` so an early-match SIGPIPE can't false-skip.
- **Cloudflare + DNS-01 + in-docker nginx on 8443.** This was the first design and is fully
  reverted. Founder chose **no Cloudflare**: a single host (systemd) nginx terminates TLS for
  both domains and proxies plain HTTP to the containers. No origin-port tricks, no in-docker
  nginx, HTTP-01 webroot for certs.
- **`nginx 1.25 `http2 on;` directive.** Ubuntu ships nginx 1.24 → use `listen 443 ssl http2;`.
- **Renaming `docker-compose.dev.yml` → `docker-compose.local.yml`.** Rejected — diverges from
  the documented convention (ADR-001, phase-5 checklist) and the spec-024 plan that
  reintroduces that filename. The remote-dev file is `docker-compose.dev-server.yml` instead.

### Decisions

- **Single host nginx edge, no Cloudflare.** One systemd nginx terminates TLS for prod and
  dev and reverse-proxies to web containers on loopback (prod 3000, dev 3001). Keeps the
  auto-deploy path off the shared edge — deploys only recreate the dev web container.
- **Prod cutover** kept the in-docker nginx defined but profile-gated (`docker-edge`) for a
  one-command rollback (`docker start capsule-zero-nginx-1`); the swap window was ~1–2s.
- **Local dev keeps in-docker nginx in the default path.** `docker-compose.dev.yml` removes
  the base `docker-edge` profile from `nginx` so the documented local command still starts
  `nginx + web`; production compose remains web-only unless the rollback profile is enabled.
- **Deploy smoke validates the dev TLS hostname.** The workflow smokes the host nginx with
  `curl --resolve dev.capsulezero.app:443:127.0.0.1 https://dev.capsulezero.app/en` so a bad
  dev certificate, SNI route, or default vhost fails the deploy instead of being hidden by
  `curl -k`.
- **Image registry: GHCR.** Free for the private repo, native `GITHUB_TOKEN` push auth,
  SHA-immutable tags. Droplet pulls with a read-only `read:packages` token.
- **Dedicated dev checkout `/opt/capsule-zero-dev`** separate from prod's `/opt/capsule-zero`
  (prod bind-mounts nothing from git now, but isolation avoids any cross-impact).
- **Runbook creates the dev checkout directory as root before cloning.** `/opt` is root-owned
  on a standard droplet, so setup uses `sudo install -d -o deploy -g deploy` before the
  `deploy` user clones into `/opt/capsule-zero-dev`.
- **Change-gate allowlist, not ignore-list.** Docs/tests/`.specify` never deploy.
- **Immutable `sha-<gitsha>` tags** enable `workflow_dispatch` rollback; rollback also checks
  out the matching commit so compose config matches the image.
- **Secrets stay on the droplet / in GitHub secrets.** CI ships only the image ref over SSH.

### Known Issues

- The CD pipeline is not yet live: it needs the operator one-time setup (deploy user, GitHub
  secrets, GHCR pull login). Until the first run, dev serves a seed image (the local prod
  image retagged `ghcr.io/kiaquila/capsule-zero-web:dev`).
- A stale certbot deploy-hook (`reload-nginx.sh`, reloading the retired in-docker nginx) was
  removed during cutover; renewals now use `reload-host-nginx.sh` (`nginx -t && systemctl
  reload nginx`).
- When the Go API/worker land (spec 024), add them to `docker-compose.dev-server.yml`; the
  change-gate allowlist already covers `api/** worker/**`.
