# Tasks 060

- [x] Implement forward reconciliation and wrapper checksum preflight
- [x] Verify isolated success/failure/rollback scenarios and update durable docs
- [ ] Native review and all required checks on exact head; stable readiness >=120 seconds
- [ ] Normal merge, provision installed wrapper and verify production CD/files/live SHA

- [x] Synchronize with current origin/main and rerun all 54 deployment-script tests
- [x] Patch fast-uri to 3.1.9; clean Node 22/npm 10 install, lint/typecheck and lock-boundary assertions passed
- [ ] Verify final-head required checks and refreshed native review

## Process Memory

### Dead Ends

PR #170 production smoke found a stale installed method map while the sync marker already named the deployed SHA. Comparing repository commits cannot establish installed-file state. A second marker/hash cache would retain the same class of trust problem and is unnecessary for five small configuration files.

### Decisions

Always apply the existing transaction on forward deploys. Preserve rollback's `false` branch. Validate a token-free DELETE route after reload because GET health alone missed the original regression. Retain backup if restoration fails and stop before reload on failed nginx validation. Add a read-only installed-wrapper checksum preflight; no self-update mechanism or additional CI privileges.

The 2026-10-27 merge-readiness scan exposed four fixable fast-uri 3.1.8 advisories. Reuse the existing override at patched 3.1.9 instead of changing security policy. Official upstream advisory GHSA-w74x-v6f9-j3xg confirms that patched release. Context7 was queried for npm guidance but its monthly quota was exhausted; official npm 10 installation documentation was used as fallback. This maintenance-only correction adds no runtime behavior or new unit.

npm 10 lock regeneration removed existing Linux libc metadata; restored every unrelated lock record from the synchronized head and asserted that only fast-uri differs. Clean installation passed again with the preserved selectors. The synchronized pre-security-fix head received genuine completed no-findings native review and a green AI Review; the security follow-up requires a fresh exact-head review.

### Known Issues

Installed root-owned deployment scripts remain operator-provisioned by design; checksum preflight makes stale tooling a visible failed deployment. Local validation: all 54 script tests, shell/YAML parsing and repository gates passed. Original wrapper failed the installed-drift regression. Final production evidence is pending delivery.
