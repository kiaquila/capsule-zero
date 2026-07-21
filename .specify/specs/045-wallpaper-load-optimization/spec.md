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

- `app/public/wall.b6f0e360.avif` (43 КБ) + `app/public/wall.f16b13cb.webp` (63 КБ) — pre-encoded
  full-res (1672×941) grayscale-версии утверждённого wallpaper (grayscale вшит в ассет). Имя
  каждого формата начинается с первых 8 символов SHA-256 его байтов под immutable-кэш. Старый
  `app/public/wall.png` (1.9 МБ, цветной) удалён.
- `app/src/app/globals.css` — `.wallpaper-bg` использует progressive enhancement: WebP
  `background-image: url(...)` для Safari ≤16, затем typed `image-set(avif, webp)` для современных
  движков; `background-color: var(--color-black)` — мгновенный тёмный fallback, а
  `filter: grayscale(100%)` снят (запечён в ассет). Дубль свойства точечно разрешён через
  `stylelint-disable-next-line`, поэтому бюджет `--max-warnings 101` не растёт.
- `app/src/app/[locale]/layout.tsx` — `ReactDOM.preload("/wall.b6f0e360.avif", { as: "image",
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
  red→green; негатив — старый `wall.png`/runtime-filter не возвращаются; проверяются сетевой 200,
  точные preload-атрибуты, существование ассетов и соответствие filename-префиксов SHA-256).
- Доки тем же изменением: `docs_capsule_zero/project/frontend/styling.md`,
  `docs_capsule_zero/screens/screen-landing.md`, `docs_capsule_zero/features/f-001-landing.md`,
  `.specify/memory/constitution.md` §III, `.specify/memory/design-system.md` §1/§9.7,
  `app/src/styles/tokens.css` комментарии — формат-нейтральное описание доставки обоев.
- Merge-readiness security housekeeping: уязвимые transitive dev-зависимости в
  `app/package-lock.json` и `tests/e2e/package-lock.json` обновлены до исправленных
  `brace-expansion` 1.1.16/5.0.7 и `js-yaml` 4.3.0. Повторный GitHub OSV обнаружил новый
  `GO-2026-5970` в indirect `golang.org/x/text` 0.29.0; API-модуль обновлён до fixed 0.39.0
  вместе с совместимой indirect `golang.org/x/sync` 0.21.0.

**Out:**

- Смена самого изображения/кадрирования wallpaper — визуал не трогаем.
- Перевод остальных `/public`-ассетов (svg, social preview) на новый формат/кэш — вне слайса.
- `next/image`-оптимизатор для CSS-фона — фон нельзя выразить через `next/image` без переверстки
  слоёв; `image-set` + preload дают тот же эффект без запуска image-оптимизатора в standalone.
- История грандфадзеных спеков (009/010/015/016), emotion-map и ux-validation — не
  переписываются; актуальные SSOT constitution/design-system получают только формат-нейтральную
  замену имени удалённого файла, без изменения визуального принципа.

## Acceptance criteria

- **AC-001 (preload):** на лендинге в `<head>` ровно один `link[rel="preload"][as="image"]` с
  `href` вида `/wall.<hash>.avif`, `type="image/avif"`, `fetchpriority="high"`.
- **AC-002 (тёмный fallback + без runtime-фильтра):** computed `.wallpaper-bg` `filter === "none"`
  и `background-color === "rgb(10, 10, 10)"` (= `var(--color-black)`).
- **AC-003 (pre-encoded + негатив):** computed `.wallpaper-bg` `background-image` содержит
  `wall.` и `.avif`/`.webp` и **не** содержит `/wall.png`; современные Chromium/WebKit-таргеты
  загружают один AVIF с 200, без WebP/PNG. Принятый legacy trade-off: Safari 16 умеет AVIF, но не
  typed `image-set`, поэтому может загрузить AVIF preload + WebP fallback (суммарно ≈ 108 КБ);
  wallpaper остаётся видимым, а цветной PNG не возвращается.
- **AC-004 (вес):** обои-ассет ≤ ~64 КБ (было 1.9 МБ) — ≥ 96% сокращение.
- **AC-005 (кэш):** каждый `wall.<sha256-prefix>.(avif|webp)` существует, filename-префикс
  совпадает с SHA-256 его байтов, а edge отдаёт его с
  `Cache-Control: public, max-age=31536000, immutable`, сохраняя HSTS/nosniff/Referrer-Policy.

## Negative scenario

Ретро-регресс: возврат цветного `wall.png` перехватывается AC-003 (`background-image` и сеть),
а возврат `filter: grayscale` — AC-002 (`filter === "none"`) прямо в `wallpaper.spec.ts`.

## Verification

См. `plan.md` (`## Verification`).
