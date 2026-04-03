# Review Contract

This document defines the machine-readable contract used by Capsule Zero's repository-owned `AI Review` gate.

## Purpose

Native reviewer backends remain vendor-specific, but the repository gate normalizes them to one merge policy. To make that reliable, the selected reviewer must emit machine-readable output for the current PR head commit in a format the gate can validate.

## Claude Review Contract

Claude review is validated from the top-level comment published by `claude[bot]` through `.github/workflows/claude-review.yml`.

That Claude comment must begin with exactly three lines:

```text
AI_REVIEW_AGENT: claude
AI_REVIEW_SHA: <head-sha>
AI_REVIEW_OUTCOME: pass|advisory|block
```

- `<head-sha>` is the current PR head commit SHA routed by the gate.
- `pass` means no material findings.
- `advisory` means low-severity-only findings that do not block merge.
- `block` means at least one finding should block merge.

The repository-owned Claude review workflow injects these values through the native Claude action system prompt.

Claude may also publish inline PR comments for concrete findings, but the top-level marker comment is the machine-readable contract that the gate validates.

## Codex Review Contract

Codex review is validated using native GitHub output from `chatgpt-codex-connector[bot]`.

The gate matches a Codex review when all of the following are true:

- the review is submitted by `chatgpt-codex-connector[bot]`
- the review targets the current PR head SHA
- on a fresh gate cycle, the review is created after the routing trigger for that cycle
- on a rerun with no new routing trigger, the gate may reuse an already-published valid Codex review for the same PR head SHA

Codex currently publishes:

- a top-level GitHub pull-request review
- inline review comments tied to that review
- severity badges in inline comments such as `P1` or `P2`

Codex may publish a `COMMENTED` top-level review even when some inline findings should block merge. Capsule Zero therefore evaluates the associated severity badges instead of relying on the top-level review state alone for Codex.

Capsule Zero treats those native severity badges plus the top-level Codex review as the machine-readable contract for Codex.

## Required Result Mapping

Capsule Zero normalizes vendor-native output as follows:

- Claude `AI_REVIEW_OUTCOME=pass`
  - `AI Review` passes
- Claude `AI_REVIEW_OUTCOME=advisory`
  - `AI Review` passes
- Claude `AI_REVIEW_OUTCOME=block`
  - `AI Review` fails
- Codex `APPROVED`
  - `AI Review` passes
- Codex `COMMENTED` with only `P3` findings or no inline findings
  - `AI Review` passes
- Codex `CHANGES_REQUESTED`
  - `AI Review` fails
- Codex `COMMENTED` with any `P0`, `P1`, or `P2`
  - `AI Review` fails

Any other state is treated as unverifiable and fails closed.

## Blocking vs Advisory

- Low-severity-only findings are advisory and must not block merge.
- Correctness, regression, architectural, workflow, data-flow, and missing-test findings can be blocking.
- Missing durable-doc updates are blocking when the PR changes architecture, workflow, or behavior and the repo docs were not updated accordingly.
- For Codex native review comments, Capsule Zero maps `P0`, `P1`, and `P2` to blocking findings.
- For Codex native review comments, Capsule Zero maps `P3` to advisory findings.
- If Codex submits any inline review finding without a recognized `P0-P3` severity badge, the gate fails closed.

## Routing and Validation

- `AI Review` reads `AI_REVIEW_AGENT`.
- It validates the selected reviewer output against the current PR head SHA.
- On reruns of the same head, validation may reuse the latest valid native reviewer output already attached to that head SHA.
- It validates the reviewer-specific contract and normalized result.
- If no valid selected-reviewer output is found before timeout, the check fails closed.
