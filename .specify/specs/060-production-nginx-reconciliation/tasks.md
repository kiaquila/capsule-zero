# Tasks 060

- [x] Implement forward reconciliation and wrapper checksum preflight
- [x] Verify isolated success/failure/rollback scenarios and update durable docs
- [ ] Native review and all required checks on exact head; stable readiness >=120 seconds
- [ ] Normal merge, provision installed wrapper and verify production CD/files/live SHA

## Process Memory

### Dead Ends

PR #170 production smoke found a stale installed method map while the sync marker already named the deployed SHA. Comparing repository commits cannot establish installed-file state. A second marker/hash cache would retain the same class of trust problem and is unnecessary for five small configuration files.

### Decisions

Always apply the existing transaction on forward deploys. Preserve rollback's `false` branch. Validate a token-free DELETE route after reload because GET health alone missed the original regression. Retain backup if restoration fails and stop before reload on failed nginx validation. Add a read-only installed-wrapper checksum preflight; no self-update mechanism or additional CI privileges.

### Known Issues

Installed root-owned deployment scripts remain operator-provisioned by design; checksum preflight makes stale tooling a visible failed deployment. Local validation: all 54 script tests, shell/YAML parsing and repository gates passed. Original wrapper failed the installed-drift regression. Final production evidence is pending delivery.
