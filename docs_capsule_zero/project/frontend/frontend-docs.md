# Frontend Docs

## Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS v4
- Zustand for local workflow state
- React Hook Form + Zod for forms

## Delivery Rules

- Frontend code lives under `app/src/`.
- Approved behavior and layout come from `html-prototypes/`.
- Visual tokens come from `app/src/styles/tokens.css` and `docs_capsule_zero/project/frontend/styling.md`.
- CI frontend baseline is `npm run typecheck` plus `npm run build`.

## Environment Notes

- Current production font setup uses `next/font/google`.
- Local sandboxed builds may fail without external network access when fetching Google Fonts.
- If offline builds become mandatory, migrate typography to local font assets.
