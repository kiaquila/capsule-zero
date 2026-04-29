# Implementation Plan: Sprint 0 Foundation

## Technical Approach

1. Treat `docs_capsule_zero/adr/openapi.yaml` as the source for API metadata and
   enforce it with a repository script.
2. Keep generated clients intentionally small in this PR: operation metadata and
   error code types are enough to prove the regeneration path before feature
   slices add strongly typed payload clients.
3. Establish Supabase tables and RLS policies around the accepted architecture
   decisions, especially `items.visibility` plus `wardrobe_entries.user_id`.
4. Add Flutter as a shell only, with env-driven Supabase init and placeholders
   for routing, deep links, and localization.
5. Wire linting and local hooks into the existing GitHub baseline checks without
   changing the trusted AI review gates.

## Validation

- Run `npm run check:repo`.
- Run `npm run check:api-contract`.
- Run `npm run lint`.
- Run `npm run typecheck`.
- Run `npm run build`.
- Run `npm run test`.

Flutter and Supabase runtime validation remains blocked until local SDKs and
project credentials are provisioned.
