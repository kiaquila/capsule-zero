# 044 — Plan & Verification

Однослайсовая доставка по TDD (application-код, спека ≥ 025): red-тест `hero.spec.ts` → реализация
hero (green) → живой design-review (desktop + mobile, RU/EN) → доки. Инфраструктурных изменений
нет; доки — support-слой, верифицируются просмотром диффа.

## Verification

| AC | Evidence | Result |
|---|---|---|
| AC-001 | Red: `hero.spec.ts` до реализации — 3 failed на отсутствующих `hero-*` testid'ах, chromium (коммит `53073f0`). Green: тот же прогон после реализации — 3 passed; computed `background-image` CTA = `linear-gradient(to right, rgb(239, 191, 4) 0%, rgb(255, 221, 0) 100%)` (проверено и Playwright-прогоном, и живым probe в браузере) | ✅ red→green |
| AC-002 | Тест «hero CTA opens the auth popup in sign-up mode» green (негатив: signIn-форма `toHaveCount(0)`); `auth-popup.spec.ts` не менялся и green в полном прогоне | ✅ |
| AC-003 | Тест «slides stub stays strictly below the first viewport» green на chromium (Desktop Chrome) и webkit-iphone (iPhone 14) в полном прогоне | ✅ |
| AC-004 | После финального social-preview refresh полный лендинг-набор `specs/landing/` в форме CI (`--workers=2`) снова **32/32 passed**; `social-preview.spec.ts` теперь дополнительно пинит digest PNG, остальные существующие спеки не менялись (POM расширен аддитивно). Отдельный screenshot/geometry probe на 1280×800 и 375×844 подтвердил `fold.height === viewport.height` и `stub.y === viewport.height`; desktop/mobile изображения просмотрены локально | ✅ |
| AC-005 | Native Codex P2 воспроизведён test-first: коммит `5e355a5` — reduced-motion тест failed (`expected "none", received "landing-cue"`); коммит `5eba941` — `@media (prefers-reduced-motion: reduce)` выключает animation; hero-suite **8/8 passed** на chromium + webkit-iphone против production build | ✅ red→green |
| Negative | Покрыты внутри AC-002 (signIn-форма отсутствует), AC-003 (стаб не пересекает первый вьюпорт) и AC-005 (scroll-cue не анимируется при reduced motion); все green, каждый контракт наблюдался красным до реализации | ✅ |
| Doc consistency | Native Codex P1 выявил старый manifesto/register контракт в активных источниках. MVP spec/prototype map, constitution, spec 010 (явное supersession), emotion-map, ux-validation и auth entry docs синхронизированы со specs 043/044; PRODUCT-PLAN актуализирован, research/старый HTML явно помечены историческими. `rg`-аудит не оставляет старую формулировку как действующее требование | ✅ |
| Social preview | Native Codex P1 воспроизведён test-first: `620f6bc` фиксирует red digest (`expected "refresh-required"`, получил старый SHA `84b23b…`); новый 1200×630 PNG снят с production build `/en` без overlays, visually inspected и закреплён SHA-256 `7dec0fb0…`. Focused social-preview suite проходит в Chromium + WebKit/iPhone | ✅ red→green |

Локальный пайплайн на финальном HEAD: `npm --prefix app run lint` (0 errors; 91 warnings total,
включая обоснованный soft-gate warning для 90-строчного `LandingPage` и существующие legacy warnings),
`npm --prefix app run typecheck` (чисто),
`npm --prefix app run build` (успех, 33 страницы), `npm run lint:e2e` (0 errors; 3 pre-existing
`.skip`-warnings во fullstack-спеках), `npm run typecheck:e2e` (чисто),
`node scripts/check-repo-baseline.mjs` (passed), `node scripts/check-feature-memory.mjs --worktree`
(passed). Финальная повторная проверка после Codex findings: production build — success (33 страницы),
hero-suite — 8/8, focused social-preview — 2/2, полный landing-suite — 32/32. Прогоны сьюта дефолтными 5 локальными воркерами флейкают по dev-only механике
(см. Process Memory) — критерий истины: форма CI (2 воркера) и required-check `test` на PR HEAD.
