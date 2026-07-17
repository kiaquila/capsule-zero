# 044 — Tasks

- [ ] T001 Спека 044 (spec/plan/tasks) — фиксация фаундерских решений слайса
- [ ] T002 Red: POM-расширение `LandingPage.ts` + `specs/landing/hero.spec.ts`, red-прогон, коммит
- [ ] T003 Green: `LandingPage.tsx` + `landing-*` CSS + messages + возврат CTA-токенов в `@theme`
- [ ] T004 Живой design-review (desktop 1280 / mobile 375, RU+EN) + code review, фиксы
- [ ] T005 Доки тем же изменением: screen-landing, f-001-landing, ui-texts, PRODUCT-PLAN, §9.11(d)
- [ ] T006 Verification-таблица + Process Memory + PR c SENAR Done Gate

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
  последний шаг 039); повторяем задокументированное stylelint-исключение из
  `.landing-manifesto p`, чтобы значение схлопнулось в токен, когда ретюн приземлится.
- **Маппинг без-токенных литералов прототипа:** hover ghost-логина `.10` → `--btn-ghost-bg`
  (точное совпадение); фон заглушки `.05` → `--color-white-a04` (+.01, имперцептно); dashed-бордер
  заглушки `.28` → `--color-white-a24` (−.04, заглушка post-MVP — не прецедент); футер `.58` —
  текущий футер уже сидит на `--glass-border` (.58, точное совпадение), сохраняем.

### Dead Ends

- (заполняется по ходу)

### Known Issues

- `og:image` (`/social/capsule-zero-homepage.png`) после редизайна визуально устаревший —
  перегенерировать follow-up'ом; `social-preview.spec.ts` проверяет URL/размеры, не содержимое.
- Контент «Как это работает» — заглушка (post-MVP, PRODUCT-PLAN §5 Этап 1 п.1).
