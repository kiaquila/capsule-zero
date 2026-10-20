# Tasks

- [x] Commit failing guest/landing tests (`333dcaf` before implementation).
- [x] Port reference; add Mixed and validate browser state.
- [x] Update active product and agent decision contract.
- [x] Verify visuals and guest functional checks (22 passed, Chromium/WebKit); request native Codex review on PR #164.
- [ ] Final-head GitHub checks and review: linked PR #164 is authoritative; fix and resolve every finding before merge.
- [ ] Wait two minutes after current head is merge-ready; recheck and merge as explicitly authorized.

## Process Memory

### Dead Ends

- Primary checkout has unrelated unresolved conflicts. Use isolated `worktrees/guest-onboarding-port` at fresh origin/main; do not disturb existing changes.
- Context7 returned monthly quota exceeded; read bundled Next.js 16 lazy-loading docs instead.

- Initial browser run used 127.0.0.1, which Next.js dev blocked for resource requests. Use localhost for local browser verification; no product-origin relaxation needed.

- WebKit correctly defers off-screen lazy images. The image-integrity POM now scrolls each into view before decode; no application loading behavior changed. Guest/landing checks: 22 passed in Chromium and iPhone WebKit.

- Final-head baseline failed on three fresh runners at the same ECR Go manifest with HTTP 429. Blind reruns stopped; Google cache returned the identical immutable OCI index and a real pull passed. Native review initially emitted an unbound receipt; re-request produced completed clean state on the full SHA.

### Decisions

- Reference is a Capsule Zero fork sharing base `5492617`; port only guest app assets/behavior, retaining Capsule Zero CI, provider guards and process tooling.
- Mixed is the existing union of supported categories, not a new gender restriction.

- Preserve selection order when restoring validated browser state; deduplicate IDs and reject out-of-pool entries.
- Reuse canonical group compatibility; preserve reference enumeration and presentation instead of broadening this exact port into Stage 2.
- Visual review of source/port desktop/mobile items/photo/result/auth passed; exact result/auth pixel match. Store raw comparison and asset hashes alongside first-step screenshots.
- Reference component/file size warnings are accepted for this transfer: splitting source markup in this PR would add review churn; no new framework/service is introduced.

- Native Codex P2 found the reference empty-role hint on incompatible colors. Test-first repair (`16afdc2`) adds a localized neutral replacement path while preserving layout/counting. This correctness fix is recorded as the only behavior exception to the reference transfer.

- Extend the existing runner builder helper to warm those same pinned Go/Node images through Google cache and verify the exact Go module version and Dockerfile Node major/full tag/variant before tagging. The first warmed hosted run passed Go-dependent checks, then failed on the Node ECR quota; extend the same path to Node rather than rerunning the blocked registry. Preserve canonical FROM, tests/container smoke/build/cache export and the runner-only daemon boundary. A version bump requires refreshing the pinned digest; failure is explicit.

- Native CI P2: same-major Node variant changes could alias the pinned Debian image under another tag. A failing fixture reproduced it; bind the digest mapping to the exact full Dockerfile tag and reject Alpine/other Debian/full variants before Node pull/tag.

### Known Issues

- Reference signup does not attach guest selections to an account; browser data remains local. This follow-up is disclosed, not silently represented as shipped.
- Subsequent UX changes require the user's separate feedback and PR, per request.
