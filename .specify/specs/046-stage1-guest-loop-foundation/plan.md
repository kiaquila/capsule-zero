# 046 — Plan & Verification

Методологический слайс с generated OpenAPI projection и точечным runtime-alignment двух существующих
экранов. Hand-written app scope добавлен после native Codex P1 и выполнен test-first: исходный
красный e2e зафиксирован коммитом `69600a3`, исправленная structural-layer инварианта — RED-коммитом
`453a7e0`, hybrid/dominant-color regressions — `eacaf2d`, zero-base remove path — `706c189`, затем
canonical accessory dedup — `0a4fcd4`, затем реализация доведена до green. Никаких инфраструктурных
изменений. Последний native-review цикл добавил RED-коммит `ec099a8` на полную проекцию всех 48
встроенных категорий в runtime role/slot catalog. Независимый code-review затем добавил RED-коммит
`154bcf6` на полную category/gender/role/slot матрицу и provider-scoped Journey projection. Каждая
строка ниже привязана к acceptance criterion из `spec.md`. Финальная review-линия усилила последний
контракт builder-level regression-тестом; mutation proof с удалённым `supportedIds` воспроизводит
утечку полного каталога и падает до восстановления GREEN-реализации.
Следующий native Codex P2 добавил RED-коммит `69529ee`: mock/API-backed capsule creation сохранял
legacy `items×categories` numerator вместо того же preview algorithm.
CI на `81557ea` выявил portability-gap самих regression-тестов: локальный Node 25 умел загрузить
app `.ts` напрямую, а CI Node 20 завершался до коллекции тестов. T015 переводит app-module loading
на явный `jiti` runtime и подтверждает тот же focused suite именно на Node `20.20.2`.

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
| AC-006 | `git diff -U0 origin/main -- app/src/lib/{outfit-productivity,color-compatibility}.ts app/src/components/{dashboard,capsule-result,guided-journey} app/src/lib/providers/mock tests/e2e/specs/capsule-result \| rg '^\\+.*(SUPABASE_\|@supabase\|LAVA_\|coin)'` → **пусто**: точечный runtime scope не вводит coin/Lava/Supabase поверхность; infra/deploy/workflows/compose diff остаётся пустым | ✅ |
| AC-007 | repo-wide stale-formula sweep: `rg -n -i 'outfits */ *items|outfits per item|образов */ *вещей|комплектов к вещам' AGENTS.md CLAUDE.md PRODUCT-PLAN.md docs_capsule_zero .specify --glob '!**/046-*/plan.md'` → **пусто**. Onboarding, spec 001, UI copy, components, feature/glossary/design-system/constitution указывают новый знаменатель | ✅ |
| AC-008 | `categories.md` перечисляет 23 Core + 12 Layering + 13 Accessory = **48**; `npm run check:api-contract` подтверждает синхронные OpenAPI/generated поля role/slot/custom result без name-based lookup | ✅ |
| AC-009 | `outfit-generation.md` §3.4/§4 задаёт formula+priority; OpenAPI несёт отдельные `layeringCoverage` diagnostics и `impactUnit`; strict-v0 examples = +50 pp на отсутствующее измерение, partial coverage помечен guest/Stage-2 only; feature/screen/i18n contract показывает score отдельно | ✅ |
| AC-010 | RED-1: missing live selectors, `69600a3`. RED-2: structural blazer incorrectly created outfits, `453a7e0`. RED-3: impossible no-shoes fixture + stale-numerator/new-denominator tote preview + absent dominant-color contract, `eacaf2d`. RED-4: zero-base remove path, `706c189`. RED-5: duplicate same-slot/same-color accessories inflated variants, `0a4fcd4`. RED-6: runtime catalog exposed only 31/48 documented categories, `ec099a8`. RED-7: incomplete gender projection and global catalog leakage into a provider-scoped Journey, `154bcf6`; builder-level mutation proof после review: удаление `supportedIds` → regression fails с **127 unexpected IDs**. RED-8: persisted capsule without shoes returned legacy numerator **4** instead of **0**, `69529ee`; dedup mutation proof: удаление `Set` превращает одну valid base с duplicate IDs в **4** outfits. CI portability RED: run `29944207430` on Node `20.20.2` failed before collection at direct app `.ts` import; after explicit `jiti` loading, the focused Node `20.20.2` run is **6 passed**. GREEN: valid base = `1 outfit / 3 Core = 0.3`, blazer keeps OPR and lifts coverage to 50%, tote regenerates `2 / 4 = 0.5`, removing shoes gives `0.0` + `N/A`, three duplicate scarves collapse to one variant, all 48 built-ins match the canonical category/gender/role/slot matrix, `buildGuidedJourneySnapshot` renders only provider-returned IDs, mock/API-backed creation persists unique IDs и `0` для invalid pair / `1` для valid top+bottom+shoes base; visual → `10 passed`; full Chromium/WebKit + standalone origin guard → `67 passed, 8 skipped`; app/e2e typecheck + lint, API contract and production build повторены на финальном SHA | ✅ |
| Negative | Покрыты forbidden hybrid; full accessory enumeration; same-slot/color dedup; cap 4-vs-3; несовместимая guest triad; invalid persisted numerator; invalid capsule-on-signup; ambiguous category role; mixed-gender category projection; provider-catalog leakage; mixed impact units; production CTA dead-end; coin/Supabase runtime regression | ✅ |
| Review | Native Codex два P2 и два P1 + code-reviewer + architect: доковые findings закрыты в T008, runtime display drift — в T009, неполный 31/48 runtime category catalog — в T010, canonical gender/provider projection — в T011, builder-level regression efficacy — в T012, persisted numerator drift — в T013, persisted-ID dedup test efficacy — в T014, Node-20 CI portability — в T015; повторный `@codex review` запускается после push каждого fix-цикла | ✅ |

> Generated client остаётся механической проекцией контракта. Для добавленного hand-written runtime
> поведения действует полный TDD-контракт: отдельный RED-коммит → GREEN-реализация. Финальный SHA +
> повтор команд фиксируются в PR body (SENAR Done Gate).
