# /infra — Service configuration (scaffold)

Implementation in [`.specify/specs/024-production-stack-runtime/`](../.specify/specs/024-production-stack-runtime/).

Reverse proxy / API gateway is nginx 1.27 (not Traefik — see ADR-001). The
live production edge is a host (systemd) nginx in `nginx-host/`; the in-container
`nginx/` config is profile-gated for rollback and used by local dev.

Contents:

```
nginx/                          ← in-container nginx config (rollback + local dev)
  nginx.conf                    ← main config
  conf.d/                       ← prod-shape vhost (capsulezero.app)
  conf.d.dev/                   ← mkcert vhost (capsulezero.local)
nginx-host/                     ← host (systemd) nginx vhosts — the live edge
scripts/                        ← deploy and runtime helper scripts
postgres/                       ← Postgres init scripts (run once on empty volume)
  00-kratos-db.sh               ← provision the Kratos role + database
kratos/                         ← Ory Kratos config
  kratos.yml                    ← courier, self-service flows
  identity.schema.json          ← traits.email, traits.name.first, traits.locale
```

Postgres is plain `postgres:16` for v0.1 — pgvector is deferred until the
semantic catalog-search slice (US-012) actually needs vectors.

Filled in phase by phase per `.specify/specs/024-production-stack-runtime/`.
