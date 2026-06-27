# /web — Next.js App Router web frontend (scaffold)

Implementation in [`.specify/specs/024-production-stack-runtime/`](../.specify/specs/024-production-stack-runtime/).

This is the new home for the web frontend. The legacy Supabase-based shell lives at `/app` and is scheduled for removal in the implementation iteration that follows spec 024.

Target structure (from `docs_capsule_zero/project/frontend/frontend-docs.md`):

```
src/
  app/                          ← App Router routes
    (marketing)/
      page.tsx                  ← Landing
    (auth)/
      auth/                     ← Kratos self-service flows
    (app)/                      ← Dashboard, journey, my-items, …
  components/                   ← Glass surfaces, color dots, item cards, …
  features/                     ← Bounded contexts mirroring the API
  lib/
    api/generated/              ← OpenAPI-generated TypeScript client
    auth/                       ← Kratos flow wrappers
    storage/                    ← Signed-URL upload helper
  styles/
    tokens.css                  ← Glass tokens (carried over from app/src/styles)
public/                         ← Static assets
Dockerfile                      ← Next.js standalone production image
```

Until spec 024 lands, this directory is a placeholder.
