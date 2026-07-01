# /worker — Go background worker (scaffold)

Implementation in [`.specify/specs/024-production-stack-runtime/`](../.specify/specs/024-production-stack-runtime/).

Target structure:

```
cmd/worker/                     ← main.go: Redis-queue consumer
internal/
  jobs/                         ← image jobs (Stage 2), embeddings, webhook fanout
Dockerfile                      ← multi-stage Go build
```

Job types (defined in `docs_capsule_zero/project/backend/backend-docs.md`):

- `marketplace_parse` — fetch + parse product URL into candidate items
- `item_embedding` — compute pgvector embedding for a public catalog item
- `webhook_fanout` — forward verified Lava.top webhooks to downstream handlers (v0.2)
- `background_removal` — Stage 2, when the self-hosted Capsule Zero image model ships
