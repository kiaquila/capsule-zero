# 046 — Plan & Verification

Доковый/методологический слайс с механически generated OpenAPI projection (нет hand-written app-кода)
— верификация по конституции §VII: contract/codegen guard, доковая консистентность и grep-аудит вместо
failing-test-first. Никаких инфраструктурных изменений. Каждая строка ниже привязана к acceptance
criterion из `spec.md`.

## Verification

Финальный verification-прогон выполнен 2026-07-22 относительно свежего `origin/main`; команды ниже
повторяются после коммита/push, а фактический PR HEAD SHA фиксируется в теле PR, чтобы не создавать
самоссылочный SHA внутри самого коммита.

| AC | Evidence | Result |
|---|---|---|
| AC-001 | `rg -c "ЗАКРЫТ 2026-07-21" PRODUCT-PLAN.md` → **4** (Q1/Q2/Q3/Q6). `rg -n "Открыт только \*\*Q5|Этап 1 разблокирован" PRODUCT-PLAN.md` находит оба актуальных статуса | ✅ |
| AC-002 | `outfit-generation.md` §3.2/§3.3: Core и Accessory входят в обе части OPR, Layering — ни в одну и имеет отдельный score; forbidden hybrid явно отвергнут | ✅ |
| AC-003 | `rg -n "A_max = 3|Deterministic v0 selection|3 accessory items total|OPR 143.2" docs_capsule_zero/project/methodology/outfit-generation.md` подтверждает два разных потолка, детерминированный selection и пересчитанный пример `Σ C(5,k)×3^k=376` | ✅ |
| AC-004 | `rg -n "mutually color-compatible|color-valid Core combination|uncapsulated|Zero-result state" docs_capsule_zero/project/methodology/{capsule-methodology,gap-analysis,outfit-generation}.md` подтверждает color-valid минимум, объяснимый zero-result и save без нарушения capsule thresholds | ✅ |
| AC-005 | `glossary.md` §Color Temperature и `colors.md` §Temperature Metadata говорят только «metadata / not a compatibility filter» — активного temp/shade-правила нет; `colors.md` несёт блок «Canonical compatibility source» + note о симметрии ахроматов | ✅ |
| AC-006 | `git diff --name-only origin/main -- app api worker mobile infra deploy .github docker-compose.yml ':(exclude)app/src/lib/api/generated/openapi.ts'` → **пусто**: кроме generated contract projection слайс не меняет runtime/config и не вводит coin/Lava/Supabase поверхность | ✅ |
| AC-007 | repo-wide stale-formula sweep: `rg -n -i 'outfits */ *items|outfits per item|образов */ *вещей|комплектов к вещам' AGENTS.md CLAUDE.md PRODUCT-PLAN.md docs_capsule_zero .specify --glob '!**/046-*/plan.md'` → **пусто**. Onboarding, spec 001, UI copy, components, feature/glossary/design-system/constitution указывают новый знаменатель | ✅ |
| AC-008 | `categories.md` перечисляет 23 Core + 12 Layering + 13 Accessory = **48**; `npm run check:api-contract` подтверждает синхронные OpenAPI/generated поля role/slot/custom result без name-based lookup | ✅ |
| AC-009 | `outfit-generation.md` §3.4/§4 задаёт formula+priority; OpenAPI несёт отдельные `layeringCoverage` diagnostics и `impactUnit`; strict-v0 examples = +50 pp на отсутствующее измерение, partial coverage помечен guest/Stage-2 only; feature/screen/i18n contract показывает score отдельно | ✅ |
| Negative | Покрыты forbidden hybrid; full accessory enumeration; cap 4-vs-3; несовместимая guest triad; invalid capsule-on-signup; ambiguous category role; mixed impact units; production CTA dead-end; coin/Supabase runtime regression | ✅ |
| Review | Native Codex P2 + code-reviewer + architect: все merge-blocking findings сведены в T008 и исправлены; повторный `@codex review` запускается на финальном SHA | ✅ |

> TDD-waiver (конституция §VII) действует: generated client — механическая проекция контракта, а
> hand-written app behavior отсутствует; `test` не гейтит по существу. Финальный SHA + повтор этих
> команд фиксируются в PR body (SENAR Done Gate).
