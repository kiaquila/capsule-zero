# 045 — Tasks & Process Memory

**Input**: `.specify/specs/045-wallpaper-load-optimization/spec.md`, `plan.md`

## Tasks

- [x] T001 Ветка `feat/045-wallpaper-load-optimization` от свежего `origin/main`.
- [x] T002 Замерить: живой прод отдаёт `wall.png` 1.9 МБ, `Cache-Control: max-age=0`, без
      preload, без format-negotiation. Пересжать grayscale → AVIF q55 / WebP q80.
- [x] T003 Сгенерировать `app/public/wall.<hash>.avif` + `.webp`; после review переименовать
      каждый формат по SHA-256 его байтов (`b6f0e360` AVIF, `f16b13cb` WebP),
      удалить `app/public/wall.png`. Визуально сверить декод (тот же кадр, grayscale).
- [x] T004 (TDD red) POM `LandingPage.ts` + `specs/landing/wallpaper.spec.ts`; прогон — red на
      отсутствии preload.
- [x] T005 `globals.css` `.wallpaper-bg` → `image-set` + тёмный fallback, снять `filter`.
- [x] T006 `[locale]/layout.tsx` → `ReactDOM.preload` AVIF, high priority.
- [x] T007 (TDD green) прогон `wallpaper.spec.ts` — 2/2 passed (chromium + webkit-iphone).
- [x] T008 nginx immutable-кэш для `wall.<hash>.(avif|webp)` в обоих edge-конфигах; `nginx -t` ok.
- [x] T009 Гейты: stylelint 100/101, typecheck, eslint, build, e2e lint/typecheck — зелёные.
- [x] T010 Живая браузер-проверка на текущем Chromium: preload в head, только AVIF в сети,
      filter none, bg dark,
      скриншот рендера.
- [x] T011 Актуализировать доставочные доки; спек-память.
- [x] T012 Отработать GitHub Codex + локальный merge-readiness review: progressive-enhancement
      memory, настоящий content addressing, preload/network/hash guards, Safari 16 trade-off,
      актуальные constitution/design-system.
- [x] T013 Обновить четыре уязвимые transitive dev-зависимости до fixed versions; проверить
      clean install/lint/typecheck/e2e локально. GitHub OSV остаётся обязательным post-push signal.

## Process Memory

### Decisions

- **Progressive enhancement: WebP fallback → typed `image-set`.** Финальный паттерн —
  `background-image: url(webp)` для Safari ≤16, затем `background-image: image-set(avif, webp)`
  для современных движков и тёмный `background-color` как последний fallback. Дубль свойства
  нужен для сохранения wallpaper на legacy WebKit; точечный `stylelint-disable-next-line
  declaration-block-no-duplicate-properties` оставляет бюджет `--max-warnings 101` без прироста.
- **Preload только AVIF (не WebP), с `type`.** Format-negotiated preload через `imagesrcset` не
  умеет MIME-переговоры; `type="image/avif"` заставляет браузеры без AVIF пропустить preload
  (не тратя байты) и упасть на WebP из `image-set`. Два typed-preload'а привели бы к тому, что
  AVIF-браузер тянет и WebP тоже. Текущие Chromium/WebKit таргеты качают только AVIF. Принятое
  legacy-исключение: Safari 16 поддерживает AVIF, но optional `type()` в `image-set` получил лишь
  в Safari 17, поэтому Safari 16 может скачать AVIF preload + WebP fallback (≤108 КБ суммарно).
- **Контент-хэш в имени → immutable безопасен.** `/public` в Next всегда `max-age=0`, а Next не
  фингерпринтит `/public`. Каждый encoded asset именуется первыми 8 символами SHA-256 собственных
  байтов (`wall.b6f0e360.avif`, `wall.f16b13cb.webp`); guard перечитывает файл и сверяет digest.
  `location`-override на edge даёт immutable без риска «залипшего» старого кадра: регенерация
  меняет хэш → новый URL.
- **`ReactDOM.preload` вместо ручного `<link>`.** Идиоматичный App-Router способ (Next 16 / React
  19), хойстит `<link rel=preload>` в `<head>`, дедуплицирует. Подтверждено доками (Context7).
- **Оба edge-конфига.** Живой edge — `infra/nginx-host/`; docker-edge (`infra/nginx/`) retired, но
  версионируется — правило зеркалировано, чтобы не было дрейфа (AGENTS §9).

### Dead ends

- **`next/image priority` для фона.** Дал бы авто-preload + AVIF/WebP + immutable «из коробки», но
  CSS-фон нельзя выразить через `next/image` без переверстки слоя обоев во всех 11 shell'ах и
  запуска image-оптимизатора (`/_next/image`, нужен sharp) в standalone за nginx. `image-set` +
  явный preload дают тот же результат меньшей кровью.
- **Один произвольный family hash для AVIF/WebP.** Имена `wall.3622f713.*` не совпадали с SHA-256
  ни одного encoded файла, а тест сверял только литералы. Это делало годовой immutable ручным
  обещанием. Отклонено в пользу per-file content addressing + byte-level guard.

### Review-driven fixes (адверсариальное ревью перед PR)

Три параллельных ревью (code-reviewer / security-reviewer / frontend). Security — CLEAN,
frontend — COMPLIANT. Code-reviewer — COMMENT: 1×P2 + 3×P3, все отработаны:

- **P2 (fixed):** `add_header Cache-Control … immutable **always**` штамповал immutable и на
  4xx/5xx. При деплой-скью 404 обоев кэшировался бы на год → клиент навсегда на тёмном фоне без
  ревалидации. Убрал `always` только со строки Cache-Control (на security-заголовках оставил): на
  ошибках заголовок не добавляется, upstream-Cache-Control скрыт → браузерная эвристика, не immutable.
- **P3 (fixed):** `image-set()`+`type()` не рендерит обои на Safari ≤16 (iOS 16) — только тёмный
  fallback. Добавил `background-image: url(webp)` до `image-set` через **документированный**
  `stylelint-disable-next-line declaration-block-no-duplicate-properties` — старый WebKit держит
  wallpaper, бюджет `--max-warnings 101` не тронут (disable не считается).
- **P3 (fixed):** дубль хэша не был застрахован. Добавил тест «CSS and layout reference the same
  wallpaper hash» (читает `globals.css` + `layout.tsx`, сверяет единственность хэша).
- **P3 (fixed):** preload-локатор в POM сужен до `[href*="wall."]` — не ломается от будущих
  сторонних image-preload'ов.

### GitHub Codex + merge-readiness review

- **P3 (fixed):** canonical Decision и Scope больше не противоречат shipped WebP fallback перед
  typed `image-set`; устаревшие `wall.png` ссылки удалены из актуальных constitution/design-system.
- **BLOCK (fixed):** произвольный общий `3622f713` заменён настоящими per-file SHA-256 prefixes;
  guard проверяет существование/байты обоих ассетов и точное совпадение AVIF CSS URL с preload.
- **AC evidence (fixed):** e2e утверждает `type`/`fetchpriority`, один AVIF 200 на текущих targets,
  отсутствие WebP/PNG, а negative evidence разведён по AC-002/AC-003; Safari 16 trade-off записан.
- **Security signal (fixed):** только четыре уязвимые transitive dev-версии из OSV обновлены до
  `brace-expansion` 1.1.16/5.0.7 и `js-yaml` 4.3.0.

### Known issues

- **AVIF URL продублирован в двух местах** — `globals.css` `.wallpaper-bg` и
  `[locale]/layout.tsx` `WALLPAPER_PRELOAD_HREF`; CSS не может импортировать TS-константу.
  **Контракт обновления:** при регенерации переименовать каждый encoded asset по SHA-256 и обновить
  CSS + preload. Guard проверяет byte digest/существование обоих файлов и совпадение AVIF URL, так
  что drift или повторное использование immutable URL не проходят тест.
- **Safari 16 может скачать AVIF + WebP (≈108 КБ).** Typed AVIF preload поддерживается, а
  `type()` внутри `image-set()` ещё нет; браузер использует предыдущий WebP fallback. Это принятый
  bounded compatibility trade-off ради видимого wallpaper; Safari 17+ и текущие test targets
  переиспользуют один AVIF.
- **Прочие `/public`-ассеты** (svg, social preview) остаются на `max-age=0` — вне слайса;
  отдельная оптимизация при необходимости.
