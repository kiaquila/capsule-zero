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
| AC-004 | Полный лендинг-набор `specs/landing/` в форме CI (`--workers=2`, свежий бут сервера): **30/30 passed за 19.9 с**; существующие спеки не правились (POM расширен аддитивно). Скриншоты desktop 1280 / mobile 375 — в PR body | ✅ |
| Negative | Покрыты внутри AC-002 (signIn-форма отсутствует в попапе из CTA) и AC-003 (стаб не пересекает первый вьюпорт) — оба green, оба падали в red-прогоне | ✅ |

Локальный пайплайн на финальном HEAD: `npm --prefix app run lint` (0 errors; 91 pre-existing
module-size warnings в замороженном supabase-легаси), `npm --prefix app run typecheck` (чисто),
`npm --prefix app run build` (успех, 33 страницы), `npm run lint:e2e` (0 errors; 3 pre-existing
`.skip`-warnings во fullstack-спеках), `npm run typecheck:e2e` (чисто),
`node scripts/check-repo-baseline.mjs` (passed), `node scripts/check-feature-memory.mjs --worktree`
(passed). Прогоны сьюта дефолтными 5 локальными воркерами флейкают по dev-only механике
(см. Process Memory) — критерий истины: форма CI (2 воркера) и required-check `test` на PR HEAD.
