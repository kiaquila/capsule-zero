# Web Frontend Docs

## Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS v4
- next-intl for EN and RU in v0.1; ES-AR is retained as reference and deferred to v0.2
- Zustand for local workflow state
- TanStack Query for interactive server-state
- React Hook Form + Zod for forms

The web frontend talks to the Go API monolith through nginx; there is no Vercel runtime. Auth flows are rendered by the web app against Ory Kratos self-service endpoints, with the Kratos session validated by the Go API on every request.

`/app` is the canonical, provider-abstracted Next.js frontend. There is no `/app` to `/web` rename planned. Current provider modes are `mock` and `supabase`; the `api` provider mode must not be documented as available until it actually lands in `/app`. The retired Supabase provider is frozen and removed domain by domain as the Go API absorbs each bounded context.

## Delivery Rules

- Frontend code lives under `app/src/`.
- Approved behavior and layout come from the implemented `/app` screens, with the product docs and historical prototypes as supporting references.
- Visual tokens come from `app/src/styles/tokens.css` and `docs_capsule_zero/project/frontend/styling.md`.
- CI frontend baseline is `npm run typecheck` plus `npm run build`.
- Web implementation remains mobile-first: 375px is the primary layout target, then tablet and desktop.
- Keep Server Components as the default. Add `use client` only for interactivity, forms, uploads, local state, and browser APIs.
- Initialize the API client lazily inside functions or request-scoped utilities. Do not instantiate at module scope with required runtime env vars.
- User-facing text must route through next-intl message files, seeded from `docs_capsule_zero/i18n/ui-texts.md`.
- Product screens must match the HTML prototypes before new design invention.

## Environment Notes

- Current production font setup uses `next/font/google`.
- Local sandboxed builds may fail without external network access when fetching Google Fonts.
- If offline builds become mandatory, migrate typography to local font assets.

## Routing

Recommended route groups:

```text
app/src/app/
  [locale]/
    (marketing)/
      page.tsx
    (auth)/
      auth/
        page.tsx
    (app)/
      dashboard/
      journey/
      capsule/
      my-items/
      uncapsulated/
      favorites/
      for-sale/
      for-repair/
      profile/
  api/
    ...
```

Use locale-aware routing for app pages. The language switcher appears on landing and profile, and the selected locale is also persisted to `profiles.language`.

Decision: active v0.1 web locales are `en` and `ru`. `es-AR` remains a future locale for v0.2 and must not be exposed in routing, UI controls, generated clients, or the profile language enum until that scope is reactivated.

## State Management

| State type                 | Owner                     | Examples                                                   |
| -------------------------- | ------------------------- | ---------------------------------------------------------- |
| Route/data state           | Next.js Server Components | Initial dashboard, capsule result, profile read            |
| Interactive server-state   | TanStack Query            | Wardrobe grid, imports, uploads, catalog search, favorites |
| Local workflow state       | Zustand                   | Guided Journey steps and in-progress selections            |
| Form state                 | React Hook Form + Zod     | Auth, profile, item edit, upload confirmation              |
| Persistent source of truth | PostgreSQL via the Go API | Profiles, items, capsules, outfits, coins                  |

## API Client Rules

- Use Server Actions for simple authenticated app mutations; they call the Go API over HTTP with the Kratos session cookie forwarded.
- Use Route Handlers only when an external caller needs a Next.js endpoint (rare — most surfaces talk directly to the Go API via nginx).
- Keep Zod request/response schemas near the feature module and reuse them across Server Actions and components.
- Keep generated OpenAPI client/types in `app/src/lib/api/generated/`; update them whenever `docs_capsule_zero/adr/openapi.yaml` changes.
- Never embed admin/service credentials in Client Components — there are none on the web side; admin actions go through admin routes on the Go API.
- Client Components should use TanStack Query for fetch/mutate flows that need loading, retry, optimistic updates, or cache invalidation.
- Auth flows render the Kratos self-service UI inside the web app; the Go API validates the Kratos session on every protected request.

## i18n

- Primary locale: `en`
- Supported v0.1 locales: `en`, `ru`
- Deferred v0.2 locale: `es-AR`
- Source text: `docs_capsule_zero/i18n/ui-texts.md`
- Fallback locale: `en`
- Missing translations fail development review.
- AI-generated item names/descriptions must store original language and displayed locale where practical.

## Required Dependencies For Phase 5

Already present:

- `zustand`
- `react-hook-form`
- `@hookform/resolvers`
- `zod`
- `framer-motion`
- `clsx`
- `tailwind-merge`
- `next-intl`

Add before dependent feature slices:

- `@tanstack/react-query`
- `@ory/client` (Kratos SDK) and `@ory/kratos-client` for self-service flows
- generated TypeScript client from `docs_capsule_zero/adr/openapi.yaml` (e.g. via `openapi-typescript` + `openapi-fetch`)

## Payments

The web app owns Lava.top purchase entrypoints (v0.2 integration; stubbed in v0.1). Native mobile apps must not show purchase CTAs or external payment links; they only reflect coin balance after webhook-backed fulfillment.

## Quality Follow-Up

The repository already has CI and PR gates. Before Phase 5 product-code PRs, configure linting and local commit hooks so the Phase 4 quality gate is fully closed.
