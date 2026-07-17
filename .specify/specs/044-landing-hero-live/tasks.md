# 044 — Tasks

- [x] T001 Спека 044 (spec/plan/tasks) — фиксация фаундерских решений слайса
- [x] T002 Red: POM-расширение `LandingPage.ts` + `specs/landing/hero.spec.ts`, red-прогон, коммит
- [x] T003 Green: `LandingPage.tsx` (+ `LandingSlidesStub`) + `landing-*` CSS + messages; gold/CTA-семья остаётся в `@theme static`
- [x] T004 Живой design-review (desktop 1280 / mobile 375, RU+EN) + code review, фиксы
- [x] T005 Доки тем же изменением: screen-landing, f-001-landing, ui-texts, PRODUCT-PLAN, §9.11(d)
- [x] T006 Verification-таблица + Process Memory + PR c SENAR Done Gate
- [x] T007 Native Codex P2: reduced-motion red (`5e355a5`) → green (`5eba941`), полный повторный прогон и refresh PR evidence

## Process Memory

### Decisions

- **Interim-CTA (фаундер, 2026-07-17):** до появления гостевого инструмента hero-CTA
  «Попробовать бесплатно» открывает существующий auth-попап с `initialMode="signUp"`
  (`AuthPanel` уже поддерживает проп — нулевые правки панели). Заморозка живого лендинга из
  спеки 043 снята этим решением; перенацеливание CTA на гостевой флоу — отдельный слайс после
  Q1/Q2/Q3/Q6.
- **RU-тон (фаундер, 2026-07-17):** hero-копия остаётся на «ты», как в утверждённом прототипе
  («Создай свою / гардеробную капсулу»). Расхождение тона лендинг («ты») / продукт («вы»)
  принято: лендинг продаёт, продукт обслуживает. Known Issue 043 закрыт.
- **Ghost-«Войти» сохраняет `auth-trigger` и режим входа** — существующий `auth-popup.spec.ts`
  («opens with sign-in mode active») остаётся зелёным без правок; у hero-CTA свой
  `data-testid="hero-cta"`.
- **Sub-текст `.78` — литерал по 039-паттерну:** `--color-text-secondary` всё ещё `.70` (ретюн —
  последний шаг 039); повторяем задокументированное stylelint-исключение (прежде жившее на
  `.landing-manifesto p`, удалённом этим слайсом; теперь на `.landing-hero-subtitle`), чтобы
  значение схлопнулось в токен, когда ретюн приземлится.
- **Gold/CTA-токены остаются в `@theme static`** (по code-review P1): первая попытка «перенесла» их
  в обычный `@theme`, не удалив копию в static, — получился дубль + ложный комментарий. Откат к
  origin/main: hero потребляет `--color-gold-500` и `--btn-cta-*` через `var()` из static-блока
  (эмитится всегда), а `--color-gold-450` без `var()`-потребителя нельзя держать в обычном `@theme`
  (вырежется). Комментарий static-блока актуализирован.
- **`LandingPage()` 90 строк по lint-счётчику > soft-gate 60** (по code-review P2): заглушка
  вынесена в `LandingSlidesStub` (101→86; затем +4 строки стабильного `scroll-cue` testid для
  reduced-motion POM), дальше не дробим — это корень страницы, связно композящий
  header/hero/footer/auth-popover; дробление ради счётчика ухудшило бы читаемость. Обоснование по
  §7 — в теле PR. Warning, не CI-фейл.
- **Header-паддинг ограничен лендингом** (по code-review P2): `.landing-header`/`.landing-logo`
  делят auth и legal. Gold-логотип оставлен общим (намеренно, §9.11(a) — фикс: на main логотип был
  белым). Паддинг же (v1c-ритм) перенесён на `.landing-fold .landing-header`, общий базовый
  `.landing-header` возвращён к значениям origin/main — auth/legal пиксельно как на main.
- **Маппинг без-токенных литералов прототипа:** hover ghost-логина `.10` → `--btn-ghost-bg`
  (точное совпадение); фон заглушки `.05` → `--color-white-a04` (+.01, имперцептно); dashed-бордер
  заглушки `.28` → `--color-white-a24` (−.04, заглушка post-MVP — не прецедент); футер `.58` —
  текущий футер уже сидит на `--glass-border` (.58, точное совпадение), сохраняем.
- **Reduced motion (native Codex P2, 2026-07-17):** бесконечная декоративная анимация
  `landing-cue` отключается при `prefers-reduced-motion: reduce`. Исправление доставлено новым
  TDD-циклом: красный контракт `5e355a5` (`landing-cue` вместо `none`) → green `5eba941`; один
  и тот же тест прошёл в Chromium и WebKit/iPhone, полный landing-suite — 32/32.

### Dead Ends

- **`next build` параллельно с дев-сервером на общем `.next` ломает живые e2e:** запуск
  `npm --prefix app run build` во время прогона Playwright-сьюта против `next dev` привёл к
  массовым «element not found» / пустым токенам на середине прогона (24 failed). Билд и e2e —
  только последовательно.
- **Локальные флейки лендинг-сьюта = перепараллеливание, не регрессия** (диагноз по A/B-прогонам,
  скриншотам и ручному репро). Два механизма на dev-сервере: (а) после инвалидации Turbopack-графа
  страница может краситься до доклейки свежескомпилированного стайлшита (у CTA
  `background-image: none`) — one-shot `expect` на computed-стили заменены на `expect.poll`;
  (б) при 5 параллельных chromium-воркерах на этой машине клики уходят в ещё-не-гидрированный HTML
  (кнопка получает фокус, React-обработчик молчит — cookie-баннер не отцепляется), и ~12-секундных
  окон POM не хватает. Ручной клик работает; одиночные спеки зелёные; webkit зелёный.
  **Финальный контрольный прогон в форме CI — `--workers=2`, свежий production build:
  32/32 passed за 12.2 с.**
  Не гонять локально полный набор дефолтными 5 воркерами как критерий истины; `next build`
  параллельно с dev-сервером на общем `.next` не запускать вообще (ломает сьют).
- **`… | tail -N; echo EXIT:$?` маскирует код выхода** — пайп возвращает код `tail`. Для
  честного статуса — `set -o pipefail` + `tee` в файл.

### Known Issues

- `og:image` (`/social/capsule-zero-homepage.png`) после редизайна визуально устаревший —
  перегенерировать follow-up'ом; `social-preview.spec.ts` проверяет URL/размеры, не содержимое.
- Контент «Как это работает» — заглушка (post-MVP, PRODUCT-PLAN §5 Этап 1 п.1).
