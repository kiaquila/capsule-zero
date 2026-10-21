# Spec 058 — Account wardrobe without demo fallback

## Goal

New production accounts show only their own saved wardrobe, with no demo garments or demo capsule.

## Scope

Remove the API provider's fixture-owner fallback for wardrobe and current capsule reads/mutations. Reuse the existing owner-filtered repositories and durable guest projection. Keep explicit local/CI mock fixtures and existing guest persistence. No migration, deletion, new endpoint, UI redesign or expansion of legacy CRUD.

## Decision

Production smoke on PR #165 found four demo garments appended to actual guest saves (6 → 10 desktop, 4 → 8 mobile). `buildFixtureBackedWardrobe` and `buildFixtureBackedCapsules` relabel the mock owner's records as the signed-in user's. Remove both adapters; use the already owner-filtered base repositories. This also stops demo capsule metrics and shopping suggestions from implying account ownership. Existing account-owned records remain eligible; guest records keep their authenticated Go/Postgres source. Full legacy CRUD migration remains separate. Revisit when the canonical wardrobe/capsule Go contexts land.

Reuse search: `createApiProviderRegistry`, `buildFixtureBackedWardrobe`, `buildFixtureBackedCapsules`, mock `listItems`/`getItem`/`getCurrentCapsule`, `withGuestWardrobe`, and the existing profile API provider tests. Existing repositories already enforce ownership, so no new runtime abstraction is needed.

Regression commit `3a43b94` fails three scenarios on the original provider: empty wardrobe contains fixture items, guessed demo ID returns an item, and saved guest contents include extra fixture IDs. The explicit mock/outage guard already passes.

## Acceptance Criteria

- AC-001: An API account without saved garments has an empty wardrobe and no current capsule; dashboard statistics, recent items and shopping suggestions contain no demo data.
- AC-002: Knowing a demo item ID does not permit read, favorite or status changes through another API account. Empty/filter/error paths never recover fixture-owner data.
- AC-003: Real saved guest garments are the exact wardrobe contents, preserve favorite/status/filter behavior and survive reconstruction of the API registry; saved guest result persistence remains unchanged.
- AC-004: Explicit mock mode retains its demo fixtures for local/CI usage.
- AC-005: Native current-head Codex review and all required checks pass; resolve addressed findings, wait at least two minutes after merge readiness, recheck and merge. Verify the deployed commit, an empty new production account and the existing desktop/mobile saved guest accounts after CD.

## Negative Scenarios

Guessed demo IDs, invalid mutations and upstream guest-item failures must not expose fixture data or turn failures into a successful demo wardrobe. No real data is deleted to hide the demo fallback.
