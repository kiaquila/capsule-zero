# 053 — Tasks

- [x] Fetch origin; verify GitHub and human actor; create isolated worktree.
- [x] Read repository, frontend and test instructions; inspect reuse candidates.
- [x] Reproduce pinned Kratos rejection and underscore acceptance.
- [x] Commit red regressions (`eb68194`).
- [x] Implement, document and verify focused mock/full-stack scenarios, full browser suite (112 passed / 12 opt-in skips) and static/build checks.
- [ ] Publish ready-for-review PR and trigger native review as human.
- [ ] Resolve findings and verify all current-head gates.

## Process Memory

### Dead Ends

- Suspected underscore ban disproved by pinned Kratos reproduction.
- Personal-name minimum of three is absent on current main. The username minimum is a separate justified constraint and remains unchanged.

- A full-suite profile click arrived before React attached the handler. Reuse the existing ProfilePage retry in `openPasswordForm` before editing SSR inputs; do not add a timing sleep.
- A cold full-stack run timed out while other validation work overlapped; the isolated rerun passed all eight cases. Keep build and browser server verification sequential.

### Decisions

- Use stable Kratos UI message IDs, never parse localized English reasons or expose submitted credentials.
- Optional registration name may be omitted; a supplied name must be nonblank and at most 80 Unicode characters.
- Preserve existing personal-name min(1) and add explicit regression tests.

### Known Issues

- Historical production logs are unavailable; cause is reproduced from the screenshot inputs on the committed runtime.
- Native review and CI must still be verified on final head before merge readiness.
