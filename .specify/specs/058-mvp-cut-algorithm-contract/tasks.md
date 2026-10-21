# Tasks

- [x] Fetch origin/main, verify GitHub main, compare local main; isolate from unrelated conflicted checkout.
- [x] Reuse existing basicity/item-tagging and generation docs; inspect actual guest evaluate/recommend/snapshot boundaries.
- [x] Update PRODUCT-PLAN D4/Q5, canonical methodology and release gate for a complete pre-MVP algorithm.
- [x] Align active product/technical docs, custom-category guidance, research and old-slice supersession.
- [x] Local documentation audit (61 Markdown files/121 added links), whitespace, baseline, feature-memory, API/client parity and 42 gate-script tests passed.
- [x] Recover required test service initialization after repeated ECR data-limit failures using the identical digest-pinned official PostgreSQL 16 image from Google cache; preserve every test and health check.
- [ ] Current-head required GitHub checks/native review; final evidence is the linked PR checks.
- [ ] Address review findings, resolve threads, wait two minutes after all readiness conditions and merge under owner authorization.

## Process Memory

### Dead Ends

- Test run 39619285862 failed twice before checkout because ECR returned `toomanyrequests: Data limit exceeded` for PostgreSQL 16. Retrying did not recover it. Google cache returned the official OCI index with digest `sha256:a902560563d3a5661228585f53474c5065e7f273b21ffd77e555a8b5682c5690`; use that pinned reference for the CI service only.

- Primary checkout has unrelated unresolved conflicts. Do not stash, reset or reuse it; clean
  `worktrees/cut-compatibility-mvp` starts from freshly fetched origin/main `85cfa6b`.
- Treating every basic garment as universally combinable would bypass actual outfit checks. Removed
  that claim and the circular “70%+ of categories” criterion.
- Treating a documentation PR or the shipped colour/category guest-v1 as complete cut implementation
  would misstate delivery; old evidence is retained with explicit supersession notes.

### Decisions

- Owner explicitly requests all documentation aligned, a ready PR, native Codex review from her
  account, all gates green and all threads resolved, then a two-minute wait before merge.
- Simplicity/currentness are independent; whole-look compatibility is a third check beyond colour.
  Prefer reviewed own-image presets and explainable versioned rules, not a new ML service.
- Extend the existing canonical §6/§2.5 responsibilities and keep role-specific count/coverage units.
  Candidate gains run through the same evaluator; style signatures prevent accessory-shape collapse.
- Preserve owned pieces/favourites and immutable saved guest-v1 semantics; concrete schemas and
  snapshot migration/recalculation arrive with application TDD in the implementation PR.
- Initial score values and six-month review cadence are explicit engineering defaults, not research
  results. Freeze measurable validation gates before implementation tuning; revisit using evidence.

### Known Issues

- The application still lacks the complete cut-aware MVP evaluator, reviewed metadata/tables and
  measured quality. This is accepted follow-up scope for implementation, a blocker to MVP release,
  not a blocker to this documentation contract. Do not label MVP complete after merging this PR.
- No merchant/photo gate, palette invariant, frozen provider or required check is relaxed.
