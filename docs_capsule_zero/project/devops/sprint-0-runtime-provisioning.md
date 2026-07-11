# Sprint 0 Runtime Provisioning

## Purpose

This runbook describes how to bring up the production-shape Capsule Zero stack on the production server across the phased rollout in `.specify/specs/024-production-stack-runtime/`. It is the operational companion to that spec and does not store secrets in git. (Since 2026-07-02 the server is a Hetzner Cloud CX23; day-to-day deploys are automated by `prod-cd-pipeline.md`, and that runbook also owns the current one-time provisioning sequence.)

Phase 1 delivers the host `nginx + web` runtime that replaces the host Caddy + legacy Supabase compose currently on the droplet. The dedicated runbook for Phase 1 lives at `docs_capsule_zero/project/devops/nginx-reverse-proxy.md`; this document keeps the steady-state operational contract for the whole stack once every phase has shipped.

## Preconditions

- GitHub `main` is current and required checks are green.
- Server of at least 2 vCPU / 4 GB (current: Hetzner CX23, Ubuntu 26.04), Docker + docker-compose installed.
- (Stage 2 — the Cloudflare front-door is deferred, founder decision 2026-07-02.) Cloudflare account with the `capsulezero.app` zone; not needed for the v0.1 bring-up.
- (Stage 2, with the Cloudflare proxy.) Cloudflare API token with Zone Read + DNS Edit on `capsulezero.app`, stored as `CF_DNS_API_TOKEN` in the server `.env` for ACME DNS-01. Until the proxy is on, nginx + certbot use HTTP-01 with port 80 directly.
- Spaceship registrar account with a direct `A` record for `capsulezero.app` pointing at the server IP (the Cloudflare nameserver cut-over is deferred to Stage 2).
- Resend domain/SPF/DKIM and the production Kratos SMTP courier are provisioned.
- Hetzner Object Storage topology from ADR-003: the private/public asset
  buckets are provisioned in project `15203114` / HEL; the Object-Locked backup
  bucket and separate key are in project `15296835` / FSN. Policy readback has
  verified the runtime key is allowed on the current private bucket and denied
  on the current public bucket, the backup key is allowed on the current
  isolated backup bucket, backup CORS is absent, and production asset CORS allows
  exactly `https://capsulezero.app`; the redacted 10 MiB signed smoke passed.

Local tools on the operator machine: Node/npm, Go, Docker (for running the local stack), `gh` CLI.

Copy the env template and fill it with real values:

```bash
cp deploy/compose.env.example .env
```

Required keys at minimum: see `docs_capsule_zero/project/devops/docker-compose-deploy.md` → _First Start_.

## Production-First Posture

There is no Stage 1 mock-first layer (see ADR-006). Every active service in the runtime comes up against real Postgres / real Kratos / real Hetzner Object Storage / real Resend from the first deploy (the Cloudflare front-door/CDN joins at Stage 2 — founder decision 2026-07-02). Local development uses the same stack with a `docker-compose.dev.yml` override that swaps Resend for MailHog and enables API hot-reload (the override is reintroduced in Phase 2 alongside Kratos).

Real provider integration gates that remain:

- **Google / Apple OAuth in Kratos** — Stage 2.
- **Lava.top live integration** — Stage 2.
- **Self-hosted Capsule Zero image model** — Stage 2.

Until these gates open, the corresponding API surface exists as stubs (Lava.top) or is absent (image processing).

## Bring-Up Steps

### Object Storage policy artifacts

Canonical production policy/CORS inputs live under
`deploy/object-storage/`:

- `private-assets-cors.json` — exact production origin, signed PUT/read methods,
  `Content-Type`, and `ETag`;
- `public-catalog-cors.json` — exact-origin read methods only;
- `private-assets-policy.template.json` — deny every principal except the
  rendered runtime access-key principal on the current private bucket;
- `public-catalog-policy.template.json` — public object reads while explicitly
  denying the runtime key;
- `backups-policy.template.json` — deny every principal except the rendered
  backup key on the current bucket in its isolated project.

Render key placeholders only into a protected temporary file on the operator
host/server; never replace them in the committed templates. Readback on
2026-07-10 matched these policies. The backup bucket has Object Lock enabled
and no CORS. Allowed `https://capsulezero.app` and attacker-origin preflight
probes and the signed 10 MiB PUT/HEAD/GET/checksum/delete smoke passed with
cleanup. Production upload activation remains default-off until quota,
abandoned-upload cleanup, wardrobe attachment, and per-action credential
hardening land.

These templates implement Hetzner's same-project `DenyAllUsersButOne` pattern.
They prove a practical boundary for the buckets that exist today, but the
allowlisted key keeps `s3:*` control-plane access on its bucket and Hetzner
grants it default access to future buckets in the same project. Before upload
or backup activation, create data-plane keys in dedicated key-only projects,
grant only the required actions cross-project, and retain separate operator
keys in the bucket projects for policy changes.

Treat every presigned URL as a short-lived bearer capability. Its host, path,
and query necessarily reveal the bucket, object key, and access-key ID; never
copy it into logs, chat, screenshots, or evidence. Before PUT expiry, a holder
can replay the request and overwrite the same final object, potentially making
the completed asset's stored ETag stale. This is an accepted bounded residual
for the original-only foundation, not a guarantee to extend to broader assets.

### 1. DNS

- v0.1 (current): at the Spaceship registrar, point a direct `A` record for `capsulezero.app` at the server IP. TLS is Let's Encrypt on host nginx (HTTP-01). Add `grafana.capsulezero.app` only after ADR-007 promotes Grafana.
- Stage 2 (Cloudflare front-door activation — founder decision 2026-07-02 deferred it out of v0.1): switch Spaceship nameservers to Cloudflare; `A` record with proxy (orange cloud) enabled; SSL/TLS mode `Full (strict)`; enable `Bot Fight Mode` and `Always Use HTTPS`; add a cache-`Bypass` rule for `capsulezero.app/api/*`; refresh the nginx realip CF-ranges snippet (spec 024 Known Issues) in the same change.

### 2. Droplet baseline

- Set the hostname to `capsulezero-prod`.
- Configure `ufw` to allow `22/tcp`, `80/tcp`, `443/tcp` only.
- Create a `capsule-zero` user; disable root password login.
- Install Docker Engine + docker-compose plugin from the official Docker apt repository.
- Prepare the protected plaintext env file at the canonical
  `/opt/capsule-zero/.env` path. It is root-owned with mode `600`; encryption at
  rest has not been established, so do not describe the file as encrypted.

### 3. Pull repo and start the stack

```bash
git clone git@github.com:kiaquila/capsule-zero.git /opt/capsule-zero
cd /opt/capsule-zero
sudo install -o root -g root -m 600 /path/to/protected.env /opt/capsule-zero/.env
docker compose --env-file ./.env up -d
docker compose --env-file ./.env logs web --tail=50
sudo nginx -t
sudo systemctl reload nginx
```

The root compose file keeps the rollback `nginx` service behind the `docker-edge` profile. Do not enable that profile during the normal production bootstrap while host nginx owns ports 80/443. The current default stack brings up Kratos, Postgres, the Go API, and the Next.js web container; Object Storage and Resend are external providers. Redis, an in-process queue consumer, imgproxy, and backup automation have not landed. PgBouncer, Grafana, and the standalone worker container are promoted only when ADR-007 triggers open. The embedded SQL migrator runs at API boot, and Kratos runs its own migrations through its init container.

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

- `ok: true` plus non-empty `commit` and `builtAt`
- `postgres: "ok"`
- `kratos: "ok"`
- `storage: "ok"`

If a dependency reports `error`, the endpoint returns 503. Fix the env file,
credential policy, bucket, or service config and rerun. Redis and email fields
are not part of the current probe and must not be invented in evidence.

### 5. Smoke flows

- Open `https://capsulezero.app` and register a test user with a real inbox.
- Confirm the verification email arrives via Resend.
- Sign in, update profile, sign out.
- Use an authenticated call to `/api/uploads/photo/init`, send the exact
  returned headers with the signed PUT, then call `/api/uploads/photo/complete`
  with both the issued `jobId` and `assetId`.
  Confirm the object metadata matches and anonymous reads stay blocked. Spec
  040 intentionally has no Journey/frontend upload wiring, so a UI smoke is
  not evidence for this slice.
- Confirm syslog files are present and rotated on the host; Grafana smoke checks start only after ADR-007 promotes the dashboard service.

### 6. Backups (deferred)

The Object-Locked bucket and its current-project key are provisioned, but nightly
`pg_dump`, client-side encryption, scheduling, lifecycle/retention, and restore
verification remain spec-024 Phase 5 work. Do not upload plaintext database
data or mark backups complete based on bucket creation alone. Once Phase 5
lands, verify the first encrypted object under `postgres/`, at least 14 day
retention, and a restore drill.

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

- Plan: ≥ 2 vCPU / 4 GB (current: Hetzner CX23 — 2 vCPU / 4 GB / 40 GB; superseded the DO 80 GB row 2026-07-02, spec 033)
- IP:
- Hostname: capsulezero-prod
- ufw status: pass/fail

DNS (v0.1 — direct; Cloudflare deferred to Stage 2)

- Spaceship direct `A` record (apex) → server IP: pass/fail
- Grafana A record omitted until ADR-007 promotion: pass/fail
- Let's Encrypt cert valid on host nginx: pass/fail
- Stage 2 only (do not verify in v0.1): Spaceship → Cloudflare NS; proxy enabled; SSL/TLS Full (strict); Bot Fight Mode

docker-compose

- All services healthy: pass/fail
- nginx TLS serving on 443: pass/fail
- API /api/health: pass/fail

Kratos / Resend

- Identity schema applied: pass/fail
- Verification email received: pass/fail
- Password recovery email received: pass/fail

Hetzner Object Storage

- Private/public asset buckets (`15203114` / HEL): pass/fail
- Object-Locked backup bucket + separate key (`15296835` / FSN): pass/fail
- Runtime key allowlisted private / denied public: pass/fail
- Backup key allowlisted / backup CORS absent: pass/fail
- Private bucket reachable from API health: pass/fail
- Signed PUT round-trip: pass/fail
- Exact `https://capsulezero.app` CORS allowed: pass/fail
- localhost/attacker CORS denied: pass/fail

Backups (Phase 5; currently deferred)

- Nightly encrypted pg_dump landed in the backup bucket: pass/fail
- Lifecycle/Object Lock posture active (>=14 day): pass/fail

Remaining blockers:
```

## References

- nginx docs: https://nginx.org/en/docs/
- certbot docs: https://eff-certbot.readthedocs.io/
- Ory Kratos: https://www.ory.sh/docs/kratos/
- PostgreSQL pgvector: https://github.com/pgvector/pgvector
- Hetzner Object Storage: https://docs.hetzner.com/storage/object-storage/overview/
- Resend: https://resend.com/docs
- Cloudflare DDoS protection: https://developers.cloudflare.com/ddos-protection/
- Lava.top developer API: https://developers.lava.top/en
- Production runtime spec: `.specify/specs/024-production-stack-runtime/`
