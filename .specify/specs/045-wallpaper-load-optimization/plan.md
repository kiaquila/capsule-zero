# 045 — Plan & Verification

Однослайсовая доставка. Application-код (spec ≥ 025) — по TDD: red `wallpaper.spec.ts` →
реализация (green) → живая браузер-проверка. Ассеты, nginx-кэш и доки — support/infra-слой:
верифицируются замером байт, `nginx -t` и просмотром диффа (TDD-exempt по конституции §VII).

## Verification

| AC | Evidence | Result |
|---|---|---|
| AC-001 | Red: `wallpaper.spec.ts` до preload — chromium `toHaveCount(1)` для `link[rel=preload][as=image]` → received 0 (лог `red.log`). Green: тест после `ReactDOM.preload` в `[locale]/layout.tsx` проверяет count/as/href/**type/fetchpriority** на chromium и webkit-iphone. Живой браузер (`localhost:3000/en`): `<head>` содержит ровно один preload `href=/wall.b6f0e360.avif`, `type=image/avif`, `fetchpriority=high` | ✅ red→green |
| AC-002 | Green-тест: computed `.wallpaper-bg` `filter === "none"`, `background-color === "rgb(10, 10, 10)"`. Живой probe подтвердил те же значения | ✅ |
| AC-003 | Green-тест: `background-image` содержит `wall.` и `.avif/.webp`, `not.toContain("/wall.png")`; response-listener на современных chromium + webkit-iphone видит ровно один `wall.b6f0e360.avif` 200 и ни WebP, ни PNG. Safari 16 исключение задокументировано как принятый ≤108 КБ AVIF+WebP trade-off: AVIF поддержан с 16.0, optional `type()` в `image-set()` — с 17.0 | ✅ current targets; legacy trade-off documented |
| AC-004 | `ls -l app/public`: `wall.b6f0e360.avif` ≈ 43 КБ, `wall.f16b13cb.webp` ≈ 63 КБ vs. удалённый `wall.png` 1 940 725 Б → −97.7% (AVIF) / −96.7% (WebP). Скриншот `/en`: wallpaper рендерится без потери качества под overlay+glass | ✅ |
| AC-005 | Guard читает каждый referenced asset, требует существование и совпадение filename-префикса с SHA-256 байтов (`b6f0e360…` AVIF, `f16b13cb…` WebP), а AVIF CSS URL — с preload. `nginx -t` на изолированной копии location-блока — `syntax is ok / test is successful`; diff обоих edge-конфигов сохраняет immutable + HSTS/nosniff/Referrer-Policy и не добавляет immutable на errors (`Cache-Control` без `always`). Живой prod-edge — при деплое | ✅ content-address guard + syntax; prod-edge at deploy |
| Negative | AC-002 покрывает возврат runtime-grayscale; AC-003 — возврат `wall.png`; content-address guard — отсутствующий/stale-hash ассет. Red-артефакт исходной TDD-итерации доказывает AC-001; остальные негативы подтверждены зелёными regression assertions | ✅ |
| Security signal | Clean `npm ci --ignore-scripts` в `app` + `tests/e2e` — 0 vulnerabilities; `npm ls` подтверждает `brace-expansion` 1.1.16/5.0.7 и `js-yaml` 4.3.0. GitHub `osv-scan` на PR HEAD — post-push source of truth | ✅ local; GitHub HEAD gate |
| Doc consistency | Актуальные SSOT (`constitution`, `design-system`, feature/screen/styling docs, spec Process Memory) описывают активный фон как grayscale wallpaper/AVIF+WebP; `wall.png` встречается только как явно retired/history/negative-regression имя. Грандфадзеная история 009/010/015/016 не переписана | ✅ |

Адверсариальное ревью перед PR (3 параллельных агента): security — CLEAN (LOW), frontend/design —
COMPLIANT, code-reviewer — COMMENT (1×P2 + 3×P3, все отработаны — см. `tasks.md` § Review-driven
fixes). Ключевой P2 (immutable-кэш error-ответов) исправлен: `always` снят со строки Cache-Control;
`docker … nginx -t` на обновлённом блоке — снова ok; e2e после фиксов — **4/4** (2 теста × chromium
+ webkit-iphone), включая guard равенства хэшей.

Локальный пайплайн на исправленном HEAD: `npm run preflight` — exit 0: feature-memory/repo/API
contracts, app lint (0 errors, 91 pre-existing warnings), stylelint (100/101), typecheck, production
build, e2e lint/typecheck и полный Playwright — **54 passed / 8 expected skipped**. Focused
`wallpaper.spec.ts` — **4/4** (2 теста × chromium + webkit-iphone), включая network 200 и
content-address guard. Критерий истины для GitHub-гейтов — checks на PR HEAD.
