# Review Contract

This document defines the machine-readable contract used by Capsule Zero's repository-owned `AI Review` gate.

## Purpose

Native reviewer backends remain vendor-specific, but the repository gate normalizes them to one merge policy. To make that reliable, the selected reviewer must emit a standard GitHub pull-request review for the current PR head commit in a format the gate can validate.

## Claude Review Contract

Claude review must begin the top-level review summary with exactly two lines:

```text
AI_REVIEW_AGENT: <agent>
AI_REVIEW_SHA: <head-sha>
```

- `<agent>` is `claude`.
- `<head-sha>` is the current PR head commit SHA routed by the gate.

The repository-owned `AI Review` workflow injects these values into the Claude review prompt.

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

Capsule Zero treats those native severity badges as the machine-readable contract for Codex.

## Required Review State Mapping

The selected reviewer must use GitHub's standard pull-request review states:

- `APPROVED`
  - no blocking findings
  - `AI Review` passes
- `COMMENTED`
  - advisory-only findings
  - `AI Review` passes
- `CHANGES_REQUESTED`
  - at least one blocking finding
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
- It routes the selected native review backend.
- It waits for a matching GitHub review on the current PR head SHA.
- On reruns of the same head, Codex validation may reuse the latest valid native Codex review already attached to that head SHA.
- It validates the reviewer-specific contract and review state.
- If no valid selected-reviewer output is found before timeout, the check fails closed.
