# /infra/nginx-host — Host (systemd) nginx edge

A single **host-level** nginx (installed via `apt`, not in Docker) is the sole TLS edge on
the production server (Hetzner Cloud). It terminates TLS for `capsulezero.app` and
reverse-proxies plain HTTP to the container ports published on loopback by the
`capsule-zero` compose project:

| Path | Upstream | Service |
| --- | --- | --- |
| `/` | `http://127.0.0.1:3000` | `web` (Next.js) |
| `/api/*` | `http://127.0.0.1:8080` | `api` (Go monolith) |
| `/self-service/*`, `/sessions/*` | `404` | Kratos public is not exposed at the edge |

There is **no Cloudflare** and **no in-Docker nginx** — the container stack only publishes
its ports on loopback. The cert is issued by host `certbot`; renewals reload nginx via the
deploy hook `/etc/letsencrypt/renewal-hooks/deploy/reload-host-nginx.sh`.

The former `dev.capsulezero.app` edge was decommissioned on 2026-07-02 with the Hetzner
migration — every merge to `main` deploys straight to production via
`.github/workflows/cd-prod.yml`.

## Install / update

Routine updates are applied automatically by the deploy wrapper
(`infra/scripts/capsule-zero-deploy`) whenever `infra/nginx-host/**` changed since the last
successful sync. Manual install:

```bash
sudo install -m 644 infra/nginx-host/00-capsule-zero.conf /etc/nginx/conf.d/00-capsule-zero.conf
sudo install -m 644 infra/nginx-host/capsulezero.app.conf /etc/nginx/sites-available/capsulezero.app.conf
sudo ln -sf /etc/nginx/sites-available/capsulezero.app.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

Full operator procedure (server provisioning, cert issuance, CD wiring):
`docs_capsule_zero/project/devops/prod-cd-pipeline.md`.

> Ubuntu 26.04 ships nginx 1.28 — the vhost uses the modern `http2 on;` directive. The
> distro `nginx.conf` sets `server_tokens` at http level; comment it out there — the
> shared snippet `00-capsule-zero.conf` owns that directive.
