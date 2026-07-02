# Sprint 0 Runtime Provisioning

## Purpose

This runbook describes how to bring up the production-shape Capsule Zero stack on the DigitalOcean droplet across the phased rollout in `.specify/specs/024-production-stack-runtime/`. It is the operational companion to that spec and does not store secrets in git.

Phase 1 delivers the host `nginx + web` runtime that replaces the host Caddy + legacy Supabase compose currently on the droplet. The dedicated runbook for Phase 1 lives at `docs_capsule_zero/project/devops/nginx-reverse-proxy.md`; this document keeps the steady-state operational contract for the whole stack once every phase has shipped.

## Preconditions

- GitHub `main` is current and required checks are green.
- DigitalOcean droplet of at least 4 GB / 2 vCPU / 80 GB, Ubuntu 24.04 LTS, Docker + docker-compose installed.
- Cloudflare account with the `capsulezero.app` zone.
- (Phase 4+ when Cloudflare proxy is enabled.) Cloudflare API token with Zone Read + DNS Edit on `capsulezero.app`, stored as `CF_DNS_API_TOKEN` in the droplet `.env` for ACME DNS-01. Until the proxy is on, nginx + certbot use HTTP-01 with port 80 directly.
- Spaceship registrar account with `capsulezero.app` set to Cloudflare nameservers.
- Resend account with API key and `no-reply@capsulezero.app` verified.
- DigitalOcean Spaces bucket `capsulezero` with CORS for `https://capsulezero.app` (and the dev origin) configured.

Local tools on the operator machine: Node/npm, Go, Docker (for running the local stack), `gh` CLI.

Copy the env template and fill it with real values:

```bash
cp deploy/compose.env.example .env
```

Required keys at minimum: see `docs_capsule_zero/project/devops/docker-compose-deploy.md` → _First Start_.

## Production-First Posture

There is no Stage 1 mock-first layer (see ADR-006). Every active service in the runtime comes up against real Postgres / real Kratos / real Spaces / real Resend / real Cloudflare from the first deploy. Local development uses the same stack with a `docker-compose.dev.yml` override that swaps Resend for MailHog and enables API hot-reload (the override is reintroduced in Phase 2 alongside Kratos).

Real provider integration gates that remain:

- **Google / Apple OAuth in Kratos** — Stage 2.
- **Lava.top live integration** — Stage 2.
- **Self-hosted Capsule Zero image model** — Stage 2.

Until these gates open, the corresponding API surface exists as stubs (Lava.top) or is absent (image processing).

## Bring-Up Steps

### 1. DNS and Cloudflare

- Confirm Spaceship nameservers point to Cloudflare.
- In Cloudflare, add an `A` record for `capsulezero.app` pointing to the droplet IP, with proxy (orange cloud) enabled. Add `grafana.capsulezero.app` only after ADR-007 promotes Grafana.
- SSL/TLS mode: `Full (strict)`.
- Enable `Bot Fight Mode` and `Always Use HTTPS`.
- Add a Page Rule (or Rules Engine entry) for `capsulezero.app/api/*` with cache level `Bypass`.

### 2. Droplet baseline

- Set the hostname to `capsulezero-prod`.
- Configure `ufw` to allow `22/tcp`, `80/tcp`, `443/tcp` only.
- Create a `capsule-zero` user; disable root password login.
- Install Docker Engine + docker-compose plugin from the official Docker apt repository.
- Prepare the encrypted `.env`; after cloning the repo, install it under `/srv/capsule-zero/repo/.env` with mode `600` so Compose loads it from the project directory.

### 3. Pull repo and start the stack

```bash
git clone git@github.com:kiaquila/capsule-zero.git /opt/capsule-zero
cd /opt/capsule-zero
install -m 600 /path/to/encrypted/.env ./.env
docker compose --env-file ./.env up -d
docker compose --env-file ./.env logs web --tail=50
sudo nginx -t
sudo systemctl reload nginx
```

The root compose file keeps the rollback `nginx` service behind the `docker-edge` profile. Do not enable that profile during the normal production bootstrap while host nginx owns ports 80/443. The default compose command brings up Kratos, Postgres, Redis, the Go API, the in-process queue worker, the Next.js web container, and imgproxy once every v0.1 phase of spec 024 has shipped. PgBouncer, Grafana, and the standalone worker container are promoted only when ADR-007 triggers open. In earlier phases only the services delivered so far come up. The embedded SQL migrator runs at API boot from Phase 2 onward (the Go API ships with the Phase 2 auth slice). Kratos runs its own migrations through its init container from Phase 2 onward.

Use the compose edge only as an explicit rollback path after stopping host nginx:

```bash
sudo systemctl stop nginx
docker compose --env-file ./.env --profile docker-edge up -d nginx
```

### 4. Verify health end-to-end

```bash
curl -fsS https://capsulezero.app/api/health
docker compose --env-file ./.env ps
sudo systemctl status nginx --no-pager
sudo journalctl -u nginx -n 50 --no-pager
```

Expected `/api/health` response includes:

- `api: "ok"`
- `postgres: "ok"`
- `redis: "ok"`
- `kratos: "ok"`
- `storage: "ok"`
- `email: "ok"`

If any reports `pending` or `error`, fix the env file or the service config and rerun.

### 5. Smoke flows

- Open `https://capsulezero.app` and register a test user with a real inbox.
- Confirm the verification email arrives via Resend.
- Sign in, update profile, sign out.
- Upload a wardrobe photo via the Journey flow; confirm the file lands in Spaces under the correct prefix.
- Confirm syslog files are present and rotated on the host; Grafana smoke checks start only after ADR-007 promotes the dashboard service.

### 6. Backups

The nightly `pg_dump` cron is shipped with spec 024. Verify the first night's backup landed at `s3://capsulezero/backups/capsule-zero-YYYY-MM-DDTHH-MM-SSZ.dump` and that the lifecycle rule on the `backups/` prefix is active with 14 day retention.

## Stage 2 Integration Gates

Run these only when the corresponding product slice opens.

### Google / Apple OAuth in Kratos

- Add the provider config to `infra/kratos/kratos.yml` under `selfservice.methods.oidc.config.providers`.
- Configure the provider callback URL in the provider dashboard:
  - `https://capsulezero.app/self-service/methods/oidc/callback/google`
  - `https://capsulezero.app/self-service/methods/oidc/callback/apple`
- Add mobile deep-link callback URLs once React Native auth integrates.
- Restart Kratos: `docker compose up -d kratos`.

### Lava.top

- Create coin products in Lava.top and map their provider IDs into env:

| Coin pack | Env variable               |
| --------- | -------------------------- |
| 5 coins   | `LAVA_COINS_5_PRODUCT_ID`  |
| 15 coins  | `LAVA_COINS_15_PRODUCT_ID` |
| 30 coins  | `LAVA_COINS_30_PRODUCT_ID` |

- Set `LAVA_API_KEY` (outbound) and `LAVA_WEBHOOK_API_KEY` (inbound).
- Configure the webhook URL `https://capsulezero.app/api/webhooks/lava` for `Payment result` events.
- Verify a real test purchase end-to-end on staging before enabling on production.

### Self-hosted image model

- Bring up the model training/inference container as a new service in compose (`image-model`).
- Add the `background_removal` job consumer to the worker.
- Run a latency/quality spike against at least 10 representative wardrobe photos. P99 latency must be ≤ 5 seconds at v0.1 droplet size.
- Enable the model for real users only after founder review approves visual quality.

## Evidence Template

Post this as a GitHub issue comment, PR comment, or committed measurement note once the stack is live.

```markdown
Sprint 0 runtime provisioning evidence

Date:
Operator:
Branch/commit:

Droplet

- Plan: 4 GB / 2 vCPU / 80 GB (or larger)
- IP:
- Hostname: capsulezero-prod
- ufw status: pass/fail

DNS / Cloudflare

- Spaceship → Cloudflare NS: pass/fail
- Cloudflare A record (apex): pass/fail
- Grafana A record omitted until ADR-007 promotion: pass/fail
- Proxy enabled: pass/fail
- SSL/TLS Full (strict): pass/fail
- Bot Fight Mode: enabled

docker-compose

- All services healthy: pass/fail
- nginx TLS serving on 443: pass/fail
- API /api/health: pass/fail

Kratos / Resend

- Identity schema applied: pass/fail
- Verification email received: pass/fail
- Password recovery email received: pass/fail

Spaces

- Bucket reachable: pass/fail
- Signed PUT round-trip: pass/fail
- CORS verified: pass/fail

Backups

- Nightly pg_dump landed in s3://capsulezero/backups/: pass/fail
- Lifecycle rule active (14 day): pass/fail

Remaining blockers:
```

## References

- nginx docs: https://nginx.org/en/docs/
- certbot docs: https://eff-certbot.readthedocs.io/
- Ory Kratos: https://www.ory.sh/docs/kratos/
- PostgreSQL pgvector: https://github.com/pgvector/pgvector
- DigitalOcean Spaces: https://www.digitalocean.com/products/spaces
- Resend: https://resend.com/docs
- Cloudflare DDoS protection: https://developers.cloudflare.com/ddos-protection/
- Lava.top developer API: https://developers.lava.top/en
- Production runtime spec: `.specify/specs/024-production-stack-runtime/`
