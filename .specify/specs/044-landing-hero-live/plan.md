# 044 — Plan & Verification

Однослайсовая доставка по TDD (application-код, спека ≥ 025): red-тест `hero.spec.ts` → реализация
hero (green) → живой design-review (desktop + mobile, RU/EN) → доки. Инфраструктурных изменений
нет; доки — support-слой, верифицируются просмотром диффа.

## Verification

| AC | Evidence | Result |
|---|---|---|
| AC-001 | Red: targeted-прогон `hero.spec.ts` до реализации — падает на отсутствующих `hero-*` testid'ах (коммит red-теста). Green: тот же прогон после реализации — passed; computed `background-image` CTA содержит `linear-gradient` + `rgb(239, 191, 4)` | заполняется на PR HEAD |
| AC-002 | Тест «hero CTA opens the auth popup in sign-up mode» green (негатив: signIn-форма `toHaveCount(0)`); `auth-popup.spec.ts` без правок green | заполняется на PR HEAD |
| AC-003 | Тест «slides stub stays strictly below the first viewport» green на обоих проектах (chromium + webkit-iphone) | заполняется на PR HEAD |
| AC-004 | Полный лендинг-набор `specs/landing/` green без правок существующих спеков; скриншоты desktop 1280 / mobile 375 (RU+EN) в PR body | заполняется на PR HEAD |

Локальный пайплайн на финальном HEAD: `npm --prefix app run lint`, `npm --prefix app run
typecheck`, `npm --prefix app run build`, `npm run lint:e2e`, `npm run typecheck:e2e`,
`node scripts/check-repo-baseline.mjs`, `node scripts/check-feature-memory.mjs --worktree`,
targeted Chromium+WebKit `specs/landing/`. Результаты — в PR body.
