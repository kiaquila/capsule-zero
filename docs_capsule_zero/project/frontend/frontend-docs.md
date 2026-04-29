# Web Frontend Docs

## Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS v4
- next-intl for EN, ES-AR, and RU
- Zustand for local workflow state
- TanStack Query for interactive server-state
- React Hook Form + Zod for forms

Current app baseline:

- Next.js `16.2.4`
- React `19.2.x`
- Tailwind CSS v4
- Source code under `app/src/`

## Delivery Rules

- Frontend code lives under `app/src/`.
- Approved behavior and layout come from `html-prototypes/`.
- Visual tokens come from `app/src/styles/tokens.css` and `docs_capsule_zero/project/frontend/styling.md`.
- CI frontend baseline is `npm run typecheck` plus `npm run build`.
- Web implementation remains mobile-first: 375px is the primary layout target, then tablet and desktop.
- Keep Server Components as the default. Add `use client` only for interactivity, forms, uploads, local state, and browser APIs.
- Initialize server SDK clients lazily inside functions or request-scoped utilities. Do not create service clients at module scope with required runtime env vars.
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

## State Management

| State type | Owner | Examples |
|---|---|---|
| Route/data state | Next.js Server Components | Initial dashboard, capsule result, profile read |
| Interactive server-state | TanStack Query | Wardrobe grid, imports, uploads, catalog search, favorites |
| Local workflow state | Zustand | Guided Journey steps and in-progress selections |
| Form state | React Hook Form + Zod | Auth, profile, item edit, upload confirmation |
| Persistent source of truth | Supabase/Postgres | Profiles, items, capsules, outfits, coins |

## API Client Rules

- Use server actions for simple authenticated app mutations.
- Use Route Handlers for uploads, background removal, marketplace parsing, catalog search, Lava.top webhooks, and externally callable endpoints.
- Keep Zod request/response schemas near the feature module and reuse them across Server Actions and Route Handlers.
- Keep generated OpenAPI types in `app/src/lib/api/generated/`; update them whenever `docs_capsule_zero/adr/openapi.yaml` changes.
- Never call service-role endpoints from Client Components.
- Client Components should use TanStack Query for fetch/mutate flows that need loading, retry, optimistic updates, or cache invalidation.

## i18n

- Primary locale: `en`
- Supported locales: `en`, `es-AR`, `ru`
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

Add before dependent feature slices:

- `@supabase/supabase-js`
- `@supabase/ssr`
- `@tanstack/react-query`
- `next-intl`
- `lava-top-sdk` only if it is adopted after a small integration spike; otherwise use typed server-side HTTP against Lava.top OpenAPI endpoints

## Payments

The web app owns Lava.top purchase entrypoints for v0.1. Native mobile apps must not show purchase CTAs or external payment links; they only reflect coin balance after webhook-backed fulfillment.

## Quality Follow-Up

The repository already has CI and PR gates. Before Phase 5 product-code PRs, configure linting and local commit hooks so the Phase 4 quality gate is fully closed.
