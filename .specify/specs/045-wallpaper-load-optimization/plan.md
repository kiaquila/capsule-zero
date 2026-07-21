# 045 — Plan & Verification

Однослайсовая доставка. Application-код (spec ≥ 025) — по TDD: red `wallpaper.spec.ts` →
реализация (green) → живая браузер-проверка. Ассеты, nginx-кэш и доки — support/infra-слой:
верифицируются замером байт, `nginx -t` и просмотром диффа (TDD-exempt по конституции §VII).

## Verification

| AC | Evidence | Result |
|---|---|---|
| AC-001 | Red: `wallpaper.spec.ts` до preload — chromium `toHaveCount(1)` для `link[rel=preload][as=image]` → received 0 (лог `red.log`). Green: тот же тест после `ReactDOM.preload` в `[locale]/layout.tsx` — passed на chromium **и** webkit-iphone. Живой браузер (`localhost:3000/en`): `<head>` содержит ровно один preload `href=/wall.3622f713.avif`, `type=image/avif`, `fetchpriority=high` | ✅ red→green |
| AC-002 | Green-тест: computed `.wallpaper-bg` `filter === "none"`, `background-color === "rgb(10, 10, 10)"`. Живой probe подтвердил те же значения | ✅ |
| AC-003 | Green-тест: `background-image` содержит `wall.` и `.avif/.webp`, `not.toContain("/wall.png")`. Живой `read_network_requests`: запрошен только `wall.3622f713.avif` (200); WebP и `wall.png` не запрашивались | ✅ red→green |
| AC-004 | `ls -l app/public`: `wall.3622f713.avif` ≈ 43 КБ, `wall.3622f713.webp` ≈ 63 КБ vs. удалённый `wall.png` 1 940 725 Б → −97.7% (AVIF) / −96.7% (WebP). Скриншот `/en`: wallpaper рендерится без потери качества под overlay+glass | ✅ |
| AC-005 | `docker run nginx:1.27-alpine nginx -t` на изолированной копии location-блока — `syntax is ok / test is successful`. Диф `infra/nginx-host/capsulezero.app.conf` + `infra/nginx/conf.d/capsulezero.conf`: `location ~ ^/wall\.[0-9a-f]+\.(?:avif|webp)$` с `proxy_hide_header Cache-Control` + `add_header Cache-Control "public, max-age=31536000, immutable"` + переобъявленными HSTS/nosniff/Referrer-Policy. Прогон на живом прод-edge — при деплое (`nginx -t` на хосте — часть prod-CD) | ✅ syntax; prod-edge при деплое |
| Negative | AC-003 покрывает возврат `wall.png`/runtime-grayscale — тест падает красным при регрессе (наблюдалось красным до реализации) | ✅ |
| Doc consistency | `wall.png`-упоминания разделены: **доставочные** (`styling.md`, `screen-landing.md`, `f-001-landing.md`, `design-system.md` §1, `tokens.css` комментарии) актуализированы; **визуально-дизайнерские** (constitution §III, design-system §9.7, emotion-map, ux-validation) не трогались — визуал не изменился; грандфадзеная история (009/010/015/016) не переписана. `rg wall.png` не оставляет доставочное описание устаревшим | ✅ |

Локальный пайплайн на HEAD: `npm --prefix app run lint:css` (exit 0, 101/101 warnings — без прироста),
`npm --prefix app run typecheck` (чисто), `npm --prefix app run lint` (0 errors, 91 pre-existing warnings),
`npm --prefix app run build` (success), `npm run lint:e2e` (0 errors, 3 pre-existing skip-warnings),
`npm run typecheck:e2e` (чисто), focused `wallpaper.spec.ts` — 2/2 passed (chromium + webkit-iphone).
Критерий истины для `test`-гейта — required-check на PR HEAD.
