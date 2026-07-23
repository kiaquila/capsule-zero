# /infra/nginx-host — Host (systemd) nginx edge

A single **host-level** nginx (installed via `apt`, not in Docker) is the authenticated
TLS origin behind Cloudflare on the production server (Hetzner Cloud). It terminates TLS
for `capsulezero.app` and `www.capsulezero.app`, restores the visitor address only from
Cloudflare's trusted proxy ranges, and reverse-proxies plain HTTP to the container ports
published on loopback by the `capsule-zero` compose project:

| Path | Upstream | Service |
| --- | --- | --- |
| `/` | `http://127.0.0.1:3000` | `web` (Next.js) |
| `/api/*` | `http://127.0.0.1:8080` | `api` (Go monolith) |
| `/self-service/methods/oidc/callback/google` (exact) | `http://127.0.0.1:4433` | `kratos` — Google OIDC callback, the only exposed Kratos path (spec 037) |
| `/self-service/*`, `/sessions/*` | `404` | Kratos public is otherwise not exposed at the edge |

There is **no in-Docker nginx** — the container stack only publishes its ports on
loopback. Cloudflare proxying, Full (strict) TLS, DNSSEC, WAF/DDoS defaults, and an
origin firewall allowlist protect the public edge. A Cloudflare rate-limiting rule blocks
an IP for 10 seconds after more than 10 `POST` requests to `/api/auth/*` in 10 seconds;
`/api/auth/logout` is excluded. Origin nginx and the API retain the stricter sustained
authentication limit of 10 requests per minute. Bot Fight Mode is deliberately disabled:
on the Free plan it cannot be scoped or bypassed and challenged the API health monitor.
The origin certificate is issued by host `certbot`; renewals traverse Cloudflare and
reload nginx via the deploy hook
`/etc/letsencrypt/renewal-hooks/deploy/reload-host-nginx.sh`.
Before the dual-host vhost is installed, `capsule-zero-deploy` verifies that the live
certificate matches both `capsulezero.app` and `www.capsulezero.app`. A missing or
apex-only certificate fails the host-nginx sync and activates the transactional rollback
instead of publishing an invalid `www` TLS endpoint.

The former `dev.capsulezero.app` edge was decommissioned on 2026-07-02 with the Hetzner
migration — every merge to `main` deploys straight to production via
`.github/workflows/cd-prod.yml`.

## Install / update

Routine updates are applied automatically by the deploy wrapper
(`infra/scripts/capsule-zero-deploy`) whenever `infra/nginx-host/**` changed since the last
successful sync. Manual install:

```bash
sudo install -d -m 755 /etc/nginx/snippets
sudo install -m 644 infra/nginx-host/00-capsule-zero.conf /etc/nginx/conf.d/00-capsule-zero.conf
sudo install -m 644 infra/nginx-host/00-cz-hardening.conf /etc/nginx/conf.d/00-cz-hardening.conf
sudo install -m 644 infra/nginx-host/cz-request-guard.conf /etc/nginx/snippets/cz-request-guard.conf
sudo install -m 644 infra/nginx-host/00-default-deny.conf /etc/nginx/sites-available/00-default-deny.conf
sudo install -m 644 infra/nginx-host/capsulezero.app.conf /etc/nginx/sites-available/capsulezero.app.conf
sudo ln -sf /etc/nginx/sites-available/00-default-deny.conf /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/capsulezero.app.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

Full operator procedure (server provisioning, cert issuance, CD wiring):
`docs_capsule_zero/project/devops/prod-cd-pipeline.md`.

> Ubuntu 26.04 ships nginx 1.28 — the vhost uses the modern `http2 on;` directive. The
> distro `nginx.conf` sets `server_tokens` at http level; comment it out there — the
> shared snippet `00-capsule-zero.conf` owns that directive.
