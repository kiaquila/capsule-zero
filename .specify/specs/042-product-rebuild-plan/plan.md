# Implementation Plan: Product Rebuild Plan

**Branch**: `feat/product-rebuild-plan` | **Date**: 2026-07-16 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `.specify/specs/042-product-rebuild-plan/spec.md`

## Summary

Land an evidence-backed product reset centered on OPR and value before registration, immediately retire the cancelled coin/Lava API and provisioning surface, actualize decision-carrying source docs, and preserve SENAR evidence for Stage 0.

## Technical Context

**Language/Version**: Markdown, OpenAPI 3.1 YAML, generated TypeScript; repository Node.js guard scripts
**Primary Dependencies**: Existing repository documentation, OpenAPI generator, and validation scripts
**Storage**: N/A
**Testing**: API client generation/check, API contract check, `git diff --check`, feature-memory check, repository-baseline check, focused `rg` scans, GitHub required checks
**Target Platform**: GitHub repository documentation, agent onboarding, and production-shape API contract
**Project Type**: Product planning plus contract/support retirement; no application behavior
**Performance Goals**: N/A
**Constraints**: No application runtime behavior, provider implementation, schema, deploy, or Supabase changes; do not decide open founder questions
**Scale/Scope**: Root plan/research, decision-carrying docs/memory, authoritative OpenAPI/generated output and API/runtime-env guards, support templates/deprecation comments, and one SENAR feature-memory folder

## Constitution Check

- Spec-first/SENAR: this folder records Goal, Scope, verification, negative scenarios, and Process Memory before Stage 0 is declared merge-ready.
- Test-first: narrow waiver applies because the contract/support retirement changes no application behavior; generation, contract, command, and diff evidence replace a failing-test-first loop.
- Single source of truth: `PRODUCT-PLAN.md` is canonical until MVP, and changed decision-carrying docs are actualized in the same change.
- Direct, not dictate: open founder decisions remain open; the plan records options and gates without fabricating approval.
- No Supabase recoupling: the env deletion and generated-client retirement add no Supabase env, client, workflow, compose, nginx, schema, or provider implementation.
- Simplicity: reuse the existing methodology, OPR, basicity, and SENAR templates instead of adding parallel product or process systems.

## Verification

| Acceptance criterion | Evidence |
|---|---|
| AC-001 | `rg -n "PRODUCT-PLAN.md.*canonical|canonical.*PRODUCT-PLAN.md" AGENTS.md CLAUDE.md` returns the two onboarding pointers. |
| AC-002 | `rg -n "^### D[1-4]|^### Этап [0-4]|^\| \*\*Q[1-6]" PRODUCT-PLAN.md` returns the accepted decisions, stages, and open questions. |
| AC-003 | `! rg -n "coinBalance|INSUFFICIENT_BALANCE|WEBHOOK_AUTH_FAILED|/api/billing|/api/webhooks/lava|CoinSpend|LavaInvoice|LavaWebhook" docs_capsule_zero/adr/openapi.yaml app/src/lib/api/generated/openapi.ts scripts/check-api-contract.mjs` and `! rg -n "billing|LAVA_|Create coin products|test purchase" scripts/check-runtime-env.mjs app/.env.local.example docs_capsule_zero/project/devops/sprint-0-runtime-provisioning.md` both exit 0 after generation; the documented placeholder env check exits 0. |
| AC-004 | `rg -n "рекомендацию \*\*категории\*\*|цвет v0 не рекомендует|Отдельный цветовой сигнал|argmax по \*\*категориям\*\*" PRODUCT-PLAN.md PRODUCT-RESEARCH.md` returns category-only v0 and the separate Stage 2 signal. |
| AC-005 | `rg -n "Repo-wide sweep|ручной список не считается полным|generated artifacts|provider contracts/fixtures|миграции" PRODUCT-PLAN.md` returns the non-exhaustive repository-wide completion criterion. |
| AC-006 | `test -s .specify/specs/042-product-rebuild-plan/spec.md && test -s .specify/specs/042-product-rebuild-plan/plan.md && test -s .specify/specs/042-product-rebuild-plan/tasks.md && node scripts/check-feature-memory.mjs` exits 0. |
| AC-007 | `rg -n "Monetization-model uncertainty" .specify/memory/market-context.md && ! rg -n "Coin conversion sensitivity|Coin pricing stays" .specify/memory/market-context.md` exits 0. |
| AC-008 | Path/diff review shows only documentation/memory, OpenAPI/generated output, env deletion, and provider-contract deprecation comments; `git diff --check`, `node scripts/check-api-contract.mjs`, and `node scripts/check-repo-baseline.mjs` exit 0. |
| AC-009 | `rg -n "Core OPR|Expanded OPR|Запрещённый гибрид|core/all-items hybrid|core-образов / все вещи" PRODUCT-PLAN.md PRODUCT-RESEARCH.md .specify/specs/042-product-rebuild-plan/spec.md` returns both consistent models and the rejected hybrid. |
| AC-010 | Every tracked decision-carrying downstream document returned by the focused coin/Lava inventory contains `Monetization freeze (2026-07-16)` or is the canonical plan/research/onboarding/feature memory itself. |

Negative scenario evidence:

- NS-001: AC-003 confirms code generation and operational templates contain no payment provisioning, balance, billing, or webhook surface.
- NS-002: plan/research evidence for AC-004 confirms Stage 1 rejects arbitrary color ranking when compatible colors tie on Δcore.
- NS-003: AC-009 confirms optional layers cannot lower OPR under the rejected hybrid accounting.
- NS-004: AC-008 path evidence confirms no runtime behavior, UI behavior, schema, infrastructure, provider implementation, or Supabase coupling is added.

## Project Structure

```text
PRODUCT-PLAN.md
PRODUCT-RESEARCH.md
AGENTS.md
CLAUDE.md
app/.env.local.example
app/src/lib/api/generated/openapi.ts
app/src/lib/providers/contracts.ts
scripts/check-api-contract.mjs
scripts/check-runtime-env.mjs
.specify/
├── memory/
│   ├── constitution.md
│   └── market-context.md
└── specs/042-product-rebuild-plan/
    ├── spec.md
    ├── plan.md
    └── tasks.md
docs_capsule_zero/
├── adr/
│   ├── api-spec.md
│   └── openapi.yaml
└── ... decision-carrying docs with explicit monetization freeze
mobile/README.md
worker/README.md
```

**Structure Decision**: Keep the plan/research discoverable at repository root, retire the active legacy surface in its established OpenAPI/generated/support locations, update decision-carrying sources in place, and store completion evidence in the standard SENAR feature folder.

## Complexity Tracking

No constitution violation is introduced; no complexity exception is required.
