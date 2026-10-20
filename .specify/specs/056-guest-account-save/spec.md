# Guest progress → account

## Goal

Preserve the exact selected presets and guest result durably in the authenticated account after email registration or Google sign-in, without losing progress or duplicating it on retry.

## Scope

In: PostgreSQL owner-scoped saved guest collections and selected wardrobe records; existing auth continuation; account result/dashboard access and My Items projection; idempotent retries; EN/RU loading/error/retry states. Reuse guest catalog/evaluation/result, auth/session/provider and database migration helpers. Out: guest photo uploads, merchant imagery, monetization, Stage-2 algorithm or unrelated onboarding redesign.

## Decisions

- Current Go API persists profiles/uploads only; API wardrobe is fixture-backed. Add the smallest real guest-progress bounded context rather than pretend the existing mock is durable. Presets remain our own imagery. Persist validated preset attributes and ordered selection as a versioned guest-v1 result basis; derive the exact existing result with the existing evaluator, not another outfit algorithm.
- Saved guest results are collections, not canonical capsules: arbitrary guest palettes/category counts must not bypass formal capsule rules. Selected items enter the personal wardrobe as uncapsulated; existing account data is appended, never replaced.
- Explicit Save creates an immutable browser intent before auth. A continuation route consumes that intent only after a verified session; normal auth without that intent has no import side effect. Persist only acknowledged success; errors retain picks, session and retry ID. A globally unique transfer ID cannot be claimed by another account or reused with changed content.
- Context7 is unavailable (monthly quota). Use bundled Next.js 16 server-action/cookies/redirect guides. UI system is complete-but-inconsistent; reuse guest glass, buttons and status styles, with designer live review. No new tokens/services/spend.

## Acceptance Criteria

1. Email signup/sign-in and Google callback continue an explicitly requested save; already authenticated users save directly. Failed/canceled auth keeps the draft.
2. Authenticated durable save preserves wardrobe type, all selected items, order and exact guest-v1 result after reload, a new session and browser draft deletion.
3. Repeated/concurrent identical transfer saves return one collection and deduplicate owner preset wardrobe records. Changed payload or another owner with the same transfer returns conflict; existing account collections/items remain.
4. All API reads/writes derive ownership from Kratos; unauthenticated access is rejected; cross-owner detail/patch is invisible. Unknown/out-of-pool/duplicate/empty or oversized input is rejected. Result statistics and metadata are derived from trusted preset snapshots, not client-submitted totals/URLs.
5. Saving has accessible busy/error/retry states; storage failure/auth failure/network loss do not clear choices or force another signup. A completed transfer is not replayed into another account.
6. The saved collection is reachable from the account dashboard; selected items retain the active EN/RU name and appear in My Items/uncapsulated and retain status/favorite edits durably. Unsupported metadata/delete/capsule actions are unavailable for guest-backed records until those domains migrate. Active docs/OpenAPI/client/feature memory describe the delivered scope.

Negative scenarios are explicit in AC3–5; no waiver. Application TDD is required.

Production save uses migration 0004 and an optional guest progress port, leaving frozen Supabase untouched. Native API smoke is part of the existing Kratos container check; PostgreSQL concurrency/isolation integration runs in the required `test` check.
