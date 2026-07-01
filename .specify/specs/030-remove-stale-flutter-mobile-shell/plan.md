# Plan: Remove Stale Flutter Mobile Shell

## Summary

Finish the mobile-stack cleanup by pairing the existing Flutter/Dart deletion with complete SENAR feature memory. The implementation remains limited to removing stale mobile artifacts, adjusting support tooling, and documenting that the future mobile scaffold is React Native.

## Technical Context

- runtime behavior changes: none; the stale Flutter shell is removed rather than replaced
- product roots: `mobile/`
- support paths: `scripts/`, `lint-staged.config.mjs`, `docs_capsule_zero/adr/api-spec.md`, `docs_capsule_zero/project/architecture/phase-5-entrance-checklist.md`, `docs_capsule_zero/project/mobile/mobile-docs.md`, `.specify/specs/030-remove-stale-flutter-mobile-shell/`
- accepted architecture: React Native mobile app delivered in a later spec

## Scope Boundaries

- in scope: stale Flutter/Dart file removal, mobile placeholder docs, API-generator target cleanup, runtime-tooling/env cleanup, feature memory
- out of scope: React Native implementation, OpenAPI contract changes, backend/mobile auth behavior, payment behavior, historical spec rewrites

## Constitution Check

- Spec-first/SENAR: this folder records goal, scope, acceptance criteria, negative scenarios, verification evidence, and process memory for a product-root PR.
- Production-stack pivot: the cleanup removes Flutter/Dart/Supabase mobile coupling and preserves React Native as the accepted mobile target.
- No Supabase recoupling: the change deletes `supabase_flutter` usage instead of extending it.
- Test-first verification: waived for this stale scaffold/tooling/docs cleanup because no executable mobile behavior remains; verification is command-based and the required `test` check must stay green.
- Simplicity: no new abstraction or guard exception is introduced.

## Verification

| Acceptance criterion | Evidence |
| --- | --- |
| AC-001 | `git ls-files mobile/` returns only `mobile/README.md`. |
| AC-002 | `grep -n "React Native\\|Flutter\\|supabase_flutter" mobile/README.md` shows the placeholder target, cleanup note, and no-reintroduction warning. |
| AC-003 | `grep -n "generateDart\\|mobile/lib/api/generated" scripts/generate-api-clients.mjs` returns no matches; `node scripts/generate-api-clients.mjs --check` passes. |
| AC-004 | `grep -n "flutter\\|mobile/.env.local\\|MOBILE_DEEP_LINK_SCHEME\\|name: \"SUPABASE_URL\"\\|name: \"SUPABASE_ANON_KEY\"" scripts/check-runtime-tooling.mjs scripts/check-runtime-env.mjs` returns no retired mobile matches; `node --check scripts/check-runtime-tooling.mjs scripts/check-runtime-env.mjs` passes; `node scripts/check-runtime-env.mjs --surface mobile` exits with `Unknown runtime surface(s): mobile`. |
| AC-005 | `grep -n "React Native\\|Flutter shell\\|later spec\\|mobile TypeScript generation is intentionally deferred\\|mobile path deferred" docs_capsule_zero/project/mobile/mobile-docs.md docs_capsule_zero/adr/api-spec.md docs_capsule_zero/project/architecture/phase-5-entrance-checklist.md mobile/README.md` shows the pivot, future-scaffold language, and deferred mobile generated-client contract. |
| AC-006 | `node scripts/check-feature-memory.mjs origin/main HEAD` passes via `.specify/specs/030-remove-stale-flutter-mobile-shell/{spec,plan,tasks}.md`. |

Supporting verification:

- `node scripts/check-api-contract.mjs` passes, proving the OpenAPI contract remains valid.
- `node --check scripts/generate-api-clients.mjs` passes after the generator target cleanup.
- Required GitHub checks `baseline-checks`, `guard`, `test`, and `AI Review` must pass on the final PR head SHA before merge.

Negative scenario evidence:

- NS-001: `git ls-files mobile/` proves no React Native source scaffold was introduced.
- NS-002: `git diff origin/main...HEAD -- mobile scripts docs_capsule_zero/project/mobile/mobile-docs.md` shows deletion of Flutter/Dart/Supabase mobile artifacts rather than new runtime coupling.
- NS-003: `node scripts/generate-api-clients.mjs --check` proves the remaining TypeScript client targets stay current.
- NS-004: the diff does not edit grandfathered Sprint 0 spec folders.

## Risks

- Risk: Removing generated mobile client output and mobile env validation could surprise later mobile implementers.
  Mitigation: `mobile/README.md`, `api-spec.md`, and the Phase 5 entrance checklist state that generated API types and mobile env validation are restored once the React Native scaffold defines its path and non-Supabase env surface.

- Risk: The cleanup is treated as product-root work by CI even though it removes stale code.
  Mitigation: add complete feature memory instead of weakening `scripts/check-feature-memory.mjs`.

- Risk: A nearby docs/tooling cleanup PR may touch the same generator block.
  Mitigation: keep this branch scoped to mobile target removal so any merge conflict is mechanical.
