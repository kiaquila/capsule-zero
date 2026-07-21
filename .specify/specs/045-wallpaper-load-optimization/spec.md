# 045 — Wallpaper Load Optimization: убрать «выскакивание» обоев

## Goal

Убрать заметную задержку/«поп» фонового wallpaper на `https://capsulezero.app`
(зарепорчено на `/en`, но касается всех экранов — `.wallpaper-bg` рендерится в каждом shell).
Причина — стек из четырёх проблем: обои подключены как CSS `background-image` (позднее
обнаружение, низкий приоритет загрузки), это **1.9 МБ цветной PNG**, рендерящийся через
`filter: grayscale(100%)` (весь цвет в файле — впустую), прод отдаёт его с
`Cache-Control: max-age=0` (ревалидация на каждой загрузке/навигации), и у слоя нет тёмного
fallback-цвета (видна светлая вспышка до прихода картинки). Фикс: запечь grayscale в
pre-encoded AVIF/WebP (контент-хэш в имени), предзагрузить его в `<head>`, дать тёмный fallback и
включить immutable-кэш на edge. Визуал обоев не меняется — только доставка.

## Scope

**In:**

- `app/public/wall.3622f713.avif` (43 КБ) + `app/public/wall.3622f713.webp` (63 КБ) — pre-encoded
  full-res (1672×941) grayscale-версии утверждённого wallpaper (grayscale вшит в ассет). Имя
  контент-хэшировано под immutable-кэш. Старый `app/public/wall.png` (1.9 МБ, цветной) удалён.
- `app/src/app/globals.css` — `.wallpaper-bg` переписан: `background-image: image-set(avif, webp)`
  (движок выбирает AVIF, иначе WebP), `background-color: var(--color-black)` как мгновенный тёмный
  fallback, `filter: grayscale(100%)` снят (запечён в ассет). Одиночный `background-image` —
  без дубля свойства, чтобы не сломать stylelint-бюджет `--max-warnings 101`.
- `app/src/app/[locale]/layout.tsx` — `ReactDOM.preload("/wall.3622f713.avif", { as: "image",
  type: "image/avif", fetchPriority: "high" })` в root-layout: браузер грузит обои параллельно с
  render-blocking CSS, высоким приоритетом. `type` даёт движкам без AVIF пропустить preload и
  упасть на WebP из `image-set`. Обои есть на каждом экране → preload в locale-layout корректен
  для всех маршрутов.
- `infra/nginx-host/capsulezero.app.conf` (живой прод-edge) и зеркально
  `infra/nginx/conf.d/capsulezero.conf` (retired docker-edge, чтобы не было дрейфа) — новый
  `location ~ ^/wall\.[0-9a-f]+\.(?:avif|webp)$`: проксирует на web-контейнер, но
  `proxy_hide_header Cache-Control` + `add_header Cache-Control "public, max-age=31536000,
  immutable"`. Контент-хэш в имени делает immutable безопасным (регенерация → новый хэш → новый
  URL → кэш сбрасывается). Security-заголовки (HSTS/nosniff/Referrer-Policy) продекларированы
  внутри location, т.к. location-level `add_header` заменяет server-level набор.
- `tests/e2e/` — расширение POM `LandingPage.ts` (locators `.wallpaper-bg`, preload-link;
  методы computed filter/bg-color/bg-image) + новый `specs/landing/wallpaper.spec.ts` (TDD
  red→green; негатив — старый `wall.png` не возвращается).
- Доки тем же изменением: `docs_capsule_zero/project/frontend/styling.md`,
  `docs_capsule_zero/screens/screen-landing.md`, `docs_capsule_zero/features/f-001-landing.md`,
  `.specify/memory/design-system.md` §1 (строка про фон), `app/src/styles/tokens.css` комментарии —
  формат-нейтральное описание доставки обоев.

**Out:**

- Смена самого изображения/кадрирования wallpaper — визуал не трогаем.
- Перевод остальных `/public`-ассетов (svg, social preview) на новый формат/кэш — вне слайса.
- `next/image`-оптимизатор для CSS-фона — фон нельзя выразить через `next/image` без переверстки
  слоёв; `image-set` + preload дают тот же эффект без запуска image-оптимизатора в standalone.
- Высокодизайнерские доки (constitution §III, design-system §9.7 «over wall.png/glass»,
  emotion-map, ux-validation) — описывают неизменившийся **визуал**, не формат доставки; не
  редактируются. Историю грандфадзеных спеков (009/010/015/016) не переписываем.

## Acceptance criteria

- **AC-001 (preload):** на лендинге в `<head>` ровно один `link[rel="preload"][as="image"]` с
  `href` вида `/wall.<hash>.avif`, `type="image/avif"`, `fetchpriority="high"`.
- **AC-002 (тёмный fallback + без runtime-фильтра):** computed `.wallpaper-bg` `filter === "none"`
  и `background-color === "rgb(10, 10, 10)"` (= `var(--color-black)`).
- **AC-003 (pre-encoded + негатив):** computed `.wallpaper-bg` `background-image` содержит
  `wall.` и `.avif`/`.webp` и **не** содержит `/wall.png`; браузер грузит только AVIF (WebP и
  старый PNG не запрашиваются).
- **AC-004 (вес):** обои-ассет ≤ ~64 КБ (было 1.9 МБ) — ≥ 96% сокращение.
- **AC-005 (кэш):** edge отдаёт `wall.<hash>.(avif|webp)` с
  `Cache-Control: public, max-age=31536000, immutable`, сохраняя HSTS/nosniff/Referrer-Policy.

## Negative scenario

Ретро-регресс: возврат цветного `wall.png` или `filter: grayscale` перехватывается AC-003
(`background-image` не содержит `/wall.png`) прямо в `wallpaper.spec.ts` — тест падает, если
кто-то вернёт старый ассет или runtime-фильтр.

## Verification

См. `plan.md` (`## Verification`).
