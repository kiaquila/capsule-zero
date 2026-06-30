# Plan 026 — Dev Continuous Deployment Pipeline

## Approach

Build-in-CI, pull-on-droplet. GitHub Actions builds the web image and pushes it to GHCR; the
droplet only pulls a pre-built, SHA-pinned image and rolls the isolated `capsule-zero-dev`
compose project. The droplet never builds (it would compete with running services for
RAM/CPU on a small VM).

A single **host (systemd) nginx** is the sole TLS edge for both prod and dev (no Cloudflare,
no in-docker nginx). It proxies plain HTTP to web containers published on loopback. This
keeps the auto-deploy path off the shared edge entirely: deploys only recreate the dev web
container behind a stable proxy target.

### Pipeline stages (`.github/workflows/cd-dev.yml`)

1. **gate** — on `push`, diff `github.event.before..github.sha`; set `run=true` only if a
   deploy-relevant path changed. On `workflow_dispatch`, `run=true`. Missing/zero `before`
   SHA → deploy to be safe.
2. **build** — `docker buildx` (`--target runner`) → push `sha-<gitsha>` + `:dev` to
   `ghcr.io/kiaquila/capsule-zero-web`, with registry-backed build cache. Skipped on a
   `workflow_dispatch` rollback that supplies an existing `image_sha`.
3. **deploy** — SSH as the `deploy` user, `cd /opt/capsule-zero-dev` (dedicated dev checkout,
   separate from prod's `/opt/capsule-zero`), `git checkout` the deployed SHA (current commit
   for normal deploys, the SHA embedded in `image_sha` for rollbacks), `export
   CAPSULE_WEB_IMAGE=<ref>`, `docker compose -p capsule-zero-dev -f docker-compose.dev-server.yml
   pull web && up -d`, wait for `web` healthy, smoke `http://127.0.0.1:3001/en` and the
   host-nginx TLS edge via `curl --resolve dev.capsulezero.app:443:127.0.0.1 ...`.

### Edge topology (same droplet)

```
Internet → host nginx :80/:443 (TLS: capsulezero.app + dev.capsulezero.app, separate certs)
   ├─ capsulezero.app     → http://127.0.0.1:3000   (prod web)
   └─ dev.capsulezero.app → http://127.0.0.1:3001   (dev web)
```

- `docker-compose.yml` (prod): web published on `127.0.0.1:3000`; the in-docker nginx is
  gated behind the `docker-edge` profile (rollback only).
- `docker-compose.dev-server.yml`: `web` only, published on `127.0.0.1:3001`, project
  `capsule-zero-dev`.
- `infra/nginx-host/`: the host nginx vhosts + shared http snippet, installed per the runbook.

### Dev TLS

Let's Encrypt **HTTP-01 webroot** via the host certbot (`/var/www/certbot`, served by the
host nginx) — no Cloudflare, dev DNS already points at the droplet. Cert lives at
`/etc/letsencrypt/live/dev.capsulezero.app/`, a separate lineage from prod. Renewal via the
certbot systemd timer; a deploy-hook (`reload-host-nginx.sh`) runs `nginx -t && systemctl
reload nginx` so renewed certs take effect.

## Verification

| Acceptance criterion (from spec) | Evidence |
| --- | --- |
| Workflow YAML is valid and jobs/conditions parse | `actionlint .github/workflows/cd-dev.yml` → exit 0 |
| Dev compose file is valid and self-contained | `CAPSULE_WEB_IMAGE=… docker compose -p capsule-zero-dev -f docker-compose.dev-server.yml config` exits 0 |
| Prod compose still valid; nginx gated out of default set | `docker compose -f docker-compose.yml config --services` → `web` only; `--profile docker-edge` → `web` + `nginx` |
| Local dev compose still starts the laptop nginx by default | `docker compose -f docker-compose.yml -f docker-compose.dev.yml config --services` → `web`, `nginx` |
| Host nginx config is syntactically valid | `nginx -t` on the droplet → "syntax is ok / test is successful" (done) |
| Docs/tests-only merge does not deploy | `gate` job logs show `run=false` and `build`/`deploy` skipped on a docs-only commit; workflow run is green |
| Code merge builds + pushes a SHA-pinned image | Actions run shows `build` pushing `ghcr.io/kiaquila/capsule-zero-web:sha-<gitsha>`; tag visible in GHCR |
| Deploy rolls the dev stack and proves health | `deploy` job log: `docker compose ps` healthy + `smoke ok`; workflow smokes `http://127.0.0.1:3001/en` plus `curl --resolve dev.capsulezero.app:443:127.0.0.1 https://dev.capsulezero.app/en`; verified live: `https://dev.capsulezero.app/en` → **HTTP 200** |
| Prod unaffected by the dev edge cutover | verified live: `https://capsulezero.app/en` → **HTTP 200** after the swap; rollback path documented |
| Rollback works | `workflow_dispatch` with a prior `image_sha` redeploys without rebuilding; deploy checks out the matching SHA |
| Dev has its own TLS cert | verified live: `openssl s_client -connect dev.capsulezero.app:443` → `CN=dev.capsulezero.app`, distinct lineage/expiry from `CN=capsulezero.app` |
