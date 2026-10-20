# Tasks

- [x] Commit failing application tests before implementation (browser registration reaches dashboard; all five guest API routes return 404).
- [ ] Durable guest save and owner-scoped wardrobe records.
- [ ] Auth continuation, error/retry and account result access.
- [ ] Validation, docs/contracts and designer live review.
- [ ] PR, green required gates/native review, resolve findings, wait two minutes and merge.

## Process Memory

### Dead Ends

- Primary checkout contains unrelated unresolved conflicts; isolated worktree starts from fresh origin/main 4f4c205.
- Context7 monthly quota exceeded; bundled current Next.js docs are available.
- Existing API wardrobe is fixture-backed and cannot honestly satisfy durable account save.

### Decisions

- Reuse the exact guest evaluator/result; save a versioned immutable preset selection and attributes. A saved guest collection is distinct from a canonical capsule, respecting palette/category rules.
- Persist explicit save intent across email/Google navigation and use globally unique immutable transfer IDs; never import unrelated local draft on ordinary login.
- Keep source design and add only required saving/error/retry/account access states; designer provided the scenario contract before implementation.

### Known Issues

- Other legacy wardrobe/capsule domains remain outside this slice; this change must not claim they are all migrated.
