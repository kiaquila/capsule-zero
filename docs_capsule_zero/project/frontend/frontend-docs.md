# Web Frontend Docs

> **Monetization freeze (2026-07-16):** Every coin, balance, Lava.top, billing, payment-product,
> pricing, or purchase-flow statement below is superseded historical context under `PRODUCT-PLAN.md`
> D2. Do not implement, provision, expose, test as a release gate, or use it for a new contract or
> code generation. Stage 4 will delete or replace the retained legacy after choosing a model.

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

`/app` is the canonical, provider-abstracted Next.js frontend. There is no `/app` to `/web` rename planned. Provider modes are `api` (the Go/Kratos backend — default in production, `CAPSULE_PROVIDER_MODE=api`), `mock` (local/CI fixtures — the default when the mode is unset, rejected in production), and `supabase` (the frozen legacy backend). The Supabase provider is retired domain by domain as the Go API absorbs each bounded context: its **auth and profile ports are retired** (they throw `SUPABASE_AUTH_RETIRED`; auth/profile run only on the `api` provider — specs 024/034/035/037/038), while its not-yet-migrated read domains (wardrobe, capsules, catalog, billing, storage, methodology) stay until their Go contexts land and the whole module is removed in Phase 6 of spec 024.

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

## Social Link Previews

- `app/src/lib/site-metadata.ts` is the single metadata contract shared by the redirect and localized root layouts.
- Open Graph and Twitter Card image URLs are resolved against `https://capsulezero.app`; crawler-facing metadata must never inherit a localhost or request-specific origin.
- The canonical preview image is `app/public/social/capsule-zero-homepage.png`, a 1200x630 screenshot of the production English landing page without consent, auth, browser, or development overlays.
- Open Graph declares the image dimensions and alt text. Twitter uses the same asset with `summary_large_image` so clients do not drift visually.
- Refresh the screenshot and its e2e expectations whenever the landing hero materially changes. Keep the asset below the platform image-size ceiling and do not replace it with generated brand artwork unless the product decision changes.

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
