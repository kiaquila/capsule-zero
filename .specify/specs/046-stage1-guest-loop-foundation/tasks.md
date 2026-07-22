# 046 — Tasks

- [x] T001 Сбор решений фаундера Q1/Q2/Q3/Q6 (квиз, сессия 2026-07-21) + проверка матчасти (OPR-модель, colors.md vs прототип)
- [x] T002 `outfit-generation.md` — модель OPR §3, accessory ruleset §2.3, Layering Coverage §3.4, basicity-хук §2.5
- [x] T003 `capsule-methodology.md` §1/§3/§7.1 + `gap-analysis.md` §5/Rule-note + `colors.md` canonical-блок
- [x] T004 `PRODUCT-PLAN.md` §4 (закрытие Q1/Q2/Q3/Q6) + §5 (deps, пункты 2/4) + §7 doc-debt + §8
- [x] T005 Спека 046 (spec/plan/tasks) с SENAR-полями и Этап-1 roadmap
- [x] T006 Adversarial-review (4 линзы: OPR-math, кросс-док, SENAR, drift/regression) — 12 находок; major-фиксы применены (см. Decisions/Dead Ends)
- [x] T007 Заполнить evidence-статусы в `plan.md` фактическими прогонами и обновить PR-head evidence
- [x] T008 Merge-readiness review: native Codex P2 + две независимые локальные дорожки; устранить
  OPR drift, category-role ambiguity, guest/capsule invariant gap, accessory-cap/math drift,
  gap/recommendation inconsistency и production CTA dead-end
- [x] T009 Native Codex P1 runtime alignment: test-first перевести Dashboard и Capsule Result на
  единый Core+Accessory denominator, вывести отдельные Layering Coverage diagnostics и закрепить
  zero-base `N/A` и `(slot, colorId)` accessory dedup функциональным e2e + desktop/mobile visual baseline
- [x] T010 Native Codex P1 category completeness: RED-коммитом `ec099a8` доказать runtime gap
  31/48, затем добавить все 17 отсутствовавших built-in категорий в общий `CATEGORIES` role/slot
  catalog; заодно сделать прямые app-module imports e2e совместимыми с чистым CI package boundary
- [x] T011 Independent code-review category projection: RED-коммитом `154bcf6` закрепить полную
  category/gender/role/slot матрицу и provider-scoped Journey; исправить canonical mixed-gender
  semantics и не расширять frozen Supabase provider новыми глобальными IDs
- [x] T012 Final test-efficacy review: заменить helper-only provider assertion на прямой
  `buildGuidedJourneySnapshot` regression со stub-provider; mutation proof удалением `supportedIds`
  падает с 127 лишними IDs, восстановленная реализация даёт focused Chromium `5 passed`

## Process Memory

### Decisions

- **Модель OPR (Q1, фаундер 2026-07-21):** core base look = верх×низ×обувь (или платье×обувь);
  структурные слои (кардиган/блейзер/пальто) — отдельный **Layering Coverage** score, вне hero-OPR и
  вне знаменателя; аксессуары (сумка/шарф/шапка/украшения/ремень) входят в hero-OPR «умно». Знаменатель
  = core+accessory items. Консистентно (§3.3): категория либо в числителе И знаменателе, либо ни там
  ни там (+отдельный score) — запрещённый гибрид не используется.
- **Агрегатный потолок аксессуаров (фикс по review, 2026-07-21):** per-outfit правила §2.3 (1/слот,
  взаимная совместимость, ≤3/образ, дедуп) НЕ ограничивают агрегат — они держат один образ реалистичным.
  Реальный бонд — **на каждый base look**: не более `A_max` аксессуаризованных вариантов. Для v0
  `A_max=3` и farthest-first selection детерминированы как **инженерный v0-контракт 2026-07-22**
  внутри принятых фаундером границ Q1, а не как дополнительное фаундерское решение. Это не открытая
  часть Q1; quality-validation может версионировать правило позже. `outfit-generation.md` §3.1.
- **Per-outfit cap сверен:** максимум **3 аксессуара всего, включая сумку**. Старая формулировка
  «1 bag + 3 layer-7» ошибочно разрешала 4 и противоречила PRODUCT-PLAN; исправлено.
- **Category → role/slot канонизирован:** все 48 базовых категорий отображены в `categories.md`;
  coarse `Category.layer` — presentation-only. OpenAPI/generated projection несут machine-readable
  `algorithmRole`/`accessorySlot`, custom nullable role result, Layering diagnostics и impact unit —
  без скрытого UUID/name lookup. Sweater/cardigan/bomber/blazer = Layering, skirt = Core bottom,
  dress = Core dress; sunglasses/watch/tie получили слоты.
- **Аксессуары вне рекомендации (фикс по review):** «add one item» не рекомендует аксессуары (они
  кормят OPR, но это styling, не growth-lever); единственный победитель выбирается кросс-скейл-приоритетом
  (core gaps → затем layering), без слияния шкал. `outfit-generation.md` §4.
- **Сверка формулы OPR во всех активных доках (фикс по review — drift):** review нашёл старую формулу
  «outfits / all items» в `f-015-opr.md`, `glossary.md`, `design-system.md`, конституции §II. Все сверены
  тем же изменением (AGENTS §9): знаменатель = core+accessory, слои → Layering Coverage. Конституция
  получила амендмент **v1.6**. Отложено только конкретное число (пол для core).
- **colors.md — симметрия ахроматов (фикс по review):** claim «прототип уже conforms, кода не менять»
  смягчён: прототип group-based, но привязан к первому хроматическому (achromatic base не оценивается);
  Go-движок реализует матрицу **симметрично** (ахромат с любой стороны), а не портирует base-anchoring.
- **Гейт (Q2):** после aha-экрана; образы+OPR+1 рекомендация бесплатно; встроенный блок (не модалка),
  Google первой; полный план за гейтом. Точная позиция дальше мерится A/B.
- **Гость ≠ капсула (Q3):** минимум обувь+верх+низ (или платье+обувь), остальное опционально; палитра
  выводится из вещей, но результат требует хотя бы одну color-valid Core комбинацию. При несовместимой
  триаде показываются причины/альтернативы, не фальшивый OPR. После signup вещи сохраняются как
  `uncapsulated`; строгая капсула создаётся только по явному promote после её thresholds. Это
  reconciliation Q3 с действующими capsule-инвариантами, без принудительного добора вещей.
- **Layering Coverage + рекомендация исполнимы:** score = покрытые mid/outer возможности по всем base
  looks / `2×baseLooks`; отдельные diagnostics. Priority: core feasibility → layering structure →
  incremental Δcore. Cardigan/coat impact показывается в covered looks/pp, не в outfits.
- **colors.md каноничен (Q6):** живого расхождения нет — прототип `areColorsCompatible()` уже
  групповой (ахромат+любой · та же группа · Desaturated↔Darks · остальное блок), совпадает с
  матрицей. Прежний temp/shade-чек устранён. Кода менять не нужно.
- **basicity — хук сейчас, реализация Этап 2 (Q5):** eligibility-фильтр перед сборкой образов
  (`outfit-generation.md` §2.5) закладывается в v0 (colour-only), чтобы фасон встал входом алгоритма
  без переписывания пайплайна. Фаундер прямо просил «заложить сейчас».
- **Число «80–150 из 30» = пол для core:** конституция §II, `design-system.md` и все активные
  OPR-контракты сверены; отложено только точное маркетинговое hero-число. Baseline-валидация — Этап 1
  P3, повторная validation после basicity — Этап 2.
- **Production CTA остаётся завершённым:** P1–P3 строятся за выключенным route/feature flag; hero CTA
  меняется с interim auth только в P4 вместе с работающим input→aha→save вертикальным путём.
- **Runtime drift включён в scope после review:** native Codex на SHA `0efa972` показал, что два уже
  живых экрана сохранили старый all-items denominator и не визуализируют Layering Coverage. Выполнен
  TDD: RED-коммит `69600a3`, затем review выявил ошибочную structural-layer инварианту; корректное
  ожидание сохранено отдельным RED-коммитом `453a7e0`. Следующий review выявил hybrid preview и
  невозможный provider fixture без shoes: regression-контракт расширен RED-коммитами `eacaf2d` и
  `706c189`. Финальный review поймал одинаковые аксессуары, занимавшие весь `A_max`; RED-коммит
  `0a4fcd4` закрепил canonical `(slot, colorId)` dedup до cap. После этого добавлены общий
  `outfit-productivity.ts`, два consumers, EN/RU copy и visual baselines. Новый модуль оправдан mandatory reuse-check: существовали только дублированные локальные
  формулы в `dashboard-data.ts` и `capsule-result-data.ts`, общего calculator не было. Общий
  `color-compatibility.ts` заменяет три дублированные матрицы в Journey, Capsule Result и mock
  methodology.
- **Runtime category catalog обязан совпадать с каноническими 48:** native Codex на SHA `e0c496f`
  обнаружил, что `categories.md` и OpenAPI уже обещают полный taxonomy, но `CATEGORIES` содержал лишь
  31 запись. `puffer`/прочая верхняя одежда теперь имеет `layering_outer`, все недостающие shoes —
  `core_shoes`, а bags/accessories получают один из шести канонических slots. Dashboard и Capsule
  Result используют тот же общий lookup, поэтому штатная категория больше не превращается в
  исключённый custom item. Mandatory reuse-check: расширен существующий `CATEGORIES`; отдельный
  fallback/map не создавался.
- **Mixed — режим общего гардероба, не отдельный пол:** категории women-only и men-only включают
  `mixed`, а documented unisex категории — все три режима; Pumps / Dress shoes и Crossbody bag
  доступны women/men/mixed согласно canonical taxonomy. Полная 48-entry matrix теперь проверяет
  ID, genders, role, slot и уникальность, а не только representative примеры.
- **Journey ограничен surface активного provider:** общий `CATEGORIES` остаётся каноническим lookup,
  но presentation фильтруется множеством IDs, возвращённых `listJourneyCategories`. Это сохраняет
  provider abstraction и не расширяет замороженный Supabase catalog. Mandatory reuse-check: расширен
  существующий `getCategoriesByGender`; новый helper/provider variant не создавался.
- **Provider boundary проверяется на consumer, а не только на helper:** test stub возвращает разные
  узкие ID-наборы для women/men/mixed и сравнивает итоговый `snapshot.categories`. Поэтому удаление
  `supportedIds` из `buildGuidedJourneySnapshot` воспроизводимо ломает regression, даже если сам
  `getCategoriesByGender` остаётся корректным.

### Dead Ends

- **Q6 как «живой блокер» — ложный след.** Память проекта (84 дня) описывала прототип на
  `a.temp === b.temp || a.shade === b.shade`. Прочтение текущего кода в сессии показало групповой
  `areColorsCompatible(base, target)` на строке 1310 — расхождение устранено ранее. Урок: память —
  point-in-time; file:line-факты сверять с текущим кодом (что и сделано). Заметка обновлена на RESOLVED.
- **Считать аксессуары внутри hero-OPR без потолка (unbounded)** — отвергнуто ещё на этапе квиза: 30
  вещей дают тысячи «образов», близкие вариации читаются как слоп.
- **Первый черновик модели: per-outfit потолок ≠ агрегатный бонд (поймано adversarial-review'ом).**
  Первая редакция `outfit-generation.md` утверждала «счёт не может взорваться» на основании только
  per-outfit правил §2.3 (1/слот, ≤3, дедуп). Review-линза opr-math построила контрпример: с
  ахроматическими аксессуарами (универсально совместимы, §2.3.2 не отсекает) числитель растёт
  комбинаторно, знаменатель — линейно. Финальный точный пример соблюдает cap ≤3: пять слотов × три
  вещи дают 376 наборов на base look и OPR≈143.2 на фиксированном ядре 8/6.
  Урок: per-outfit ограничение НЕ ограничивает агрегат. Исправлено потолком **на base look** (`A_max`,
  §3.1). Ложное утверждение «cannot explode» удалено.
- **Guest category triad ≠ гарантированный look:** Bright top + Pastel bottom + achromatic shoes
  формально заполняют позиции, но не дают color-valid base look. Требование и zero-result state
  исправлены на совместимую комбинацию.
- **Сохранять 2–3 guest items сразу в strict capsule:** отвергнуто — нарушает min-7/min-8 и palette
  lock. Используется существующий `uncapsulated` wardrobe status; пользователь ничего не теряет и не
  принуждается добавлять вещи при регистрации.
- **Оставить runtime alignment будущему PR:** отвергнуто native review — Dashboard/Capsule Result
  уже наблюдаемы пользователем и тем же PR публиковали бы контракт, которому сами не следуют.
- **Пересчитывать preview numerator по item/category totals или замораживать только numerator:**
  отвергнуто повторными review — первое создаёт outfits из structural layer, второе создаёт hybrid
  после Core/Accessory mutation. Preview теперь перечисляет color-valid Core bases и bounded
  accessory variations; persisted state использует авторитетный provider `outfitCount`.
- **Считать одинаковые аксессуары отдельными вариантами до `A_max`:** отвергнуто review — три серых
  шарфа одного `neckwear` slot не могут вытеснять цветово/слотово отличающиеся варианты. Preview
  канонизирует и дедуплицирует sorted `(slot, colorId)` tuples до применения cap.
- **Считать сокращённый UI catalog достаточным для runtime OPR:** отвергнуто native review. Старые
  wardrobes могут содержать любую из 48 документированных категорий; отсутствие записи в общем
  lookup молча присваивало `algorithmRole=null` и завышало OPR. Негативный regression теперь проверяет
  и количество 48, и representative mappings `puffer`/`watch`/`cap`/`clutch`.
- **Рендерить весь глобальный catalog независимо от provider ответа:** отвергнуто независимым
  code-review — это протекало бы новыми IDs в frozen Supabase Journey. UI теперь пересекает canonical
  metadata с provider-returned IDs, не меняя legacy provider.
- **Тестировать provider scope только прямым вызовом `getCategoriesByGender`:** отвергнуто финальным
  code-review — такой тест оставался бы зелёным при удалении `supportedIds` в Journey consumer.
  Regression перенесён на `buildGuidedJourneySnapshot` с реальным provider-shaped stub.

### Known Issues

- **Аксессуары в hero-числе + `A_max` — watch-point:** фаундер сознательно поднял
  hero-число выше «80–150», включив аксессуары с per-outfit cap (я флагала слоп-риск при сборе Q1).
  Отдельный инженерный v0-контракт фиксирует `A_max=3` + farthest-first (§3.1), поэтому Q1 закрыт. Baseline validation в
  P3 может обосновать будущую версию, но до неё нельзя фиксировать маркетинговый hero-range. Риск:
  близкие аксессуаризованные образы читаются как накрутка — панель на носибельность обязательна.
- **Полный ruleset «какие аксессуары стилистически сочетаются между собой»** — в v0.1 stub
  (colour-compat + разные слоты). Расширение (напр. головные уборы vs капюшон, ремень vs платье) —
  Этап 2 вместе с basicity.
- **Точное hero-число OPR** — не зафиксировано (ждёт baseline-валидации алгоритма v0 в Этапе 1 P3).
  До этого не выносить число в hero-copy/acceptance.
- **Реализация гостевой петли** — не в этом PR (Roadmap P1–P4, `spec.md`).
