# Native Codex review

## Goal

Require complete current-head native Codex evidence without a separate audit or relaxed protection.

## Scope

Read-only CI review gate, observed-response parser reuse, offline regressions and durable delivery docs. Application behavior is unchanged.

## Acceptance Criteria

- All observed complete clean response variants pass.
- SHA annotations, formal-review presence, stale or spoofed replies and unresolved findings cannot pass.
- Native code/security lifecycle and historical negative state remain authoritative.

## Negative Scenarios

A clean response gains arbitrary prose or a security finding; a pending machine summary follows a receipt; HEAD moves during final verification. All block success.

## TDD Waiver

Infrastructure/support-only change; application failing-test-first history is out of scope under AGENTS §testing and tests/README.md.
