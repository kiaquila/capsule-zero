# Production Continuous Deployment — Operator Runbook

Auto-deploy to **production** (`https://capsulezero.app`) on every merge to `main` that
changes deploy-relevant code. Spec: `.specify/specs/033-prod-cd-activation/`.

> **There is no separate dev environment.** `dev.capsulezero.app` (spec 026) was
> decommissioned on 2026-07-02 together with the DigitalOcean → Hetzner migration: its DNS
> record is deleted and the dev compose project no longer exists. Until a preview
> environment is reintroduced, every merge to `main` lands on production directly — the
> app is pre-launch and has no production users.

## Architecture

The production server is a **Hetzner Cloud CX23** (2 vCPU / 4 GB / 40 GB, Ubuntu 26.04) at
`178.105.95.17` (`ssh cz`). A single **host (systemd) nginx** — installed via `apt`, not in
Docker — is the sole TLS edge. There is **no Cloudflare**; DNS A records point straight at
the server. Containers publish only on loopback:

```
Internet → host nginx :80/:443 (TLS: capsulezero.app)
   ├─ /                              → http://127.0.0.1:3000  (web,  Next.js)
   ├─ /api/*                         → http://127.0.0.1:8080  (api,  Go monolith;
   │                                    limit_req on /api/auth/(registration|login|recovery))
   └─ /self-service/*, /sessions/*   → 404  (Kratos public is never exposed at the edge)

compose project `capsule-zero` (root docker-compose.yml):
   web → api:8080 → kratos:4433/4434 + postgres:5432   (internal network only)
```

Host nginx vhosts are version-controlled in `infra/nginx-host/` and synced by the deploy
wrapper when they change. The in-repo Docker nginx (`infra/nginx/`) stays a profile-gated
rollback path (`--profile docker-edge`) and is not used in normal operation.

## How the pipeline works

1. Merge to `main` triggers `.github/workflows/cd-prod.yml`.
2. **gate** — deploys only if a deploy-relevant path changed (`app/** api/** worker/**
   infra/** docker-compose.yml`, lockfiles, the workflow itself). Docs/tests/`.specify`-only
   merges are skipped (green, no deploy).
3. **build** — `docker buildx` builds `app/Dockerfile` (`--target runner`) and
   `api/Dockerfile`, pushes `ghcr.io/kiaquila/capsule-zero-web:sha-<gitsha>` and
   `ghcr.io/kiaquila/capsule-zero-api:sha-<gitsha>` plus moving `:prod` tags to GHCR.
4. **deploy** — SSH to the server as the unprivileged `deploy` user, then run the
   root-owned wrapper
   `/usr/local/sbin/capsule-zero-deploy <web-image> <api-image> <sha> <sync-nginx>`.
   The wrapper validates the immutable image refs and SHA, updates the root-owned
   `/opt/capsule-zero` checkout, runs
   `docker compose --env-file .env -p capsule-zero -f docker-compose.yml pull web api &&
   up -d --no-build` (never builds on the server), waits for `api` and `web` healthchecks
   (generous timeouts — first boot runs Postgres init + Kratos migrations), installs/reloads
   host nginx only when `infra/nginx-host/**` changed since the last successful sync marker
   (`/var/lib/capsule-zero/last-host-nginx-sync-sha`), rolls nginx back to its previous
   config if the post-reload smoke fails, and reports success only after
   `http://127.0.0.1:3000/en`, `https://capsulezero.app/en`, and
   `https://capsulezero.app/api/health` all pass.

## One-time operator setup (performed 2026-07-02; documented for rebuild)

> All secrets stay on the server / in GitHub secrets — CI ships only image refs over SSH.

### 1. Base system

```bash
apt-get update && apt-get install -y docker.io docker-compose-v2 nginx certbot git ufw
# 2G swap (the box ships with none)
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo "/swapfile none swap sw 0 0" >> /etc/fstab
# firewall
ufw allow OpenSSH && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable
```

### 2. Deploy user + SSH access for CI

```bash
adduser --disabled-password --gecos "" deploy
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
# append the CI deploy public key (keypair generated fresh for prod CD):
echo "<capsule-zero-prod-ci public key>" > /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys && chmod 600 /home/deploy/.ssh/authorized_keys
```

Do **not** add `deploy` to the `docker` group and do **not** grant broad passwordless
sudo. CI may run only the root-owned deployment wrapper:

```bash
install -m 755 -o root -g root infra/scripts/capsule-zero-deploy /usr/local/sbin/capsule-zero-deploy
tee /etc/sudoers.d/capsule-zero-deploy >/dev/null <<'EOF'
deploy ALL=(root) NOPASSWD: /usr/local/sbin/capsule-zero-deploy
EOF
chmod 440 /etc/sudoers.d/capsule-zero-deploy
visudo -cf /etc/sudoers.d/capsule-zero-deploy
```

When `infra/scripts/capsule-zero-deploy` changes in a future PR, update the installed
`/usr/local/sbin/capsule-zero-deploy` copy as root before relying on that change in CD.

### 3. Root-owned checkout + GHCR pull auth + runtime env

Keep the checkout root-owned so a leaked CI SSH key cannot modify what the sudo wrapper
executes. Root has a read-only GitHub deploy key and a `read:packages` GHCR login:

```bash
install -m 600 github_deploy_key /root/.ssh/capsule-zero-github
ssh-keyscan -t ed25519,rsa github.com >> /root/.ssh/known_hosts
GIT_SSH_COMMAND='ssh -i /root/.ssh/capsule-zero-github -o IdentitiesOnly=yes' \
  git clone git@github.com:kiaquila/capsule-zero.git /opt/capsule-zero
git -C /opt/capsule-zero config core.sshCommand 'ssh -i /root/.ssh/capsule-zero-github -o IdentitiesOnly=yes'
echo "<read:packages token>" | docker login ghcr.io -u kiaquila --password-stdin
```

Create `/opt/capsule-zero/.env` (root-owned, mode 600) from the
`deploy/compose.env.example` contract with real random secrets (`openssl rand -hex 24` for
passwords; `SECRETS_CIPHER_0` must be exactly 32 characters — `openssl rand -hex 16`).
Note: until Resend is configured, `KRATOS_SMTP_CONNECTION_URI` holds a syntactically valid
placeholder — safe because the recovery/verification flows are disabled this slice, so the
courier never sends (tracked in spec 033 Known Issues).

### 4. TLS certificate + host nginx

```bash
systemctl stop nginx
certbot certonly --standalone -d capsulezero.app --non-interactive --agree-tos -m <email>
install -d -m 755 /var/www/certbot
install -d -m 755 /etc/letsencrypt/renewal-hooks/deploy
printf '#!/bin/sh\nnginx -t && systemctl reload nginx\n' > /etc/letsencrypt/renewal-hooks/deploy/reload-host-nginx.sh
chmod 755 /etc/letsencrypt/renewal-hooks/deploy/reload-host-nginx.sh
install -m 644 /opt/capsule-zero/infra/nginx-host/00-capsule-zero.conf /etc/nginx/conf.d/00-capsule-zero.conf
install -m 644 /opt/capsule-zero/infra/nginx-host/capsulezero.app.conf /etc/nginx/sites-available/capsulezero.app.conf
ln -sf /etc/nginx/sites-available/capsulezero.app.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
# Ubuntu 26.04 nginx.conf sets `server_tokens build;` at http level — comment it out;
# the shared snippet 00-capsule-zero.conf owns that directive:
sed -i 's|^\(\s*\)server_tokens .*;|\1# server_tokens (managed by capsule-zero conf.d snippet)|' /etc/nginx/nginx.conf
nginx -t && systemctl enable --now nginx && systemctl reload nginx
```

Renewals: certbot's systemd timer + the deploy hook above. Verify with
`certbot renew --dry-run`.

### 5. GitHub repository secrets

| Secret                    | Value                                          |
| ------------------------- | ---------------------------------------------- |
| `PROD_DEPLOY_HOST`        | `178.105.95.17`                                |
| `PROD_DEPLOY_USER`        | `deploy`                                       |
| `PROD_DEPLOY_SSH_KEY`     | private CI SSH key (matches `authorized_keys`) |
| `PROD_DEPLOY_KNOWN_HOSTS` | `ssh-keyscan -t ed25519 178.105.95.17` output  |

`GITHUB_TOKEN` (built-in) authenticates the GHCR **push** from CI — no extra secret needed.
The legacy `DEV_DEPLOY_*` secrets are retired with the dev environment.

## First deploy / verifying the pipeline

Merge a code change to `main` or run **Actions → CD Prod → Run workflow** (leave
`image_sha` blank). Verify on the server:

```bash
docker compose --env-file .env -p capsule-zero -f docker-compose.yml ps   # all healthy
curl -fsS https://capsulezero.app/en >/dev/null && echo edge-ok
curl -fsS https://capsulezero.app/api/health && echo api-ok
```

## Rollback

Every build is tagged immutably by commit SHA. Run **CD Prod** via **workflow_dispatch**
with `image_sha = sha-<previous-gitsha>` — it skips the build, checks out the matching
commit, and redeploys those images (host-nginx sync is skipped on rollback). List tags in
**Packages → capsule-zero-web / capsule-zero-api**.

## Notes

- The server never builds images (RAM/CPU contention + CI provenance); the wrapper always
  passes `--no-build`.
- Postgres data lives in the named volume `capsule-zero_pgdata`; images can be recreated
  freely without touching it. Nightly `pg_dump` backups land with spec 024 Phase 5.
- Do not confuse the production pipeline with `docker-compose.dev.yml` — that override is
  laptop-only local development (mkcert, `capsulezero.local`, MailHog).
