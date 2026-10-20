# Tasks

- [ ] Commit failing guest/landing tests.
- [ ] Port reference; add Mixed and validate browser state.
- [ ] Update active product and agent decision contract.
- [ ] Verify visuals, functional checks and native Codex review; resolve findings.
- [ ] Wait two minutes after current head is merge-ready; recheck and merge as explicitly authorized.

## Process Memory

### Dead Ends

- Primary checkout has unrelated unresolved conflicts. Use isolated `worktrees/guest-onboarding-port` at fresh origin/main; do not disturb existing changes.
- Context7 returned monthly quota exceeded; read bundled Next.js 16 lazy-loading docs instead.

### Decisions

- Reference is a Capsule Zero fork sharing base `5492617`; port only guest app assets/behavior, retaining Capsule Zero CI, provider guards and process tooling.
- Mixed is the existing union of supported categories, not a new gender restriction.

### Known Issues

- Reference signup does not attach guest selections to an account; browser data remains local. This follow-up is disclosed, not silently represented as shipped.
- Subsequent UX changes require the user's separate feedback and PR, per request.
