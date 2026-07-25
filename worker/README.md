# /worker — Go background worker (scaffold)

> **Monetization freeze (2026-07-16):** Every coin, balance, Lava.top, billing, payment-product,
> pricing, or purchase-flow statement below is superseded historical context under `PRODUCT-PLAN.md`
> D2. Do not implement, provision, expose, test as a release gate, or use it for a new contract or
> code generation. Stage 4 will delete or replace the retained legacy after choosing a model.
>
> **Q8 implementation freeze (2026-07-24):** `marketplace_parse` and
> `item_embedding` below are retained target job names, not active worker
> contracts. Do not add them to OpenAPI, provider registries, queue producers,
> handlers, schemas, or provisioning until the compliance-scheme spec and
> external legal review have both landed.

Implementation in [`.specify/specs/024-production-stack-runtime/`](../.specify/specs/024-production-stack-runtime/).

Target structure:

```
cmd/worker/                     ← main.go: Redis-queue consumer
internal/
  jobs/                         ← image jobs (Stage 2), embeddings, webhook fanout
Dockerfile                      ← multi-stage Go build
```

Target job types (defined in `docs_capsule_zero/project/backend/backend-docs.md`):

- `marketplace_parse` — Q8-gated; future fetch + parse of a user-submitted product URL
- `item_embedding` — Q8-gated for the shared merchant corpus; future embedding computation
- `webhook_fanout` — forward verified Lava.top webhooks to downstream handlers (v0.2)
- `background_removal` — Stage 2, when the self-hosted Capsule Zero image model ships
