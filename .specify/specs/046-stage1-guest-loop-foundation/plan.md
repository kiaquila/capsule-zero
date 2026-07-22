# 046 — Plan & Verification

Доковый/методологический слайс (нет app-кода) — верификация по конституции §VII: доковая
консистентность и grep-аудит вместо failing-test-first. Никаких инфраструктурных изменений. Каждая
строка ниже привязана к acceptance criterion из `spec.md`.

## Verification

Прогнано на HEAD ветки перед коммитом (2026-07-21). Evidence обновить финальным прогоном на PR HEAD SHA.

| AC | Evidence | Result |
|---|---|---|
| AC-001 | `rg -c "ЗАКРЫТ 2026-07-21" PRODUCT-PLAN.md` → **4** (Q1/Q2/Q3/Q6 в §4). §8 п.1 = «открыт только Q5»; §5 строка зависимостей = «все закрыты … Этап 1 разблокирован»; каждая из 4 §4-строк несёт конкретное решение, не «до Этапа 1» | ✅ |
| AC-002 | `outfit-generation.md` §3.3 — таблица трёх counting-role: Core (числ+знам), Accessory (числ+знам), Layering (ни там ни там → отдельный score); §3.2 явно называет forbidden hybrid и что он не используется. Категория участвует в OPR симметрично | ✅ |
| AC-003 | `rg -n "A_max\|per base look\|not.*full power set" outfit-generation.md` → §3.1 задаёт агрегатный потолок на base look (`A_max`, v0=3): числитель ≤ base looks × (1+`A_max`), рост линейный; §3.1 несёт контрпример OPR>100 без потолка. **Исправлена ложная claim «cannot explode» (adversarial-review opr-math)** | ✅ |
| AC-004 | `rg -n "≥ 1 top\|1 top \+ 1 bottom" …` → триада в трёх файлах: `outfit-generation.md:165` (`≥ 1 top + ≥ 1 bottom + ≥ 1 pair shoes`), `gap-analysis.md:93`, `capsule-methodology.md:125`; `outfit-generation.md` §5 больше не «3+ items». Ни один не требует min-8-cat/min-7-item от гостя | ✅ |
| AC-005 | `rg` по активным правилам temp/shade → только «temperature is metadata / not a compatibility filter» (glossary.md:39, colors.md:160) — активного temp/shade-правила нет; `colors.md` несёт блок «Canonical compatibility source» + note о симметрии ахроматов | ✅ |
| AC-006 | `git diff main -- docs_capsule_zero PRODUCT-PLAN.md .specify \| grep '^+' \| rg -i "coin\|lava\|SUPABASE_\|supabase client"` → **пусто** (clean). Новых coin/Supabase-поверхностей нет; legacy под D2 freeze-баннером не расширен | ✅ |
| AC-007 | `rg -n "number of items in capsule\|Outfits / items count\|generated outfits / number of items" docs_capsule_zero .specify/memory \| rg -v outfit-generation.md` → **пусто**: старая формула OPR не осталась ни в одном активном доке; конституция §II (v1.6)/`design-system.md`/`glossary.md`/`f-015-opr.md` указывают на `outfit-generation.md` §3 | ✅ |
| Negative | Покрыты AC-002 (forbidden hybrid не используется), AC-003 (агрегатный потолок, не мультипликативный power-set), §7.1 (capsule-валидации не возвращаются в гостя), §3.1 (набор без core-триады не base look), AC-006 (нет coin/Supabase) | ✅ |
| Adversarial review | 4-линзовый workflow (opr-math / cross-doc / senar-spec / drift-regression) — 12 находок: 4 CONFIRMED major (accessory-explosion, §4-рекомендация без аксессуаров, AC-004 overclaim, drift в f-015/glossary) + minors. Все major исправлены; drift-доки (f-015, glossary, design-system, constitution §II v1.6) сверены. Nits (achromatic-base note, negative plural) применены | ✅ |

> TDD-waiver (конституция §VII) действует: слайс доковый, `test` не гейтит по существу. Финальную
> строку evidence обновить прогоном на PR HEAD SHA в теле PR (SENAR Done Gate).
