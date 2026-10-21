# 059 — Complete MVP cut algorithm: documentation contract

## Goal

Make the owner's 2026-10-21 clarification binding across project documentation: completed MVP
uses colour, separate simplicity/currentness and whole-outfit cut compatibility together,
including the pre-signup experience, counts and recommendations.

## Scope

In: PRODUCT-PLAN D4/Q5, canonical methodology, terminology, constitution/agent rules, product
specifications, guest rollout/versioning, features/screens/copy, web/API/backend/mobile target
contracts, research attribution and launch gates. Preserve historical delivery evidence with
explicit supersession notes. Define manually labelled presets and deterministic MVP rules.

Out: application code, catalog re-labelling, implementation of compatibility tables, schema/migrations,
OpenAPI/generated-client changes, new ML/services, UI redesign, merchant-image enablement or new spend.
CI recovery only: the required test job uses the identical official PostgreSQL 16 image from the
digest-pinned Google cache after two ECR quota failures, with its existing workflow test and CI
runbook updated. This is infrastructure/support scope, not an application implementation.

This PR completes the **documentation** contract only. Stage 2 must implement and validate it before
MVP acceptance; a docs merge cannot imply the currently shipped guest-v1 satisfies that gate.

## Decisions and Reuse

- Reuse `capsule-methodology.md` §6 for item tagging/basicity and `outfit-generation.md` §2.5 for
  eligibility and generation, plus existing categories/gap/counting rules. Do not create a parallel
  methodology document or calculator. Existing guest `evaluate`/`recommend` and colour helpers are
  the implementation starting point; Go methodology remains a target, not an existing package.
- Basicity measures simple construction/no excessive decoration only; initial rule values 100/50/0
  are engineering defaults, unknown remains unknown. Currentness is a separate dated categorical
  review; price, designer brand, purchase age and fashion popularity are not cut judgements.
- Start with manually reviewed own-image presets; no ML requirement for MVP. Owned non-basic/dated
  pieces and favourites remain; low simplicity alone is not a save or capsule-membership rejection.
- Dated looks deterministically fail DATED_CUT; unknown remains unreviewed unless a known failure dominates. Owned-current 0/50 items can pass reviewed whole-look rules; simplicity orders display results by the canonical tuple, not counts. New-item candidates require 100/current; canonical cut/preset keys resolve otherwise equal recommendation ties.
- Owned-item review has an explicit owner-guided reference action and designated catalog-reviewer fallback with persisted states/evidence, authorized completion, invalidation and recomputation. Personal pieces need not be replaced by presets to enter verified results.
- Whole-look rules return pass/fail/unreviewed with a reason. Only passes affect verified counts,
  coverage and gains. Keep existing OPR denominator, accessory cap, roles and recommendation priorities;
  extend accessory dedup identity with the reviewed style signature so different silhouettes survive.
- Guest-v1 remains an interim immutable version. Future cut-aware recalculation is explicit and
  versioned, preserving the original snapshot. The implementation PR updates actual contracts and
  storage as needed, with browser/API/mobile parity and TDD.
- The paper supports attributes beyond colour; it does not supply a modern-cut guarantee, our rule
  thresholds or an automatic optimality guarantee. Evidence: [Hsiao & Grauman §3 and table 4](https://arxiv.org/html/1712.02662), inspected 2026-10-21.
- Assumption/revisit: rule-based finite-preset MVP is the smallest maintainable approach. Revisit
  scores, review cadence and rule coverage using held-out FITB/false-positive and stylist evidence.
  The implementation spec must freeze sample sizes and numeric acceptance thresholds before tuning;
  a missed threshold blocks MVP release, not just a future enhancement.

## Acceptance Criteria

- **AC1:** PRODUCT-PLAN and constitution require all four dimensions before MVP acceptance, including
  guest/account generation, OPR, Layering Coverage, gaps and recommendation gains. Stage 1 is interim.
- **AC2:** Canonical docs distinguish simplicity, currentness and whole-look compatibility with
  implementable manual tags, review cadence, explainable/versioned rules, unknown handling and owned
  favourite preservation. Explicit verdict precedence, 100/current new-preset eligibility, owned-item display ordering and recommendation tie-breaks are specified with expected parity examples. No brand/price ban or claim of universal combinability remains active.
- **AC3:** Features, screens, copy, taxonomy and technical target contracts consume the same canonical
  rules. Colour-only shortcuts, the 70%-of-categories criterion and low-basicity-only rejection are
  superseded. Historical snapshots/verification are preserved; actual API/schema changes are not claimed.
- **AC4:** Release acceptance requires application TDD, category coverage, negative fixtures, frozen
  baseline/held-out FITB and stylist review with predeclared numeric gates and version/client parity.
  No guaranteed 80–150 floor is advertised after cut filtering. Research distinguishes evidence from
  the selected product approach and does not import unproven mathematical guarantees.
- **AC5:** Scope is documentation plus the narrow PostgreSQL CI recovery above; repository/feature-memory/API parity checks and the required
  GitHub baseline-checks, guard, AI Review, test and osv-scan pass for the final head. Native Codex
  review is requested from the owner's account, findings are addressed and all threads resolved.

## Negative Scenarios

The contract explicitly rejects colour-valid/cut-failed, all-pairs-pass/full-look-fail,
simple-but-dated treated as current, unknown/overdue review treated as pass, failed looks increasing
gain/coverage/count, brand-based exclusion, deletion/rejection of favourite owned items and silent
recalculation of guest-v1 snapshots. These are implementation test requirements, not tests claimed
as executed by this docs PR.

TDD waiver: documentation and CI infrastructure/support only; no application behaviour or executable API/schema is changed.
Required remote checks remain mandatory and are not waived.
