# Dev Continuous Deployment — Operator Runbook

Auto-deploy to the **dev** environment (`https://dev.capsulezero.app`) on every merge to
`main` that changes deploy-relevant code. Spec: `.specify/specs/026-dev-cd-pipeline/`.

## Architecture

A single **host (systemd) nginx** — installed via `apt`, **not** in Docker — is the sole TLS
edge on the droplet. There is **no Cloudflare**. It terminates TLS for both domains and
reverse-proxies plain HTTP to the web containers, which publish only on loopback:

```
Internet → host nginx :80/:443 (TLS: capsulezero.app + dev.capsulezero.app, separate certs)
   ├─ capsulezero.app     → http://127.0.0.1:3000   (prod web,  compose project capsule-zero)
   └─ dev.capsulezero.app → http://127.0.0.1:3001   (dev  web,  compose project capsule-zero-dev)
```

The containerized stacks have **no nginx of their own**. Host nginx vhosts are version-
controlled in `infra/nginx-host/` and installed on the droplet (see below). Routine app
deploys only recreate the dev web container behind a stable proxy target; host-nginx config
changes are installed explicitly with `nginx -t` before reload.

## How the pipeline works

1. Merge to `main` triggers `.github/workflows/cd-dev.yml`.
2. **gate** — deploys only if a deploy-relevant path changed (`app/** web/** api/** worker/**
   infra/** docker-compose.yml docker-compose.dev-server.yml`, lockfiles, the workflow
   itself). Docs/tests/`.specify`-only merges are skipped (green, no deploy).
3. **build** — `docker buildx` builds `app/Dockerfile` (`--target runner`) and pushes
   `ghcr.io/kiaquila/capsule-zero-web:sha-<gitsha>` plus a moving `:dev` tag to GHCR.
4. **deploy** — SSH to the droplet, `cd /opt/capsule-zero-dev`, `git checkout` the deployed
   SHA (current commit, or the SHA in `image_sha` for rollbacks), then
   `docker compose --env-file .env.dev -p capsule-zero-dev -f docker-compose.dev-server.yml
   pull web && up -d`,
   wait for `web` healthy, install/reload host nginx only when `infra/nginx-host/**` changed,
   smoke the prod edge after any shared nginx reload, then smoke `http://127.0.0.1:3001/en`,
   `/api/health`, plus the dev host-nginx edge.

## One-time operator setup

> The droplet is `137.184.205.153` (`cz`). DNS A records `capsulezero.app` and
> `dev.capsulezero.app` already point straight at it (no Cloudflare). All secrets stay on the
> droplet / in GitHub secrets — CI ships only the image ref over SSH.

### 1. Host nginx + the prod edge cutover (already performed; documented for reference / rebuild)

Install the host nginx and move the prod edge off the in-docker nginx onto it:

```bash
# Publish prod web on loopback and gate the in-docker nginx behind a profile:
#   docker-compose.yml -> web: ports ["127.0.0.1:3000:3000"]; nginx: profiles ["docker-edge"]
cd /opt/capsule-zero
docker compose up -d web                       # recreate web with the loopback port

apt-get install -y nginx                        # auto-start fails to bind :80 (docker holds it) — expected
rm -f /etc/nginx/sites-enabled/default
install -m 644 infra/nginx-host/00-capsule-zero.conf /etc/nginx/conf.d/00-capsule-zero.conf
install -m 644 infra/nginx-host/capsulezero.app.conf /etc/nginx/sites-available/capsulezero.app.conf
ln -sf /etc/nginx/sites-available/capsulezero.app.conf /etc/nginx/sites-enabled/
nginx -t

# Swap (brief downtime, ~1-2s):
docker compose -p capsule-zero stop nginx       # frees :80/:443
systemctl enable --now nginx                    # host nginx binds :80/:443
curl -fsS https://capsulezero.app/en >/dev/null && echo prod-ok
```

**Rollback** the prod edge to the in-docker nginx:

```bash
systemctl stop nginx
docker start capsule-zero-nginx-1     # or: docker compose -p capsule-zero --profile docker-edge up -d nginx
```

### 2. Deploy user + SSH access for CI

```bash
sudo adduser --disabled-password --gecos "" deploy
sudo usermod -aG docker deploy
sudo tee /etc/sudoers.d/capsule-zero-dev-deploy >/dev/null <<'EOF'
deploy ALL=(root) NOPASSWD: /usr/bin/install, /usr/bin/ln, /usr/bin/rm, /usr/sbin/nginx, /usr/bin/systemctl reload nginx
EOF
sudo chmod 440 /etc/sudoers.d/capsule-zero-dev-deploy
sudo visudo -cf /etc/sudoers.d/capsule-zero-dev-deploy
sudo -u deploy install -d -m 700 /home/deploy/.ssh
# append the CI deploy public key:
sudo -u deploy tee -a /home/deploy/.ssh/authorized_keys < ci_deploy_key.pub
sudo -u deploy chmod 600 /home/deploy/.ssh/authorized_keys
```

Generate the CI keypair (`ssh-keygen -t ed25519 -f ci_deploy_key -N ''`); the **private** key
becomes the GitHub secret `DEV_DEPLOY_SSH_KEY`, the public key goes into `authorized_keys`.
Capture the host key for `DEV_DEPLOY_KNOWN_HOSTS`:

```bash
ssh-keyscan -t ed25519 137.184.205.153
```

### 3. Dev git checkout + GHCR pull auth

The deploy step uses a dedicated dev checkout at `/opt/capsule-zero-dev` (never the prod
`/opt/capsule-zero`). Give the `deploy` user read-only repo access (GitHub **Settings →
Deploy keys**, write access unchecked) and a `read:packages` GHCR login:

```bash
# Trust github.com so the deploy user's non-interactive git works (host key verification):
sudo -u deploy bash -lc 'ssh-keyscan -t ed25519,rsa github.com >> ~/.ssh/known_hosts && sort -u ~/.ssh/known_hosts -o ~/.ssh/known_hosts'
sudo install -d -o deploy -g deploy -m 755 /opt/capsule-zero-dev
sudo -u deploy git clone git@github.com:kiaquila/capsule-zero.git /opt/capsule-zero-dev
sudo -u deploy tee /opt/capsule-zero-dev/.env.dev >/dev/null <<'EOF'
APP_BASE_URL=https://dev.capsulezero.app
CAPSULE_PROVIDER_MODE=supabase
SUPABASE_INTERNAL_URL=<supabase-internal-or-public-url>
NEXT_PUBLIC_SUPABASE_URL=<supabase-public-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<supabase-service-role-key>
SESSION_SIGNING_SECRET=<64-plus-random-characters>
EOF
sudo -u deploy chmod 600 /opt/capsule-zero-dev/.env.dev
sudo -u deploy bash -lc 'echo "<read:packages token>" | docker login ghcr.io -u kiaquila --password-stdin'
```

### 4. GitHub repository secrets

| Secret | Value |
| --- | --- |
| `DEV_DEPLOY_HOST` | `137.184.205.153` |
| `DEV_DEPLOY_USER` | `deploy` |
| `DEV_DEPLOY_SSH_KEY` | private CI SSH key (matches `authorized_keys`) |
| `DEV_DEPLOY_KNOWN_HOSTS` | `ssh-keyscan` output for the droplet |

`GITHUB_TOKEN` (built-in) authenticates the GHCR **push** from CI — no extra secret needed.
Optional hardening: scope these to a GitHub Environment `dev` and add `environment: dev` to
the deploy job.

### 5. Dev stack + TLS certificate (already performed; documented for rebuild)

```bash
cd /opt/capsule-zero-dev
docker compose --env-file .env.dev -p capsule-zero-dev -f docker-compose.dev-server.yml up -d   # web on 127.0.0.1:3001

# Issue the dev cert (HTTP-01 webroot; host nginx already serves /.well-known/acme-challenge):
certbot certonly --webroot -w /var/www/certbot -d dev.capsulezero.app --non-interactive --keep-until-expiring

# Enable the dev vhost now that its cert exists:
install -m 644 infra/nginx-host/dev.capsulezero.app.conf /etc/nginx/sites-available/dev.capsulezero.app.conf
ln -sf /etc/nginx/sites-available/dev.capsulezero.app.conf /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
curl -fsS https://dev.capsulezero.app/en >/dev/null && echo dev-ok
```

Renewals: certbot's systemd timer renews both certs; the deploy hook
`/etc/letsencrypt/renewal-hooks/deploy/reload-host-nginx.sh` (`nginx -t && systemctl reload
nginx`) makes a renewed cert take effect. Verify with `certbot renew --dry-run`.

## First deploy / verifying the pipeline

After steps 2–4, merge a code change to `main` or run **Actions → CD Dev → Run workflow**
(leave `image_sha` blank). The job builds, pushes to GHCR, and rolls the dev stack. Verify:

```bash
docker compose --env-file .env.dev -p capsule-zero-dev -f docker-compose.dev-server.yml ps   # web healthy
curl -fsS http://127.0.0.1:3001/en >/dev/null && echo origin-ok
curl -fsS http://127.0.0.1:3001/api/health >/dev/null && echo health-ok
curl -fsS https://dev.capsulezero.app/en >/dev/null && echo edge-ok
curl -fsS https://dev.capsulezero.app/api/health >/dev/null && echo edge-health-ok
```

Until the pipeline first runs, dev serves a seed image (the local prod image retagged
`ghcr.io/kiaquila/capsule-zero-web:dev`); the first pipeline run replaces it with a real
GHCR build.

## Rollback (dev app)

Every build is tagged immutably by commit SHA. Run **CD Dev** via **workflow_dispatch** with
`image_sha = sha-<previous-gitsha>` — it skips the build, checks out the matching commit, and
redeploys that image. List tags in **Packages → capsule-zero-web**.

## Notes

- Ubuntu ships nginx 1.24 — vhosts use `listen 443 ssl http2;` (not the 1.25+ `http2 on;`).
- When spec 024 adds the Go API / worker, declare them in `docker-compose.dev-server.yml`;
  the change-gate allowlist already covers `api/**` and `worker/**`.
- Do not confuse this with `docker-compose.dev.yml` (laptop/mkcert local dev,
  `capsulezero.local`).
