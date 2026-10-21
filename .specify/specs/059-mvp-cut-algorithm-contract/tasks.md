# Tasks

- [x] Fetch origin/main, verify GitHub main, compare local main; isolate from unrelated conflicted checkout.
- [x] Reuse existing basicity/item-tagging and generation docs; inspect actual guest evaluate/recommend/snapshot boundaries.
- [x] Update PRODUCT-PLAN D4/Q5, canonical methodology and release gate for a complete pre-MVP algorithm.
- [x] Align active product/technical docs, custom-category guidance, research and old-slice supersession.
- [x] Local documentation audit (65 Markdown files/121 added links), whitespace, baseline, feature-memory, API/client parity and 42 gate-script tests passed.
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

- Native P2 follow-up PRRT_kwDORvfoks6u3PEK: reconcile §4 colour options with §2.5. Apply tier/gain/layer/category priorities, canonical cut/preset tie-break, then expose only equal-gain colours with equivalent winning-cut guidance. A colour unique to another cut is excluded despite equal gain. Align PRODUCT-PLAN/research; colour-only all-max behaviour remains historical guest-v1, taste scoring is optional later work.

- Native P2 follow-ups PRRT_kwDORvfoks6u23sl / PRRT_kwDORvfoks6u23su: align ShoppingListRow, result feature/screen, MVP acceptance/prototype map, backend target and emotion-map row with reviewed suitable cut/rule reason; update example/handoff too. Replace diversity display ranking with canonical §2.5 simplicity order; retain §3 selection/caps. Historical 014 gets supersession headers only.

- Concurrent PR #170 advanced main during the final review. Merge its session-revocation changes unchanged; recheck the documentation-only diff, baseline, feature memory, updated API/client parity (52 operations/26 Go registrations) and existing gate-script tests before requesting review of the resulting head.

- Native P2 follow-up PRRT_kwDORvfoks6u2e1l: remove the last active guided-journey acceptance/state/edge-case instructions that reject a non-basic item. All three now clarify only an unmappable category/role and preserve owned items regardless of low simplicity; audit the entire feature for the retired phrases.

- Native follow-ups PRRT_kwDORvfoks6u1yyc / PRRT_kwDORvfoks6u1yyj (P2): state that Stage 2 must add the cut-review controls/states to existing item details; do not claim they ship today. Complete accessory identity with category, construction and derived basicity as well as all other reviewed tags; a 50/100 construction example cannot collapse by item ID.

- Native P2 follow-ups PRRT_kwDORvfoks6u1PM5/PRRT_kwDORvfoks6u1PNC: audit every tracked Markdown 058 mention; replace only cut-contract references (preserve shipped no-demo 058). Restore the complete historical 013 spec body from main, not just FR-006. Add reproducible regression assertions for both documentation errors.

- Additional native findings PRRT_kwDORvfoks6u0wvw (P1) and PRRT_kwDORvfoks6u0wv4 (P2): define owned-item currentness transitions, actors and evidence in §6.1 with a curator fallback; restore historical 013 FR-006 verbatim and retain only the superseding header. Correct all supersession headers to feature 059 after the numbering collision.

- Concurrent PR #169 merged feature 058 while this PR was under review. Renumber this unmerged documentation feature to 059, retain the existing shipped 058 folder, and merge fresh main without undoing its empty-account fix.

- Native Codex finding PRRT_kwDORvfoks6u0pX9 (P1) identified unspecified signal effects. Fixed §2.5 with dated→fail, unknown→unreviewed/fail precedence, 100/current candidate eligibility, explicit owned-current 0/50 display ordering, canonical recommendation tie-breaks and expected parity outcomes; aligned PRODUCT-PLAN, item rules, API/MVP contract and copy.

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
