# Implementation Plan: Product Rebuild Plan

**Branch**: `feat/product-rebuild-plan` | **Date**: 2026-07-16 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `.specify/specs/042-product-rebuild-plan/spec.md`

## Summary

Land a documentation-only, evidence-backed product reset centered on OPR and value before registration, actualize the decision-carrying source docs, and preserve SENAR evidence for Stage 0.

## Technical Context

**Language/Version**: Markdown; repository Node.js guard scripts
**Primary Dependencies**: Existing repository documentation and validation scripts
**Storage**: N/A
**Testing**: `git diff --check`, feature-memory check, repository-baseline check, focused `rg` scans, GitHub required checks
**Target Platform**: GitHub repository documentation and agent onboarding
**Project Type**: Documentation-only product planning
**Performance Goals**: N/A
**Constraints**: No application/runtime behavior, provider, schema, deploy, or Supabase changes; do not decide open founder questions
**Scale/Scope**: Root product plan/research, decision-carrying memory/onboarding docs, and one SENAR feature-memory folder

## Constitution Check

- Spec-first/SENAR: this folder records Goal, Scope, verification, negative scenarios, and Process Memory before Stage 0 is declared merge-ready.
- Test-first: narrow waiver applies because no application code changes; command and diff evidence replace a failing-test-first loop.
- Single source of truth: `PRODUCT-PLAN.md` is canonical until MVP, and changed decision-carrying docs are actualized in the same change.
- Direct, not dictate: open founder decisions remain open; the plan records options and gates without fabricating approval.
- No Supabase recoupling: no env, client, workflow, compose, nginx, schema, or provider implementation is changed.
- Simplicity: reuse the existing methodology, OPR, basicity, and SENAR templates instead of adding parallel product or process systems.

## Verification

| Acceptance criterion | Evidence |
|---|---|
| AC-001 | `rg -n "PRODUCT-PLAN.md.*canonical|canonical.*PRODUCT-PLAN.md" AGENTS.md CLAUDE.md` returns the two onboarding pointers. |
| AC-002 | `rg -n "^### D[1-4]|^### Этап [0-4]|^\| \*\*Q[1-6]" PRODUCT-PLAN.md` returns the accepted decisions, stages, and open questions. |
| AC-003 | `rg -n -i "Payments|Payment-provider|Monetization is UNDECIDED|Mobile payments|Monetization-model uncertainty" AGENTS.md .specify/memory/market-context.md` shows explicit hold language; diff review shows no live provisioning instruction in changed decision-carrying docs. |
| AC-004 | `rg -n "рекомендацию \*\*категории\*\*|цвет v0 не рекомендует|Отдельный цветовой сигнал|argmax по \*\*категориям\*\*" PRODUCT-PLAN.md PRODUCT-RESEARCH.md` returns category-only v0 and the separate Stage 2 signal. |
| AC-005 | `rg -n "Repo-wide sweep|ручной список не считается полным|generated OpenAPI client|provider contracts/fixtures" PRODUCT-PLAN.md` returns the non-exhaustive repository-wide completion criterion. |
| AC-006 | `test -s .specify/specs/042-product-rebuild-plan/spec.md && test -s .specify/specs/042-product-rebuild-plan/plan.md && test -s .specify/specs/042-product-rebuild-plan/tasks.md && node scripts/check-feature-memory.mjs` exits 0. |
| AC-007 | `rg -n "Monetization-model uncertainty" .specify/memory/market-context.md && ! rg -n "Coin conversion sensitivity|Coin pricing stays" .specify/memory/market-context.md` exits 0. |
| AC-008 | `git diff --name-only origin/main...HEAD` contains only root Markdown, `.specify/**`, `AGENTS.md`, and `CLAUDE.md`; `git diff --check` and `node scripts/check-repo-baseline.mjs` exit 0. |

Negative scenario evidence:

- NS-001: focused diff/`rg` review confirms changed decision-carrying docs say payment provisioning, balances, provider contracts, and purchase flows are on hold until Stage 4.
- NS-002: plan/research evidence for AC-004 confirms Stage 1 rejects arbitrary color ranking when compatible colors tie on Δcore.
- NS-003: AC-008 path evidence confirms no runtime, UI, API, schema, infrastructure, or Supabase-coupling file is changed.

## Project Structure

```text
PRODUCT-PLAN.md
PRODUCT-RESEARCH.md
AGENTS.md
CLAUDE.md
.specify/
├── memory/
│   ├── constitution.md
│   └── market-context.md
└── specs/042-product-rebuild-plan/
    ├── spec.md
    ├── plan.md
    └── tasks.md
```

**Structure Decision**: Keep the product plan and research discoverable at repository root, update the established memory/onboarding sources in place, and store completion evidence in the standard SENAR feature folder.

## Complexity Tracking

No constitution violation is introduced; no complexity exception is required.
