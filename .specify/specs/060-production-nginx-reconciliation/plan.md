# Plan 060 — Production nginx reconciliation

## Approach

Remove the Git-marker shortcut rather than adding a second drift cache. Always reuse the existing complete backup/install/validate/reload/smoke transaction on forward deploys. A graceful nginx reload per forward deploy is acceptable alongside existing container replacement; explicit image rollbacks keep their config exemption. Check the installed wrapper checksum in the existing SSH step; operators continue provisioning reviewed root-owned scripts.

## Reuse Check

Searched `capsule-zero-deploy` backup_nginx_config/apply_host_nginx_config/restore_nginx_config/smoke_prod_edge, cd-prod `Deploy over SSH`, `scripts/lib/cd-prod-tags.test.mjs` and `ci-builder-cache.test.mjs`. Extend those runtime units and existing workflow-test fixture pattern. A dedicated nginx wrapper regression fixture is needed because existing tests execute image-tag/build policy, not privileged deployment transactions; it rewrites absolute paths into a disposable directory and stubs privileged/network commands without adding a production test mode.

## Verification

| Criterion | Evidence                                                                                                                                                                                                                                                            |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-001    | `node --test scripts/lib/*.test.mjs`: 54/54 passed; wrapper fixture reconciles five files, two site links and default-site removal on initial and same-SHA invocations. Original wrapper failed the drift regression with the marker already naming the target SHA. |
| AC-002    | Same executable suite passed certificate/syntax/reload/smoke/method failures with restoration of previous regular files, broken link and absent path. Syntax and file-copy restoration failures preserve backup and skip reload.                                    |
| AC-003    | Forward simulation expects token-free DELETE 401 and rejects 405; rollback simulation preserves nginx and skips the newer route. External production smoke remains a final PR delivery receipt.                                                                     |
| AC-004    | Executed actual workflow SSH step with current/stale/unreadable wrapper: only the matching checksum reaches sudo. Installed production checksum will be verified after merged-script provisioning.                                                                  |
| AC-005    | Pending: PR exact-head review/checks/readiness and production CD/deployment/live SHA receipts                                                                                                                                                                       |

| AC-006    | OSV run [40574593908](https://github.com/kiaquila/capsule-zero/actions/runs/40574593908) reports fast-uri 3.1.8 affected by GHSA-333x-w4r6-6crp, GHSA-w74x-v6f9-j3xg, GHSA-wjr9-j795-jxcr and GHSA-xhq7-xmqj-769h; all list 3.1.9 as fixed. Existing override and only the fast-uri lock record updated. Node 22.22.1/npm 10.9.2 clean install resolved 3.1.9; lint (0 errors, 117 existing warnings), typecheck, repository baseline, feature-memory and diff checks passed. Structural assertions preserve every other lock record including frozen Supabase and native libc selectors. Required final-head security/regression checks remain the merge condition. |

## Delivery

Install the reviewed wrapper on the production host after merge and before the deploy job invokes it; checksum preflight fails closed if provisioning is missed. Preserve the previous root-owned script for rollback. Never read production env or emit credentials. After CD succeeds, compare the managed files and enabled-site targets to the deployed checkout, then verify public health and auth routes. Record final operational receipts in the PR.

## Local Validation

`bash -n infra/scripts/capsule-zero-deploy`, parsed production CD YAML plus `bash -n` for every embedded run step, `npm run check:repo`, `npm run check:feature-memory -- --worktree` and `git diff --check` passed. Full script suite: 54 tests passed, zero skipped. Production read-only preflight verified certificate chains for capsulezero.app and www and the currently installed shared configuration. No runtime configuration was modified during local verification.

The production delivery probe will append only a harmless comment to the installed hardening file (no directive change), creating a checksum mismatch while Git nginx files remain unchanged. The normal CD invocation must restore exact source bytes and correct enabled-site links; compare all five files and both links afterward. Preserve a root-owned backup and restore if delivery fails.
