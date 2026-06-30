# Dev Continuous Deployment — Operator Runbook

Auto-deploy to the **dev** environment (`https://dev.capsulezero.app`) on every merge to
`main` that changes deploy-relevant code. Spec: `.specify/specs/026-dev-cd-pipeline/`.

## How it works

1. Merge to `main` triggers `.github/workflows/cd-dev.yml`.
2. **gate** — deploys only if a deploy-relevant path changed (`app/** web/** api/** worker/**
   infra/** docker-compose.yml docker-compose.dev-server.yml`, lockfiles, the workflow
   itself). Docs/tests/`.specify`-only merges are skipped (green, no deploy).
3. **build** — `docker buildx` builds `app/Dockerfile` (`--target runner`) and pushes
   `ghcr.io/kiaquila/capsule-zero-web:sha-<gitsha>` plus a moving `:dev` tag to GHCR.
4. **deploy** — SSH to the droplet, sync the repo checkout to the deployed SHA, then
   `docker compose -p capsule-zero-dev -f docker-compose.dev-server.yml pull web && up -d`,
   reload dev nginx, wait for `web` healthy, and smoke-check the dev nginx origin.

Dev runs on the **same droplet** as prod, as the separate compose project `capsule-zero-dev`
with its **own nginx on host port 8443** and its **own TLS cert** — a broken dev deploy
cannot touch prod (project `capsule-zero`, nginx `:443`).

## One-time operator setup

All steps below run once. **No secret is ever passed to or stored in CI beyond the GitHub
secrets listed; the droplet's `.env.dev`, GHCR pull token, nginx-facing TLS key copy, and
Cloudflare DNS token live only on the host / in Cloudflare.**

### 1. Cloudflare DNS + origin port

- Add a proxied `A` record `dev.capsulezero.app` → droplet IP (orange cloud).
- Add an **Origin Rule**: when hostname equals `dev.capsulezero.app`, rewrite the
  **destination port** to `8443` (Cloudflare allows HTTPS origin ports 443/2053/2083/2087/
  2096/8443).
- SSL/TLS mode: **Full (strict)**. Enable **Always Use HTTPS** so the edge handles
  http→https (dev nginx publishes only 8443).

### 2. Deploy user on the droplet

```bash
sudo adduser --disabled-password --gecos "" deploy
sudo usermod -aG docker deploy
sudo -u deploy mkdir -p /home/deploy/.ssh && sudo -u deploy chmod 700 /home/deploy/.ssh
# add the deploy public key:
sudo -u deploy tee -a /home/deploy/.ssh/authorized_keys < deploy_key.pub
sudo -u deploy chmod 600 /home/deploy/.ssh/authorized_keys
```

Generate the keypair locally (`ssh-keygen -t ed25519 -f deploy_key -N ''`); the **private**
key goes into the GitHub secret `DEV_DEPLOY_SSH_KEY`, the public key into
`authorized_keys`. Capture the host key for `DEV_DEPLOY_KNOWN_HOSTS`:

```bash
ssh-keyscan -t ed25519 <droplet-ip-or-host>
```

### 3. Repo checkout on the droplet

The deploy step syncs config from a dedicated dev git checkout at `/opt/capsule-zero-dev`
(compose file + nginx vhosts). Do not reuse the production checkout at `/opt/capsule-zero`;
prod bind-mounts config from that tree, so dev deploys must never mutate it. Secrets stay out
of git.

Before cloning, give the droplet's `deploy` user read-only GitHub access for this repository.
Recommended: create a dedicated **repo deploy key** on the droplet and add its public key in
GitHub → repository **Settings → Deploy keys** with **Allow write access** unchecked:

```bash
sudo -u deploy ssh-keygen -t ed25519 \
  -f /home/deploy/.ssh/github_deploy_key \
  -N '' \
  -C 'capsule-zero-dev-deploy'

sudo -u deploy tee /home/deploy/.ssh/config >/dev/null <<'EOF'
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/github_deploy_key
  IdentitiesOnly yes
EOF
sudo -u deploy chmod 600 /home/deploy/.ssh/config

# Add this public key to GitHub as the read-only deploy key:
sudo -u deploy cat /home/deploy/.ssh/github_deploy_key.pub
```

After adding the deploy key in GitHub, verify repo access before cloning:

```bash
sudo -u deploy git ls-remote git@github.com:kiaquila/capsule-zero.git HEAD
```

```bash
sudo mkdir -p /opt/capsule-zero-dev && sudo chown deploy:deploy /opt/capsule-zero-dev
sudo -u deploy git clone git@github.com:kiaquila/capsule-zero.git /opt/capsule-zero-dev
# optional dev runtime env (gitignored):
sudo -u deploy tee /opt/capsule-zero-dev/.env.dev >/dev/null <<'EOF'
APP_BASE_URL=https://dev.capsulezero.app
EOF
```

### 4. GHCR pull auth on the droplet

Create a fine-grained PAT (or classic) with **`read:packages`** only, then:

```bash
sudo -u deploy bash -lc 'echo "<token>" | docker login ghcr.io -u kiaquila --password-stdin'
```

### 5. GitHub repository secrets

| Secret | Value |
| --- | --- |
| `DEV_DEPLOY_HOST` | droplet IP or hostname |
| `DEV_DEPLOY_USER` | `deploy` |
| `DEV_DEPLOY_SSH_KEY` | private SSH key (matches `authorized_keys`) |
| `DEV_DEPLOY_KNOWN_HOSTS` | output of `ssh-keyscan` for the droplet |

`GITHUB_TOKEN` (built-in) authenticates the GHCR push from CI — no extra secret needed.
Optional hardening: scope these to a GitHub **Environment** named `dev` and add the deploy
job an `environment: dev` for a protection rule / deployment history.

### 6. Dev TLS certificate

Install certbot + Cloudflare DNS plugin on the host and store a scoped Cloudflare API token
(Zone:DNS:Edit for the zone) at `/root/.secrets/cloudflare.ini` (chmod 600):

```ini
dns_cloudflare_api_token = <cloudflare-dns-edit-token>
```

The dev nginx reads cert files from `/var/lib/capsule-zero-dev/tls`, mounted into the
container as `/etc/nginx/dev-tls`. Certbot owns the real Let's Encrypt lineage under
`/etc/letsencrypt/live/dev.capsulezero.app`; do not place bootstrap files in that lineage or
Certbot may create a suffixed replacement lineage.

**Bootstrap (first deploy only).** nginx will not start without cert files, so seed a
self-signed placeholder in the nginx-facing copy directory before the first deploy:

```bash
sudo install -d -m 755 /var/lib/capsule-zero-dev/tls
sudo openssl req -x509 -newkey rsa:2048 -nodes -days 2 \
  -keyout /var/lib/capsule-zero-dev/tls/privkey.pem \
  -out   /var/lib/capsule-zero-dev/tls/fullchain.pem \
  -subj "/CN=dev.capsulezero.app"
sudo chmod 600 /var/lib/capsule-zero-dev/tls/privkey.pem
sudo chmod 644 /var/lib/capsule-zero-dev/tls/fullchain.pem
```

Renewal is handled by the host certbot timer. Add a deploy-hook that installs the issued or
renewed cert into the nginx-facing copy directory, validates nginx, and reloads it:

```bash
# /etc/letsencrypt/renewal-hooks/deploy/install-dev-nginx-cert.sh  (chmod +x)
#!/usr/bin/env bash
set -euo pipefail

install -d -m 755 /var/lib/capsule-zero-dev/tls
install -m 644 /etc/letsencrypt/live/dev.capsulezero.app/fullchain.pem \
  /var/lib/capsule-zero-dev/tls/fullchain.pem
install -m 600 /etc/letsencrypt/live/dev.capsulezero.app/privkey.pem \
  /var/lib/capsule-zero-dev/tls/privkey.pem

cd /opt/capsule-zero-dev
COMPOSE="docker compose -p capsule-zero-dev -f docker-compose.dev-server.yml"
nginx_cid="$($COMPOSE ps -q nginx || true)"
nginx_running="$(docker inspect -f '{{.State.Running}}' "$nginx_cid" 2>/dev/null || echo false)"
if [ "$nginx_running" = "true" ]; then
  $COMPOSE exec -T nginx nginx -t
  $COMPOSE exec -T nginx nginx -s reload
else
  echo "dev nginx is not running; installed cert copy for the next deploy"
fi
```

Then issue the real Let's Encrypt cert into Certbot's normal lineage (DNS-01 needs no open
port and works behind the Cloudflare proxy on the 8443 origin):

```bash
sudo certbot certonly --dns-cloudflare \
  --dns-cloudflare-credentials /root/.secrets/cloudflare.ini \
  -d dev.capsulezero.app
```

Immediately install that real cert into the nginx-facing copy directory. This step is
mandatory for Cloudflare **Full (strict)**; otherwise dev nginx keeps serving the self-signed
bootstrap cert and the public edge check fails:

```bash
sudo /etc/letsencrypt/renewal-hooks/deploy/install-dev-nginx-cert.sh
```

## First deploy

After steps 1–6, either merge a code change to `main` or run the workflow manually
(**Actions → CD Dev → Run workflow**, leave `image_sha` blank). Verify:

```bash
# on the droplet
docker compose -p capsule-zero-dev -f docker-compose.dev-server.yml ps   # all healthy
curl -fsS -k -H 'Host: dev.capsulezero.app' https://127.0.0.1:8443/en >/dev/null && echo origin-ok
# public, once Cloudflare DNS + Origin Rule are live
curl -fsS https://dev.capsulezero.app/en >/dev/null && echo edge-ok
```

## Rollback

Every build is tagged immutably by commit SHA. To roll back, run **CD Dev** via
**workflow_dispatch** with `image_sha = sha-<previous-gitsha>` — it skips the build and
redeploys that image. List available tags in the repo's **Packages → capsule-zero-web**.

## Notes

- The smoke gate validates the **origin** (`127.0.0.1:8443` with the dev `Host`), so it does
  not depend on Cloudflare/public DNS being live.
- When spec 024 adds the Go API / worker, declare them in `docker-compose.dev-server.yml`;
  the change-gate allowlist already covers `api/**` and `worker/**`.
- Do **not** confuse this with `docker-compose.dev.yml` (laptop/mkcert local dev,
  `capsulezero.local`).
