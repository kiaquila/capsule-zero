# 046 — Stage-1 Guest-Loop Foundation: закрытие Q1/Q2/Q3/Q6 + модель OPR/онбординга

**Feature Branch**: `feat/046-stage1-guest-loop-foundation`
**Created**: 2026-07-21
**Status**: Ready for merge
**Input**: Фаундерские решения по PRODUCT-PLAN §4 (Q1/Q2/Q3/Q6), собранные в сессии 2026-07-21.

> **TDD (конституция §VII):** исходный слайс был доковым/методологическим, но native Codex review
> обнаружил уже наблюдаемый runtime drift: Dashboard и Capsule Result продолжали делить число
> образов на все вещи и не показывали Layering Coverage. Расширение устранено test-first: failing e2e
> зафиксирован отдельным коммитом `69600a3`; исправленная structural-layer инварианта — вторым
> RED-коммитом `453a7e0`; запрещённый stale-numerator/new-denominator hybrid и dominant-color
> validation — `eacaf2d`; zero-base remove path — `706c189`; повторное раздувание одинаковых
> аксессуаров одного slot/color — `0a4fcd4`; неполная category projection — `ec099a8`/`154bcf6`;
> legacy persisted numerator — `69529ee`. Затем display, preview и mock/API-backed creation
> переведены на общий калькулятор. Финальный OSV dependency fix изменяет только package metadata и
> lockfile, поэтому относится к support scope вне failing-test-first application-code контура.

## Goal

Зафиксировать в каноне (`PRODUCT-PLAN.md`) и в методологии принятые фаундером 2026-07-21 решения
Q1/Q2/Q3/Q6, задав **единую, консистентную модель OPR и гостевой петли** для Этапа 1 — так, чтобы
последующие слои реализации (гостевой инструмент) строились на одной истине, а уже существующие
Dashboard и Capsule Result не продолжали показывать пользователю устаревшую формулу.

## Scope

**In:**

- `PRODUCT-PLAN.md` — §4: Q1/Q2/Q3/Q6 помечены `✅ ЗАКРЫТ 2026-07-21` с решением; §5 (Этап 1):
  строка зависимостей → «все закрыты, Этап 1 разблокирован», пункты 2 и 4 переписаны на принятую
  модель; §7 doc-debt: строка Этапа 1 отмечена выполненной + флаг сверки числа «80–150»; §8 «Что
  дальше» актуализирован (открыт только Q5).
- `docs_capsule_zero/project/methodology/outfit-generation.md` — модель подсчёта образов и OPR
  (§3), accessory-combination ruleset (§2.3), Layering Coverage (§3.4), basicity/cut eligibility-хук
  (§2.5); «80–150» ограничено core base looks.
- `docs_capsule_zero/project/methodology/categories.md` — полная детерминированная карта всех 48
  категорий в Core/Layering/Accessory + position/slot; UI/API section не используется как роль.
- `docs_capsule_zero/adr/api-spec.md`, `openapi.yaml` и generated TypeScript projection —
  `Category.layer` presentation-only; machine-readable `algorithmRole`/`accessorySlot`, nullable
  custom-role result, `Capsule.layeringCoverage` diagnostics и `GapRecommendation.impactUnit` не
  допускают скрытого name/UUID lookup или смешения единиц.
- `docs_capsule_zero/project/methodology/capsule-methodology.md` — §1 указатель на модель OPR;
  §3 гостевой режим выводит палитру (не спрашивает); §7 разделён на §7.1 guest (color-valid минимум,
  zero-result alternatives, save в `uncapsulated`) и §7.2 capsule (post-signup).
- `docs_capsule_zero/project/methodology/gap-analysis.md` — §5 гостевые валидации + разметка
  capsule-строк; core-look impact и Layering Coverage разведены по единицам и приоритету.
- `docs_capsule_zero/project/methodology/colors.md` — блок «Canonical compatibility source» (Q6) +
  примечание о симметрии ахроматов для Go-движка.
- **Сверка формулы OPR во ВСЕХ активных доках тем же изменением (AGENTS §9):**
  `AGENTS.md`, `CLAUDE.md`, `.specify/specs/001-capsule-zero-mvp/spec.md`,
  `docs_capsule_zero/features/f-015-opr.md`, `docs_capsule_zero/glossary.md`,
  `docs_capsule_zero/i18n/ui-texts.md`, `docs_capsule_zero/project/frontend/components.md`,
  `.specify/memory/design-system.md` (глоссарий), `.specify/memory/constitution.md` §II (амендмент
  v1.6) — знаменатель = core+accessory items, структурные слои → Layering Coverage, число «80–150»
  помечено как пол для core-образов.
- `.specify/specs/046-stage1-guest-loop-foundation/` — эта спека (spec/plan/tasks) с SENAR-полями.
- `/app` — единый role-aware калькулятор OPR/Layering Coverage, подключённый к Dashboard и Capsule
  Result, а также к mock/API-backed capsule creation; EN/RU display copy, стабильные e2e-селекторы
  и обновлённые визуальные baseline.
- `tests/e2e/specs/capsule-result/productivity-metrics.spec.ts` — регрессия числителя/знаменателя,
  structural/accessory preview, каноническая `(slot, colorId)` дедупликация, dominant-color
  validation, provider-scoped category projection, persisted numerator и zero-base Layering Coverage;
  test-first история сохранена отдельными красными коммитами, а прямые app-module проверки
  загружаются явным TypeScript runtime и не зависят от экспериментальных возможностей Node 25.
- `app/package.json` и `app/package-lock.json` — точечное устранение OSV High findings для
  транзитивных `fast-uri` и `sharp`; product behavior и provider contracts не меняются.

**Out:**

- **Гостевой инструмент и новый маршрут** — реализуются отдельными слоями/PR (см. Roadmap ниже);
  interim-CTA лендинга остаётся на auth до полного P4 vertical slice. Runtime scope этого PR
  ограничен устранением обнаруженного drift на уже существующих Dashboard/Capsule Result.
- **Basicity / фасон (Q5)** — реализация Этапа 2; здесь только eligibility-хук в методологии.
- **Переделка post-signup Journey** — Этап 3.
- **Точное маркетинговое hero-число OPR** — фиксируется baseline-валидацией алгоритма v0 (FITB +
  человеческая панель) в слое Этапа 1 P3, не в этом PR; Этап 2 повторяет validation после basicity.
- **Формула/знаменатель OPR** сверены во всех активных доках **сейчас** (см. Scope In) — не
  откладываются. Отложено только конкретное **число** «80–150 из 30»: оно помечено как пол для
  core-образов; точный аксессуарный итог фиксирует baseline-валидация алгоритма v0 (Этап 1 P3).
- **Будущая настройка `A_max`/variant selection** — текущий v0-контракт уже закрыт: `A_max=3` +
  детерминированный farthest-first (`outfit-generation.md` §3.1). Валидация может создать новую
  версию правила, но не меняет контракт этого PR задним числом и не оставляет Q1 открытым.
- **Удаление legacy coin-строк** методологии — Этап 4 sweep (D2 freeze-баннер уже покрывает их).

## Acceptance criteria

- **AC-001 (закрытие вопросов):** `PRODUCT-PLAN.md §4` показывает Q1, Q2, Q3, Q6 как
  `✅ ЗАКРЫТ 2026-07-21` с конкретным решением в каждой строке; §8 п.1 отражает, что открыт только
  Q5; строка зависимостей Этапа 1 — «разблокирован».
- **AC-002 (консистентность OPR):** `outfit-generation.md` §3 задаёт модель, где каждая
  counting-role либо в числителе И знаменателе, либо ни в том ни в другом (с отдельным score) —
  таблица §3.3; запрещённый гибрид «core-образы / все вещи» явно не используется (layering-items
  исключены из знаменателя, не наказаны).
- **AC-003 (аксессуары ограничены АГРЕГАТНО, а не только per-outfit):** `outfit-generation.md` §3.1
  задаёт потолок аксессуаризованных вариантов **на каждый base look** (`A_max`, v0=3) и
  детерминированный farthest-first selection:
  числитель ≤ base looks × (1+`A_max`) — рост линейный, не мультипликативный; полный power-set
  аксессуаров НЕ перечисляется. Per-outfit правила §2.3 (1/слот, взаимная совместимость, ≤3/образ,
  дедуп) держат отдельный образ реалистичным. Явно показан контрпример без агрегатного потолка
  (OPR>100 на фиксированном ядре) и почему он отвергнут.
- **AC-004 (гость согласован в 3 файлах):** гостевой минимум = **1 верх + 1 низ + 1 обувь** (или
  платье + обувь) **в хотя бы одной взаимно color-valid комбинации**; «мин. 8 категорий / мин. 7
  вещей» не действуют, палитра выводится, zero-result объяснён, после signup вещи сохраняются как
  `uncapsulated` — согласованно в `capsule-methodology.md` §7.1, `gap-analysis.md` §5 и
  `outfit-generation.md` §5.
- **AC-007 (формула OPR без дрейфа):** ни один активный док не описывает старую формулу
  «outfits / all items»; конституция §II (v1.6), `design-system.md`, `glossary.md`, `f-015-opr.md`
  указывают на модель `outfit-generation.md` §3 и знаменатель core+accessory.
- **AC-005 (Q6 одна истина):** `colors.md` несёт блок «Canonical compatibility source»; ни один
  активный источник не предписывает temp/shade-совместимость как действующее правило.
- **AC-006 (regression guard):** слайс не вводит coin-поверхность и не рекочет Supabase —
  точечный `/app` runtime diff не содержит этих контрактов, а diff инфраструктурных/config
  поверхностей (`api/`, `worker/`, `mobile/`, `infra/`, `deploy/`, workflows, compose) пуст;
  doc-only упоминание `uncapsulated` — действующий wardrobe status, не legacy-backend coupling.
- **AC-008 (полная категория → роль):** `categories.md` однозначно отображает все 48 базовых
  категорий в Core/Layering/Accessory и position/slot; OpenAPI/клиент несут machine-readable role/slot,
  dress/skirt и tops-vs-layering неоднозначности закрыты, custom category без роли не попадает в
  метрики молча.
- **AC-009 (gap/recommendation исполнимы):** `outfit-generation.md` §3.4/§4 задаёт формулу Layering
  Coverage и достижимый fixed priority; API/display contracts показывают score/diagnostics отдельно
  от OPR и маркируют impact в единицах core looks либо coverage, не смешивая их; строгие v0-примеры
  учитывают дискретные 0/50/100%, а partial coverage явно ограничен guest/Stage-2 контекстом.
- **AC-010 (живые дисплеи следуют контракту):** Dashboard и Capsule Result вычисляют OPR через один
  role-aware калькулятор со знаменателем Core+Accessory, показывают Layering Coverage отдельно и
  возвращают `N/A` с diagnostics при нуле base looks. Локальный preview после add/remove/replace
  пересчитывает numerator и denominator вместе: structural layer не создаёт counted outfit, а
  совместимый Accessory создаёт bounded variation; одинаковые аксессуары одного `(slot, colorId)`
  схлопываются до одного варианта. Совместимость вещи определяется только по dominant color;
  mock/API-backed capsule creation сохраняет numerator из того же алгоритма, поэтому неполное Core
  ядро не получает ненулевой persisted `outfitCount`; поведение закреплено e2e и визуальными baseline.
  При количестве accessory candidates больше `A_max` preview перечисляет, дедуплицирует и выбирает
  canonical representatives ровно по farthest-first §3.1, возвращая их keys/item IDs вместе со
  счётчиком — renderer не должен повторно угадывать, какие три варианта вошли в numerator. Visible
  outfit cards строятся из тех же `previewBaseLooks` и selected representative IDs: базовый образ и
  каждая посчитанная accessory variation имеют отдельную карточку с теми же item IDs.
- **AC-011 (dependency gate без advisory bypass):** `app/package-lock.json` разрешает
  `fast-uri@3.1.4` и `sharp@0.35.3` либо более новые проверенные fixed versions; OSV Scan не содержит
  findings из `app`, `npm audit` не содержит High vulnerabilities, а production Docker build проходит
  с чистым `npm ci`. Advisory не игнорируется и workflow severity не ослабляется.

## Negative scenarios

Слайс обязан **отвергать**, а не «мягко допускать»:

1. **Запрещённый гибрид OPR** (core-образы / все вещи) — отвергнут таблицей §3.3: layering-items вне
   знаменателя, а не штрафуют владельца кардигана.
2. **Мультипликативный/unbounded счёт аксессуаров** (полный power-set, каждая комбинация = образ) —
   отвергнут агрегатным потолком `outfit-generation.md` §3.1 (`A_max` на base look), с явным
   контрпримером (OPR>100 на фиксированном ядре) в тексте.
3. **Возврат capsule-валидаций в гостя** (мин. 8 категорий / мин. 7 вещей / палитра до вещей) —
   отвергнут §7.1 guest-правилами; signup сохраняет `uncapsulated`, а не создаёт невалидную capsule.
4. **«Образ» без ядра** — набор из одних аксессуаров/слоёв без триады верх+низ+обувь (или
   платье+обувь) НЕ считается base look'ом и не попадает в числитель (`outfit-generation.md` §3.1
   определяет base look строго через core); несовместимая по цвету триада тоже не проходит — гость
   получает объяснение и альтернативы, а не OPR=0 под видом результата (§7.1).
5. **Coin/Supabase-регрессия** — отвергнута AC-006 grep-guard'ом.
6. **Мёртвый production CTA** — interim auth CTA сохраняется, пока весь вертикальный путь
   input→aha→save не готов/не включён; частичный P1 не уводит production в тупик.
7. **Layering при нуле base looks** — наличие блейзера/пальто без полного Core-base не выдаёт
   ложные `0%` или `100%`: UI показывает `N/A` и нулевые diagnostics; слой не попадает в OPR denominator.
8. **Дубли аксессуаров раздувают OPR** — несколько вещей одного accessory slot с одним dominant
   `colorId` дают один канонический вариант, а не занимают весь `A_max`.
9. **Persisted numerator обходит Core-инвариант** — repository не использует `items×categories`:
   capsule без shoes сохраняет `outfitCount=0`, а валидная top+bottom+shoes база — `1`, тем же
   calculator, который обслуживает preview.
10. **Regression проходит локально только на Node 25** — прямые импорты app `.ts` не полагаются на
    встроенное type stripping: тот же focused suite обязан проходить на CI Node 20.
11. **`A_max` реализован как `Math.min(count, 3)` без selection** — отвергнуто: при четырёх и более
    canonical candidates calculator обязан выполнить documented farthest-first и сохранить
    representative item IDs, а не только обрезать анонимное число.
12. **Capsule example расходится с обязательной схемой** — отвергнуто: документированный JSON обязан
    включать полный required `layeringCoverage`, чтобы copied payload не терял отдельную метрику.
13. **Renderer игнорирует selected representatives** — отвергнуто: cards не могут продолжать
    показывать первые items по UI section или structural/gap placeholders как посчитанные outfits;
    их item IDs обязаны совпадать с `previewBaseLooks` numerator.
14. **OSV проходит через ignore/ослабление гейта** — отвергнуто: исправляются dependency versions;
    workflow, scanner arguments и severity policy не меняются.

Регрессия любого пункта — это доковое противоречие, ловится grep-аудитом `plan.md` и просмотром
диффа при ревью.

## Roadmap (Этап 1 послойно — последующие PR, не этот)

Порядок реализации гостевой петли поверх этого фундамента (каждый слой — свой PR, TDD для app-кода):

1. **P1 — гостевой онбординг UI за выключенным route/feature flag:** шаг «тип гардероба» + добавление
   вещей; localStorage-персист. Production hero-CTA остаётся на interim auth-пути.
2. **P2 — пресет-библиотека базовых вещей:** основной путь гостя (ноль ML, мгновенно). Требует
   контентной работы (собрать пресеты).
3. **P3 — алгоритм v0 + aha-экран:** детерминированный расчёт в браузере по модели §3
   (`outfit-generation.md`), OPR + 1 рекомендация; baseline-валидация (FITB + панель) фиксирует
   маркетинговый hero-range.
4. **P4 — встроенный гейт + включение вертикали:** embedded-блок (не модалка), Google первой; за
   гейтом — save в `uncapsulated` + полный план. Только когда input→color-valid aha→save работает,
   feature flag/route включается и hero-CTA переключается с interim auth на гостевой инструмент.
