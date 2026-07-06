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
   `ghcr.io/kiaquila/capsule-zero-api:sha-<gitsha>` plus moving `:prod` tags to GHCR. Both
   builds get `--build-arg GIT_SHA=<gitsha>` (api also `BUILD_TIME`): the api binary is
   stamped via `-ldflags -X main.commit/main.buildTime` and both images set the OCI
   `org.opencontainers.image.revision` label (spec 036).
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
5. **verify (spec 036)** — the `deploy` job runs under a job-level
   `environment: production`, so GitHub records a **Deployment** for the merged commit
   (visible in the repo's Environments widget and the **Deployments** page). A final
   *Verify live release* step polls `https://capsulezero.app/api/health` and compares its
   `commit` field to the deployed SHA: a concrete mismatch fails the job (the production
   deployment is marked *failure*), so an active production deployment means prod was
   verified against the running server — not merely that `compose up` returned 0. An
   `"unknown"` commit is tolerated (warning, defer to the wrapper's own `/api/health`
   smoke) **only on an explicit `workflow_dispatch` rollback** to a pre-036 image; on a
   merge or build-HEAD deploy the image was just built with `-ldflags`, so `"unknown"`
   means the SHA injection broke and the step fails the job. The tolerance also applies
   only after a successfully parsed JSON health response: if the edge never returns
   readable health JSON (transport error, timeout, nginx error page) for all 10
   attempts, the step fails the job rather than reporting an unverified deploy as green.

### Checking the live release

- **From a browser / GitHub:** the repo home → **Environments → production**, or the
  **Deployments** page — the Active deployment is the verified live commit.
- **From one `curl`:** `curl -s https://capsulezero.app/api/health` returns
  `{"ok":true,"commit":"<gitsha>","builtAt":"<rfc3339>","postgres":"ok","kratos":"ok"}`.
  Compare `commit` to `git rev-parse origin/main` to see whether the latest merge landed.
- **On the host:** `ssh cz "docker ps --format '{{.Names}}\t{{.Image}}'"` (image tag) or
  `docker inspect --format '{{index .Config.Labels "org.opencontainers.image.revision"}}'
  capsule-zero-api-1`.

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
Note: `KRATOS_SMTP_CONNECTION_URI` carries the real Resend sending key since 2026-07-03
(`smtps://resend:<key>@smtp.resend.com:2465/`). Port 2465, NOT 465 — Hetzner Cloud blocks
outbound 25/465 platform-wide; 587/2465/2587 are open (SMTP AUTH verified from the host).
The recovery/verification code emails depend on it (spec 035).

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

## One-time rollout: least-privilege `capsule_app` role (spec 034)

The production `pgdata` volume predates spec 034, so `/docker-entrypoint-initdb.d` never
re-runs and the `capsule_app` role must be provisioned once by the operator. Run on the
server as root, **after** the spec 034 images have deployed (so migration `0002` has
already applied under the old superuser DSN). The password is generated on the host and
written straight into the env file — it never leaves the box.

```bash
cd /opt/capsule-zero
# prod must never host-build (CI-provenance only): capture the CD-pinned api image now,
# before any restart. docker-compose.yml's api service is
# `image: ${CAPSULE_API_IMAGE:-capsule-zero-api:local}` with a build: fallback, so a plain
# `up -d api` without CAPSULE_API_IMAGE would compile the image on the host.
# `-a` so a stopped/exited api container still resolves; abort rather than fall through
# to the local build tag if no pinned image is found.
PIN="$(docker compose -p capsule-zero ps -a --format '{{.Image}}' api)"
case "$PIN" in ""|capsule-zero-api:local) echo "abort: no CD-pinned api image found (would host-build)"; exit 1;; esac
cp .env ".env.bak.pre-034-role-$(date -u +%Y%m%dT%H%M%SZ)"   # rollback safety
APP_PW="$(openssl rand -hex 24)"
docker compose --env-file .env -p capsule-zero exec -T postgres \
  psql -v ON_ERROR_STOP=1 -U "$(grep ^POSTGRES_USER .env | cut -d= -f2)" -d capsule_zero \
       -v app_pw="$APP_PW" <<'EOSQL'
SELECT format('CREATE ROLE capsule_app LOGIN PASSWORD %L', :'app_pw')
  WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'capsule_app')\gexec
ALTER ROLE capsule_app WITH LOGIN PASSWORD :'app_pw';
ALTER DATABASE capsule_zero OWNER TO capsule_app;
ALTER SCHEMA public OWNER TO capsule_app;
ALTER TABLE profiles OWNER TO capsule_app;
ALTER TABLE schema_migrations OWNER TO capsule_app;
REVOKE CONNECT ON DATABASE kratos FROM PUBLIC;
REVOKE CONNECT ON DATABASE capsule_zero FROM PUBLIC;
EOSQL
# swap the API DSN to the new role (restore the .env backup above to roll back):
sed -i "s|^API_DATABASE_URL=.*|API_DATABASE_URL=postgres://capsule_app:${APP_PW}@postgres:5432/capsule_zero?sslmode=disable|" .env
unset APP_PW
# recreate api on the SAME pinned image — --no-build keeps CI provenance and avoids the host build:
CAPSULE_API_IMAGE="$PIN" docker compose --env-file .env -p capsule-zero -f docker-compose.yml up -d --no-build api
curl -fsS https://capsulezero.app/api/health && echo api-ok
```

Rollback: restore the `.env` backup (`.env.bak.pre-034-role-*`) and recreate api on the
pinned image. Capture it with `ps -a` — in the rollback path the api container has usually
**exited** (the bad DSN killed it), and plain `docker compose ps` lists only running
containers, so it would return an empty `PIN` that falls through to the `capsule-zero-api:local`
build tag exactly when recovery is needed:

```bash
PIN="$(docker compose -p capsule-zero ps -a --format '{{.Image}}' api)"
case "$PIN" in ""|capsule-zero-api:local) echo "abort: no CD-pinned api image found"; exit 1;; esac
CAPSULE_API_IMAGE="$PIN" docker compose --env-file .env -p capsule-zero -f docker-compose.yml up -d --no-build api
```
Migration files from `0002` on must stay runnable by this non-superuser owner role —
plain DDL on owned objects only (`pgcrypto` is a trusted extension in PG16, so its
`IF NOT EXISTS` re-run is safe).

## Rollback

Every build is tagged immutably by commit SHA. Run **CD Prod** via **workflow_dispatch**
with `image_sha = sha-<previous-gitsha>` — it skips the build, checks out the matching
commit, and redeploys those images (host-nginx sync is skipped on rollback). List tags in
**Packages → capsule-zero-web / capsule-zero-api**.

The deploy job's implicit `environment: production` deployment is always bound to the
workflow run's own `github.sha` — during a rollback that would mark the *current* main
tip Active while prod actually serves the older commit. The `record-rollback-release`
job closes that gap: it runs only after a successful (health-verified) rollback deploy,
creates an explicit Deployment + success status for the rolled-back SHA via the REST
API, and then explicitly marks every other production deployment inactive (GitHub's
auto-inactivation on a success status skips production environments, so the implicit
record would otherwise stay active) — so **Environments → production** keeps answering
"what is live" correctly during rollbacks too. Rolling back to a pre-036
image reports `commit "unknown"` on `/api/health`; the verify step warns and defers to
the wrapper's health smoke.

## Notes

- The server never builds images (RAM/CPU contention + CI provenance); the wrapper always
  passes `--no-build`.
- Postgres data lives in the named volume `capsule-zero_pgdata`; images can be recreated
  freely without touching it. Nightly `pg_dump` backups land with spec 024 Phase 5.
- Do not confuse the production pipeline with `docker-compose.dev.yml` — that override is
  laptop-only local development (mkcert, `capsulezero.local`, MailHog).
