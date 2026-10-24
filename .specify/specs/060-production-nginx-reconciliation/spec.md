# Spec 060 — Production nginx reconciliation

## Goal

Every forward production deploy installs the nginx configuration from its verified checkout, even when Git history reports no nginx changes. Detect an outdated installed deployment wrapper before CD invokes it.

## Scope

Extend the existing root-owned deployment wrapper and SSH delivery step; retain argument validation, same-runtime image rollback, TLS verification, backup/restore and least-privilege sudo. Update delivery documentation and exercise real wrapper control flow in isolated temporary files. No application, dependency, auth, TLS, firewall or credential changes.

## Acceptance Criteria

- AC-001: Every `sync-host-nginx=true` invocation reconciles all five managed files, both enabled-site symlinks and removal of the default site, including same-SHA retries with a previously current sync marker.
- AC-002: Certificate, syntax, reload or smoke failure fails deployment and restores previous file contents, absent paths and symlinks. Failed restoration preserves its backup and never reloads a configuration that fails validation.
- AC-003: Forward smoke includes unauthenticated DELETE `/api/auth/sessions`, expecting 401 through host TLS nginx. A stale method map returning 405 fails delivery. Image rollback leaves nginx untouched and skips this newer-route probe.
- AC-004: CD compares SHA-256 of the installed root-owned wrapper with the workflow checkout and fails before sudo on mismatch or read failure. Provision the reviewed installed wrapper as an operator without extending CI sudo rights.
- AC-005: Native exact-head review, required checks, >=120-second stable readiness, normal merge and successful production CD precede completion. Production managed files/links match the merged checkout; live health SHA and protected GET/DELETE routes are verified.

## Negative Scenarios

Up-to-date marker plus stale file; same-SHA retry after drift; certificate/syntax/reload/health/DELETE failures; failed rollback validation; image rollback; stale/unreadable installed wrapper.

## TDD Waiver

Infrastructure/delivery/docs only: application failing-test-first is not required (AGENTS Tests; constitution VII). Executable regression simulations, shell/YAML validation and production smoke provide layer-appropriate evidence.
