# Plan 026 — Dev Continuous Deployment Pipeline

## Approach

Build-in-CI, pull-on-droplet. GitHub Actions builds the web image and pushes it to GHCR; the
droplet only pulls a pre-built, SHA-pinned image and rolls the isolated `capsule-zero-dev`
compose project. The droplet never builds (it would compete with running services for
RAM/CPU on a small VM).

### Pipeline stages (`.github/workflows/cd-dev.yml`)

1. **gate** — on `push`, diff `github.event.before..github.sha`; set `run=true` only if a
   deploy-relevant path changed. On `workflow_dispatch`, `run=true`. Missing/zero `before`
   SHA → deploy to be safe.
2. **build** — `docker buildx` (`--target runner`) → push `sha-<gitsha>` + `:dev` to
   `ghcr.io/kiaquila/capsule-zero-web`, with registry-backed build cache. Skipped on a
   `workflow_dispatch` rollback that supplies an existing `image_sha`.
3. **deploy** — SSH to the droplet as the `deploy` user, `git checkout` the deployed SHA (to
   sync compose + nginx config), `export CAPSULE_WEB_IMAGE=<ref>`,
   `docker compose -p capsule-zero-dev -f docker-compose.dev-server.yml pull web && up -d`,
   reload dev nginx, wait for `web` healthy, smoke `https://127.0.0.1:8443/en` with the dev
   `Host` header.

### Dev stack topology (same droplet, separate project)

- `docker-compose.dev-server.yml` → project `capsule-zero-dev`, isolated network.
- `nginx` host bind `8443:443`; mounts the shared `nginx.conf` + `conf.d.dev-server/` + the
  host nginx-facing TLS copy directory (read-only). Internal port 80 (unpublished) serves the
  `/nginx-health` probe only.
- `web` runs the GHCR image (no `build:`), internal `:3000`.
- Cloudflare proxies `dev.capsulezero.app`; an Origin Rule rewrites the origin port to `8443`.
  Edge "Always Use HTTPS" handles the http→https redirect, so dev nginx needs no host `:80`.

### Dev TLS

Let's Encrypt **DNS-01** via the Cloudflare plugin (no open port needed; works behind the
Cloudflare proxy on a non-standard origin port and matches prod's LE posture). Certbot owns
the real lineage at `/etc/letsencrypt/live/dev.capsulezero.app/`; a deploy-hook copies the
current cert/key into `/var/lib/capsule-zero-dev/tls/`, which dev nginx mounts read-only.
First-deploy bootstrap uses a self-signed cert in that copy directory so nginx can start
without polluting Certbot's managed lineage (runbook).

## Verification

| Acceptance criterion (from spec) | Evidence |
| --- | --- |
| Workflow YAML is valid and jobs/conditions parse | `actionlint .github/workflows/cd-dev.yml` (or GitHub's own parse on push); job graph renders in the Actions run |
| Dev compose file is valid and self-contained | `CAPSULE_WEB_IMAGE=ghcr.io/kiaquila/capsule-zero-web:dev docker compose -p capsule-zero-dev -f docker-compose.dev-server.yml config` exits 0 |
| Dev nginx config is syntactically valid | `docker run --rm -v "$PWD/infra/nginx/nginx.conf:/etc/nginx/nginx.conf:ro" -v "$PWD/infra/nginx/conf.d.dev-server:/etc/nginx/conf.d:ro" -v /var/lib/capsule-zero-dev/tls:/etc/nginx/dev-tls:ro nginx:1.27-alpine nginx -t` on the droplet |
| Docs/tests-only merge does not deploy | `gate` job logs show `run=false` and `build`/`deploy` skipped on a docs-only commit; workflow run is green |
| Code merge builds + pushes a SHA-pinned image | Actions run shows `build` pushing `ghcr.io/kiaquila/capsule-zero-web:sha-<gitsha>`; tag visible in GHCR package versions |
| Deploy rolls the dev stack and proves health | `deploy` job log: `docker compose ps` all healthy + `smoke ok`; `https://dev.capsulezero.app/en` returns 200 through Cloudflare |
| A broken dev deploy does not touch prod | Prod `https://capsulezero.app/en` still 200 during/after a failed dev deploy (separate project, separate nginx on `:443`) |
| Rollback works | `workflow_dispatch` with a prior `image_sha` redeploys without rebuilding; dev serves the older SHA |
| Dev has its own TLS cert | `echo \| openssl s_client -connect dev.capsulezero.app:443 -servername dev.capsulezero.app 2>/dev/null \| openssl x509 -noout -subject` shows `CN=dev.capsulezero.app`, distinct from prod |
