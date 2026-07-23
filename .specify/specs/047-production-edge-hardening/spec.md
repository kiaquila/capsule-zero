# Spec 047 — Production Edge Hardening

## Goal

Harden the live `capsulezero.app` production edge without breaking the canonical API
contract: Cloudflare absorbs public traffic, the Hetzner origin accepts web traffic only
from Cloudflare, operator and CI SSH use Tailscale, and encrypted PostgreSQL backups run
automatically with an upload-only Object Storage credential.

The repository must remain the reproducible source for the live host-nginx configuration
and deploy path. A merge that changes `infra/nginx-host/**` must preserve rollback and
must not silently block an HTTP method used by `docs_capsule_zero/adr/openapi.yaml`.

## Scope

### In

- Cloudflare-proxied apex and `www` records with Full (strict) TLS, DNSSEC, HTTPS
  enforcement, WAF/DDoS defaults, and a scoped authentication rate-limit rule.
- Origin firewall rules that accept TCP/80 and TCP/443 only from Cloudflare's published
  proxy ranges; public TCP/22 stays closed.
- Tailscale-only operator SSH and GitHub Actions deploy SSH. The deploy job authenticates
  with GitHub OIDC workload identity, joins ephemerally as `tag:ci`, and can reach only
  the production host on TCP/22.
- Repository-managed host-nginx default-deny vhosts, trusted Cloudflare real-IP ranges,
  probe classification, connection/request limits, and a method guard that allows the
  application verbs `GET`, `HEAD`, `POST`, `PUT`, `PATCH`, `DELETE`, and `OPTIONS`.
- Daily `age`-encrypted off-site backup automation using the existing upload-only
  Object Storage policy, a fixed uploader header set, Object Lock retention, and an
  off-server decryption key.
- The exact Next.js patch update required to clear the current-head OSV security
  gate; no framework migration or application behavior change.
- Actualization of current architecture, runtime, operator, and feature-memory docs.

### Out

- Proxying public Hetzner Object Storage catalog URLs through Cloudflare; those assets
  continue to use native object URLs until the catalog-CDN slice.
- A preview/dev environment, Redis, imgproxy, Grafana, or a multi-node deployment.
- Broad Cloudflare Bot Fight Mode. It remains disabled because the Free-plan control
  cannot be scoped or bypassed and challenged the API health monitor.
- Any change to the Object Storage runtime upload activation gate: personal-photo routes
  remain disabled until owner quota, orphan cleanup, and wardrobe attachment land.

## Negative Scenarios

- Unknown hosts and direct-IP HTTP requests are rejected by the default vhost; a TLS
  handshake for an unknown SNI name is rejected.
- Direct public origin access and public SSH time out or are denied by the firewalls.
- `TRACE`, `CONNECT`, and other unrecognized methods return `405`, while canonical
  `PATCH` and `DELETE` API traffic is not rejected by the method guard.
- A missing or apex-only TLS certificate blocks installation of the dual-host vhost
  and restores the previous nginx tree.
- A CI tailnet identity cannot reach any destination/port outside the `tag:ci → cz:22`
  grant.
- The backup credential cannot read, list, overwrite, or delete stored backups, and the
  uploader accepts no caller-controlled metadata or Object Lock headers.

TDD posture: the infrastructure, delivery wiring, and documentation changes use config
checks, isolated nginx probes, live read-only edge/host checks, and GitHub merge gates
under the repository's infrastructure waiver. No application behavior changed. The
security-only Next.js patch was preceded by the failing current-head OSV scan and is
validated by the same scanner plus the full app lint, CSS lint, typecheck, and production
build chain.
