# /infra — Service configuration (scaffold)

Implementation in [`.specify/specs/024-production-stack-runtime/`](../.specify/specs/024-production-stack-runtime/).

Contents:

```
traefik/                        ← Traefik dynamic config
  middlewares.yml               ← Rate-limit, forward-auth into Kratos
  routers.yml                   ← Route definitions for api, web, grafana
kratos/                         ← Ory Kratos config
  kratos.yml                    ← Identity schema, courier, self-service flows
  identity.schema.json          ← traits.email, traits.name.first, traits.locale
postgres/                       ← Postgres init scripts
  00-extensions.sql             ← CREATE EXTENSION pgvector
  01-kratos-db.sql              ← Create the Kratos database and role
```

Until spec 024 lands, this directory holds only this README. The `docker-compose.yml` scaffold mounts these paths as read-only volumes; spec 024 fills them in.
