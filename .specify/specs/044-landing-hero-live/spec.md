# 044 — Landing Hero Live: перенос утверждённого hero в живой `/app`

## Goal

Перенести утверждённый фаундером hero главной (контракт: `html-prototypes/landing-v2/v1c-final.html`
+ `design-system.md` §9.11(d), спека 043) в живой `/app`-лендинг (React/next-intl) и снять
заморозку 043 фаундерским решением 2026-07-17: до появления гостевого инструмента (Q1/Q2/Q3/Q6,
PRODUCT-PLAN §4) CTA «Попробовать бесплатно» **временно** открывает существующий auth-попап в
режиме регистрации; RU-копия hero остаётся на «ты», как в утверждённом прототипе (Known Issue 043
закрыт). Дальше лендинг дорабатывается «по живому» мелкими PR — каждый мерж в `main` деплоится на
`https://capsulezero.app`.

## Scope

**In:**

- `app/src/components/landing/LandingPage.tsx` — структура hero по контракту §9.11(d): gold-лого
  13px/600 слева; справа переключатель языка + ghost-«Войти» 34px (сохраняет
  `data-testid="auth-trigger"` и режим входа); центрированный hero — H1 Helvetica 200 uppercase
  `clamp(32px, 5.4vw, 60px)` в две строки по два слова, sub 18px/400, CTA-pill 56px на
  `--btn-cta-*` (`data-testid="hero-cta"`, открывает `AuthPanel` popup с `initialMode="signUp"`),
  scroll-cue (без анимации при `prefers-reduced-motion: reduce`); заглушка «Как это работает»
  строго под фолдом; футер прежний (testid'ы сохранены);
  `CookieBanner`/`LanguageSwitcher`/`AuthPanel` переиспользуются без изменений.
- `app/src/app/globals.css` — `landing-*` правила переписаны на токены (ghost-логин на
  `--btn-ghost-*`; заглушка/футер на ступени alpha-ramp'а; sub — литерал `.78` по
  задокументированному 039-паттерну stylelint-исключения до ретюна `--color-text-secondary`).
- `app/src/styles/tokens.css` — комментарий блока `@theme static` актуализирован: у gold/CTA-семьи
  появились потребители (лендинг-hero), но семья **остаётся** в `@theme static` — `--color-gold-450`
  не имеет `var()`-потребителя (только литерал внутри `--btn-cta-bg`), и обычный `@theme` вырезал бы
  его, уронив гвард `design-tokens.spec.ts` (Process Memory 043, Dead End «Tailwind v4 strips unused»).
- `app/src/messages/en.json` / `ru.json` — hero-копия по утверждённому прототипу (RU на «ты»),
  копирайт `© 2026`.
- `tests/e2e/` — расширение POM `LandingPage.ts` + новый `specs/landing/hero.spec.ts`
  (TDD red→green; негативы sign-in/stub/reduced-motion внутри).
- Доки тем же изменением: `docs_capsule_zero/screens/screen-landing.md`,
  `docs_capsule_zero/features/f-001-landing.md`, `docs_capsule_zero/i18n/ui-texts.md`,
  PRODUCT-PLAN.md (interim-CTA решение), `design-system.md` §9.11(d) (отметка о реализации).

**Out:**

- Гостевой инструмент и решения Q1/Q2/Q3/Q6 — CTA перенацеливается на него отдельным слайсом,
  когда он появится (interim-маршрут фиксируется как временный).
- Контент «Как это работает» (post-MVP), OPR-демо, соцдоказательство.
- Перегенерация `og:image` (`/social/capsule-zero-homepage.png`) — follow-up после мержа;
  `social-preview.spec.ts` проверяет URL/размеры, не содержимое.
- 039-ретюны токенов (`--color-text-secondary` → `.78`, `--input-focus-border` → `.82`) —
  остаются в последовательности спеки 039.

## Acceptance criteria

- **AC-001:** hero рендерится по контракту §9.11(d): H1 в две строки, sub, gold-лого, CTA
  «Попробовать бесплатно» / "Try for free" на `--btn-cta-*` — computed `background-image`
  CTA содержит `linear-gradient` с золотой базой `rgb(239, 191, 4)`.
- **AC-002:** клик по hero-CTA открывает auth-попап в режиме регистрации: signUp-форма видима,
  signIn-форма **отсутствует в DOM** (негатив); ghost-«Войти» открывает тот же попап в режиме
  входа — существующий `auth-popup.spec.ts` остаётся зелёным без правок.
- **AC-003:** первый экран — ровно один вьюпорт: заглушка слайдов не пересекает первый вьюпорт
  (негатив) на десктопе (chromium Desktop Chrome) и мобайле (webkit iPhone 14).
- **AC-004:** футер, куки-баннер и переключатель языка сохранены: существующие лендинг-спеки
  (`cookie-banner`, `legal-links`, `design-tokens`, `social-preview`) зелёные без правок.
- **AC-005:** при системной/браузерной настройке `prefers-reduced-motion: reduce` декоративный
  scroll-cue статичен (`animation-name: none`); бесконечное вертикальное движение отсутствует.

## Negative scenario

Покрыт AC-002 (signIn-форма отсутствует в попапе, открытом из hero-CTA), AC-003 (заглушка
слайдов не видна в первом вьюпорте) и AC-005 (декоративная стрелка не продолжает бесконечную
анимацию при reduced motion). Регрессия любого из них роняет `hero.spec.ts` и блокирует merge
через required-check `test`.
