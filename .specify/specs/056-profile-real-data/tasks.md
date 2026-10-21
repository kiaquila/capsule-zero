# Tasks 056

- [x] Commit failing tests (`971f0ba`).
- [x] Implement snapshot, form presentation and clear semantics.
- [x] Verify locally and update docs; publish ready-for-review PR.
- [ ] Resolve review findings, verify all gates, wait two minutes and recheck before authorized merge.
- [ ] Verify production CD.

## Process Memory

### Dead Ends

Context7 lookup returned monthly quota exceeded; use the installed Next.js cookies reference instead.

### Decisions

No auth inventory exists in AuthPort or the current API. Report unavailable rather than synthesizing devices from identity/token metadata. Existing saved values cannot be classified as fake by comparing them with former defaults. Preserve them.

### Known Issues

Fields outside the current API contract retain the existing user-bound browser cookie persistence. Cross-device profile storage for those fields is outside this fix. Delivery evidence pending.

### Verification Progress

- Red: snapshot/action (3 failing assertions), EN/RU browser forms (2 failures), Go blank-location validator (1 failure), all for the intended missing behavior.
- Green: 12 targeted Playwright cases across Chromium/WebKit and both locales; all Go vet/package tests; app/e2e typechecks and lint, generated API contract.
- Sandbox prevents local httptest port binding; rerun with standard escalation passed. No product change was needed for that environment restriction.

### CI environment repair

- PR #166 initial native review completed with no findings; baseline, guard, OSV and AI Review passed.
- [Initial test run](https://github.com/kiaquila/capsule-zero/actions/runs/39429346899) failed 54 WebKit launches. The job used Ubuntu 26.04 and restored `playwright-Linux-<lockhash>`; the cached browser required ICU74 but install-deps installed ICU78. Chromium and module regressions passed.
- Pin only the test job to Ubuntu 24.04; include OS release and architecture in the cache key. Keep every browser project and gate required. The final-head rerun is the Linux execution evidence.


Follow-up: spec 057 adds real Kratos session inventory; spec 056 unavailable behavior remains only for unsupported providers or inventory failures.
