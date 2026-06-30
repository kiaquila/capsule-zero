# Tasks 026 — Dev Continuous Deployment Pipeline

## Tasks

- [x] Amend Constitution VII + CLAUDE.md/AGENTS.md/tests/README.md: TDD failing-test-first
      loop applies to application code only; infra/docs/support out of scope.
- [x] `.github/workflows/cd-dev.yml` — gate / build / deploy on push to `main` + dispatch.
- [x] `docker-compose.dev-server.yml` — isolated `capsule-zero-dev` project (own nginx + web).
- [x] `infra/nginx/conf.d.dev-server/dev.capsulezero.conf` — dev vhost.
- [x] `docs_capsule_zero/project/devops/dev-cd-pipeline.md` — operator runbook.
- [ ] Operator one-time setup (off-repo): Cloudflare DNS + Origin Rule, `deploy` user + key,
      GHCR pull token, GitHub secrets, dev TLS cert. Tracked in the runbook.
- [ ] First green `main` run + dev smoke check (post-merge evidence for `plan.md`).

## Process Memory

### Dead Ends

- **Build on the droplet (`git pull && docker compose build`).** Rejected: a 4 GB / 2 vCPU
  droplet running the prod stack cannot also build a Next.js image without risking OOM and
  prod latency/downtime. CI builds; the droplet only pulls.
- **`docker/build-push-action` + `type=gha` cache.** Avoided in favor of raw `docker buildx`
  with a `type=registry` cache image. Reason: raw run-step buildx does not get the GitHub
  Actions cache runtime tokens (`ACTIONS_*`) that `type=gha` needs, and pinning third-party
  action SHAs offline was error-prone. Registry cache needs only `docker login` to GHCR.
- **`dorny/paths-filter` for the change gate.** Replaced with a plain `git diff
  --name-only event.before..sha` + `grep` allowlist — no external action SHA to pin/verify,
  and the push before/after range is exactly the merged commits.
- **HTTP-01 for the dev cert.** Rejected: prod nginx owns host `:80`, and Cloudflare proxies
  dev on a non-standard origin port (`8443`), so HTTP-01 origin validation is unreliable.
  DNS-01 via the Cloudflare plugin needs no inbound port.
- **Renaming `docker-compose.dev.yml` → `docker-compose.local.yml`.** Considered to reduce
  "dev" ambiguity; rejected. It diverges from the documented convention (ADR-001, phase-5
  entrance checklist) and the spec-024 plan that reintroduces that exact filename. The new
  remote-dev file is named `docker-compose.dev-server.yml` instead — unambiguous, zero churn.

### Decisions

- **Dev shares the droplet but is a separate compose project** (`capsule-zero-dev`) with its
  own nginx (`8443`), own cert, and dedicated checkout at `/opt/capsule-zero-dev` so dev
  deploys never mutate prod's `/opt/capsule-zero` bind-mounted config tree. Chosen by the
  founder for isolation without a second VM.
- **Image registry: GHCR.** Free for the private repo, native `GITHUB_TOKEN` auth in CI,
  SHA-immutable tags. Droplet pulls with a read-only `read:packages` token.
- **Change gate allowlist, not ignore-list.** Deploy only when `app/** web/** api/** worker/**
  infra/** docker-compose.yml docker-compose.dev-server.yml`, lockfiles, or the workflow
  itself change. Docs/tests/`.specify` never deploy.
- **Immutable `sha-<gitsha>` tags** enable `workflow_dispatch` rollback to any prior build
  without rebuilding.
- **Secrets stay on the droplet / in Cloudflare.** CI ships only the image ref over SSH; the
  dev `.env.dev`, GHCR pull token, and Cloudflare DNS token live on the host (AGENTS.md).

### Known Issues

- First deploy is a chicken-and-egg with TLS: nginx will not start without a cert in its
  mounted TLS directory. Mitigation in the runbook — bootstrap a self-signed cert in
  `/var/lib/capsule-zero-dev/tls`, keep Certbot's `/etc/letsencrypt/live/...` lineage
  clean, then copy the real DNS-01 cert into the nginx-facing directory and reload. DNS-01
  does not require the stack to be up.
- The smoke gate validates the **origin** (`127.0.0.1:8443` with the dev `Host`). End-to-end
  through Cloudflare depends on the operator having created the DNS record + Origin Rule;
  until then the public `dev.capsulezero.app` check in `plan.md` is deferred to post-setup.
- When the Go API/worker land (spec 024), they must be added to `docker-compose.dev-server.yml`
  and the change-gate allowlist already covers `api/** worker/**`.
