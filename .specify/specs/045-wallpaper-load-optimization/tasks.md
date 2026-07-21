# 045 — Tasks & Process Memory

**Input**: `.specify/specs/045-wallpaper-load-optimization/spec.md`, `plan.md`

## Tasks

- [x] T001 Ветка `feat/045-wallpaper-load-optimization` от свежего `origin/main`.
- [x] T002 Замерить: живой прод отдаёт `wall.png` 1.9 МБ, `Cache-Control: max-age=0`, без
      preload, без format-negotiation. Пересжать grayscale → AVIF q55 / WebP q80.
- [x] T003 Сгенерировать `app/public/wall.<hash>.avif` + `.webp` (контент-хэш `3622f713`),
      удалить `app/public/wall.png`. Визуально сверить декод (тот же кадр, grayscale).
- [x] T004 (TDD red) POM `LandingPage.ts` + `specs/landing/wallpaper.spec.ts`; прогон — red на
      отсутствии preload.
- [x] T005 `globals.css` `.wallpaper-bg` → `image-set` + тёмный fallback, снять `filter`.
- [x] T006 `[locale]/layout.tsx` → `ReactDOM.preload` AVIF, high priority.
- [x] T007 (TDD green) прогон `wallpaper.spec.ts` — 2/2 passed (chromium + webkit-iphone).
- [x] T008 nginx immutable-кэш для `wall.<hash>.(avif|webp)` в обоих edge-конфигах; `nginx -t` ok.
- [x] T009 Гейты: stylelint 101/101, typecheck, eslint, build, e2e lint/typecheck — зелёные.
- [x] T010 Живая браузер-проверка: preload в head, только AVIF в сети, filter none, bg dark,
      скриншот рендера.
- [x] T011 Актуализировать доставочные доки; спек-память.

## Process Memory

### Decisions

- **image-set, а не дубль `background-image`.** Классический fallback-паттерн (`background-image:
  url(webp); background-image: image-set(...)`) добавил бы `declaration-block-no-duplicate-properties`
  warning, а stylelint-бюджет `--max-warnings 101` **на нуле** (ровно 101/101). Одиночный
  `image-set(avif, webp)` + тёмный `background-color` fallback покрывает все современные движки
  без прироста бюджета. Движки без `image-set` получают только тёмный фон (négligeable в 2026).
- **Preload только AVIF (не WebP), с `type`.** Format-negotiated preload через `imagesrcset` не
  умеет MIME-переговоры; `type="image/avif"` заставляет браузеры без AVIF пропустить preload
  (не тратя байты) и упасть на WebP из `image-set`. Два typed-preload'а привели бы к тому, что
  AVIF-браузер тянет и WebP тоже. Живая сеть подтвердила: качается только AVIF.
- **Контент-хэш в имени → immutable безопасен.** `/public` в Next всегда `max-age=0`, а Next не
  фингерпринтит `/public`. Ручной контент-хэш (`wall.3622f713.*`) + `location`-override на edge
  даёт immutable без риска «залипшего» старого кадра: регенерация меняет хэш → новый URL.
- **`ReactDOM.preload` вместо ручного `<link>`.** Идиоматичный App-Router способ (Next 16 / React
  19), хойстит `<link rel=preload>` в `<head>`, дедуплицирует. Подтверждено доками (Context7).
- **Оба edge-конфига.** Живой edge — `infra/nginx-host/`; docker-edge (`infra/nginx/`) retired, но
  версионируется — правило зеркалировано, чтобы не было дрейфа (AGENTS §9).

### Dead ends

- **`next/image priority` для фона.** Дал бы авто-preload + AVIF/WebP + immutable «из коробки», но
  CSS-фон нельзя выразить через `next/image` без переверстки слоя обоев во всех 11 shell'ах и
  запуска image-оптимизатора (`/_next/image`, нужен sharp) в standalone за nginx. `image-set` +
  явный preload дают тот же результат меньшей кровью.

### Known issues

- **Хэш обоев продублирован в двух местах** — `globals.css` `.wallpaper-bg` и
  `[locale]/layout.tsx` `WALLPAPER_PRELOAD_HREF`. CSS не может импортировать TS-константу, поэтому
  единого источника нет. **Контракт обновления:** при регенерации wallpaper обновить хэш в **обоих**
  файлах (и в `location`-регексп он матчится по паттерну, отдельного апдейта не требует).
  `wallpaper.spec.ts` пинит формат/наличие preload, но не сверяет равенство хэшей между собой.
- **Object-Lock/прочие `/public`-ассеты** (svg, social preview) остаются на `max-age=0` — вне
  слайса; отдельная оптимизация при необходимости.
