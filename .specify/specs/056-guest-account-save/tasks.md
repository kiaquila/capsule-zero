# Tasks

## Scope supersession — MVP cut contract (2026-10-21)

Historical delivery scope/evidence below remains a record of this slice. Its colour-only baseline,
cut deferral, simple-category rejection or exact-reference counting cannot waive the updated MVP gate.
[PRODUCT-PLAN D4/Q5](../../../PRODUCT-PLAN.md) now requires separate simplicity/currentness and whole-outfit checks
before MVP acceptance, including the guest/account path. Canonical rules: [methodology §6.1](../../../docs_capsule_zero/project/methodology/capsule-methodology.md)
and [outfit generation §2.5](../../../docs_capsule_zero/project/methodology/outfit-generation.md). Spec 059 aligns documentation only; application implementation
and quality validation remain outstanding. Preserve immutable guest-v1 results under their original
version; do not silently recalculate historic snapshots or rewrite this slice's old verification results.

- [x] Commit failing application tests before implementation (browser registration reaches dashboard; all five guest API routes return 404).
- [x] Durable guest save and owner-scoped wardrobe records; real PostgreSQL race/integration and Go suite passed.
- [x] Explicit email/Google/direct continuation, error/retry and account result/dashboard access. Transfer ID stays bound across auth; another tab cannot silently replace the request.
- [x] Docs/contracts and designer live review; final application build, lint and typechecks passed. Local full browser run and targeted fixes recorded in plan.md; current-head PR gates follow.
- [ ] PR, green required gates/native review, resolve findings, wait two minutes and merge.

## Process Memory

### Dead Ends

- Concurrent profile PR #166 advanced main to d292592 while reviews ran. Merged its profile/API changes, retained the Ubuntu 24 runner pin, and extended its strict profile fetch fixture for the now-real empty guest wardrobe endpoint.
- Primary checkout contains unrelated unresolved conflicts; isolated worktree starts from fresh origin/main 4f4c205.
- Context7 monthly quota exceeded; bundled current Next.js docs are available.
- Existing API wardrobe is fixture-backed and cannot honestly satisfy durable account save.

- First CI run restored Ubuntu 24 WebKit binaries on the Ubuntu 26 runner from a Linux-only cache; all WebKit launches failed on missing ICU 74. Removed the browser cache and always install matching binaries/dependencies, following the Playwright CI recommendation.

- The same CI run exposed a cold-route Turbopack `Unexpected end of JSON input` on parallel My Items requests. An isolated webpack dev experiment did not eliminate static-path JSON errors and slowed the suite; it was reverted. The merged main runner pins Ubuntu 24, and its proven Turbopack test setup, parallelism, assertions and standalone origin guard are retained.

- The expanded RU dashboard + five wardrobe sections exhausted the 30-second test budget in CI (176 passed, one failure). Trace places the last click at 29.65 seconds with no hung operation. Split it into focused locale scenarios with the same shared setup and unchanged limits/assertions.

### Decisions

- Reuse the exact guest evaluator/result; save a versioned immutable preset selection and attributes. A saved guest collection is distinct from a canonical capsule, respecting palette/category rules.
- Persist explicit save intent across email/Google navigation and use globally unique immutable transfer IDs; never import unrelated local draft on ordinary login.
- Keep source design and add only required saving/error/retry/account access states; designer provided the scenario contract before implementation.

- Real Kratos/API/PostgreSQL container smoke passed exact snapshot/retry/ownership and durable favorite/status PATCH probes plus existing registration/recovery/login flows.
- Test-only commit `12e96a9` exposed favorite loss on reload before wiring shared guest-only mutations into existing wardrobe shells. No optimistic success is shown on transport failure.
- Designer live review passed error/retry, saved result and dashboard at 1440×1000 and 390×844; screenshot evidence is under `.runtime/guest-account-save-visual/`.

- API contract and generated clients cover all five routes; embedded preset metadata is parity checked. Shared fetch/httpx/auth/profile boundaries reused.

- Test-only commit `beb1f9e` records interrupted continuation and new-session reopening. Full document navigation after awaited auth and durable save eliminates overlapping App Router transitions into a consumed intent. Final Google continuation: 6/6 first-attempt passes across Chromium/WebKit.

- Native review identified local-only guest capsule membership. TDD `f0af52d` reproduced capsule/edit affordances; the shared detail panel now restricts guest records to persisted capabilities in all five shells. Capsule actions and handlers reject those records; catalog visibility and repair notes are also read-only.

- Second native review identified English-only guest wardrobe names after RU save (RED `7f9abc3`). Localize the existing snapshot projection without changing the persistence or locale-free repository contract; cover all five wardrobe pages in the existing browser scenario (GREEN in Chromium and iPhone WebKit).

- Third native review found a separate English-only dashboard mapper. Extend the existing RU scenario and profile mapper checks; localize dashboard recent names from the same trusted snapshot. Reuse scan also found guest records eligible for the legacy capsule picker; exclude them until capsule membership is durable, consistent with the earlier capability restriction.

### Known Issues

- Other legacy wardrobe/capsule domains remain outside this slice. Guest favorite/status actions are durable; legacy name/edit/delete and formal capsule CRUD retain their existing adapters and are not claimed as migrated. Those unsupported controls are hidden or read-only for saved guest records; no local-only success is exposed.
- Existing lint size/complexity warnings remain non-blocking. `readGuestIntent` checks untrusted/corrupted browser data in one parser (complexity 18); the atomic Go save transaction intentionally stays together. Extended existing UI shells retain their established layout responsibilities.
