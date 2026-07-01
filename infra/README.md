# /infra — Service configuration (scaffold)

Implementation in [`.specify/specs/024-production-stack-runtime/`](../.specify/specs/024-production-stack-runtime/).

Contents:

```
nginx/                          ← nginx container config (Phase 1)
  nginx.conf                    ← base nginx config
  conf.d/                       ← production vhosts and upstream routing
  conf.d.dev/                   ← dev-edge vhosts and routing
nginx-host/                     ← host nginx migration/reference configs
scripts/                        ← deploy and runtime helper scripts
kratos/                         ← Ory Kratos config (Phase 2)
  kratos.yml                    ← identity schema, courier, self-service flows
  identity.schema.json          ← traits.email, traits.name.first, traits.locale
postgres/                       ← plain Postgres init scripts (Phase 2)
  01-kratos-db.sql              ← create the Kratos database and role
```

Spec 024 fills this directory incrementally. Phase 1 has landed the nginx/web edge; later phases add Kratos and plain `postgres:16` init scripts. pgvector remains deferred by ADR-007 until the semantic-search slice promotes it.
