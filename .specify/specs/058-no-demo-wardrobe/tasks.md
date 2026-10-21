# Tasks

- [x] Commit regression tests while the fixture fallback still fails them (`3a43b94`, three failures).
- [x] Remove fallback adapters and update affected active docs.
- [ ] Run focused checks and all required CI/native review gates.
- [ ] Resolve addressed review findings, wait two minutes, recheck and merge.
- [ ] Verify production empty account and saved desktop/mobile guest accounts.

## Process Memory

### Dead Ends

None. No production DB deletion is needed: extra garments are projected demo fixtures, not guest rows.

The initial test type imported the whole dashboard implementation into the stricter e2e TypeScript project and exposed unrelated unchecked-index diagnostics. Followed the existing profile test’s structural snapshot type instead; runtime dashboard behavior is still exercised. No compiler flags or product behavior were changed to accommodate the test.

### Decisions

Reuse the existing owner-filtered base repositories; remove the wrapper that changes their owner. Remove demo current-capsule fallback alongside garment fallback so empty account counts remain consistent. Leave explicit mock mode intact.

### Known Issues

Legacy non-guest wardrobe/capsule CRUD still uses the in-process implementation until its own Go slice. This task changes fixture fallback, not that persistence contract. Full account-save UI remains covered by spec 056.
