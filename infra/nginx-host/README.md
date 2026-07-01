# /infra/nginx-host — Host (systemd) nginx edge

A single **host-level** nginx (installed via `apt`, not in Docker) is the sole TLS edge on
the droplet. It terminates TLS for both `capsulezero.app` and `dev.capsulezero.app` and
reverse-proxies plain HTTP to the published container ports:

| Host | Upstream | Compose project |
| --- | --- | --- |
| `capsulezero.app` | `http://127.0.0.1:3000` | `capsule-zero` (prod) |
| `dev.capsulezero.app` | `http://127.0.0.1:3001` | `capsule-zero-dev` (dev) |

There is **no Cloudflare** and **no in-Docker nginx** — the container stacks only publish
their web port on loopback. Certs are issued by host `certbot` (HTTP-01 webroot via
`/var/www/certbot`), each domain its own Let's Encrypt lineage.

## Install / update

```bash
sudo install -m 644 infra/nginx-host/00-capsule-zero.conf      /etc/nginx/conf.d/00-capsule-zero.conf
sudo install -m 644 infra/nginx-host/capsulezero.app.conf      /etc/nginx/sites-available/capsulezero.app.conf
sudo install -m 644 infra/nginx-host/dev.capsulezero.app.conf  /etc/nginx/sites-available/dev.capsulezero.app.conf
sudo ln -sf /etc/nginx/sites-available/capsulezero.app.conf     /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/dev.capsulezero.app.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

Full operator procedure (first install, the prod cutover, cert issuance):
`docs_capsule_zero/project/devops/dev-cd-pipeline.md`.

> Ubuntu ships nginx 1.24 — use `listen 443 ssl http2;` (not the 1.25+ `http2 on;`).
