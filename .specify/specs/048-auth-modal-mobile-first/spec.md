# 048 — Auth Modal Mobile-First: Google сверху, форма без лишних полей, честный скролл

## Goal

На мобильных (репорт из Telegram in-app браузера, iPhone) попап регистрации не
влезает в экран: панель обрезается на середине "OR", Google-кнопка и ссылки
остаются за нижним краем. Внутренний скролл существует, но невидим (скрытый
скроллбар, ни fade, ни другого аффорданса), body позади не заблокирован — свайп
уходит в страницу. Замер на живом `capsulezero.app`: при 375×812 за краем
спрятано 130px контента, при 375×667 — 275px (треть формы).

Фикс из четырёх частей:

1. **Google ведёт форму** (решение владельца продукта, 2026-07-22): кнопка
   "Continue with Google" — первый элемент обеих форм (sign-in и sign-up),
   за ней divider "or", затем email-поля. Главный путь входа остаётся выше
   мобильного фолда.
2. **Регистрация — только креденшелы**: email + password + confirm. Поля
   name/country/city из модалки убраны — country/city и так отбрасывались в
   `signUpWithPasswordAction` (валидировались и не отправлялись провайдеру),
   name опционален; всё редактируется на профиле (spec 020), где уже есть
   country/city/имя.
3. **Геометрия и скролл**: `max-height` панели учитывает `env(safe-area-inset-bottom)`
   и запас под плавающие панели in-app браузеров; body-скролл лочится, пока
   попап открыт; `overscroll-behavior: contain`; при переполнении низ панели
   растворяется (mask fade) — обрезка читается как продолжение, а не как баг.
4. **Заголовок панели**: прежняя верхняя кнопка-переключатель ("LOG IN" над
   формой регистрации) читалась как неверный заголовок. Теперь в шапке —
   заголовок активного режима (Log In / Create Account / Password recovery),
   переключение — только ссылкой под формой.

## Scope

**In:**

- `app/src/components/auth/AuthPanel.tsx` — порядок googleBlock (кнопка →
  divider → поля) в обоих режимах; заголовок `auth-panel-title` вместо
  header-переключателя; убраны required-note, поля name/country/city и
  звёздочки required-плейсхолдеров (все оставшиеся поля обязательны); ref +
  scroll/ResizeObserver-эффект → класс `auth-panel-more`; `data-testid`
  `auth-mode-switch` на ссылках переключения; у recovery-режимов `<h2>`
  переехал из формы в шапку.
- `app/src/features/auth/schemas.ts` — `createSignUpSchema` без
  name/country/city (и без ставшего ненужным `optionalText`).
- `app/src/features/auth/actions.ts` — `signUpWithPasswordAction` не передаёт
  `name` провайдеру (контракт `PasswordCredentials.name?` не тронут).
- `app/src/features/profile/display-name.ts`,
  `app/src/components/{dashboard,profile}/*-data.ts` — общий fallback
  display-name из email local-part, если credentials-only регистрация не дала
  ни session name, ни profile display name; dashboard/profile не показывают
  пустую или вымышленную идентичность.
- `app/src/components/landing/LandingPage.tsx` — body scroll lock, пока открыт
  попап.
- `app/src/app/globals.css` — `.auth-panel` max-height
  `calc(100svh - 112px - env(safe-area-inset-bottom, 0px))` +
  `overscroll-behavior: contain`; `.auth-panel-more` mask fade;
  `.auth-panel-title`; `.auth-divider`/`.auth-social` отступы под новый
  порядок; удалены мёртвые `.auth-mode-switch`, `.auth-optional-row`,
  `.auth-required-note`, `.auth-recovery-title`.
- `app/src/messages/{en,ru}.json` — `signInTitle`/`signUpTitle`; `confirmPassword`
  без "*"; удалены `signUpTab`, `name`, `country`, `city`, `requiredNote`.
- `tests/e2e` — POM `AuthPopup` (testid-переключатель, `panelTitle`,
  `googleButton`, `signUp` без name); `registration.spec.ts` без "E2E"-имени;
  `auth-popup.spec.ts` + тест заголовков, порядка (Google выше email по
  bounding box) и состава полей регистрации (ровно 3 инпута);
  `fixtures/locales.ts` — `signInTitle`/`signUpTitle` вместо `signUpTab`.
- Доки той же поставкой: `docs_capsule_zero/screens/screen-auth.md`,
  `docs_capsule_zero/features/f-002-auth.md`, `docs_capsule_zero/adr/adr-002-auth.md`.

**Out:**

- Бэкенд/Kratos/Go API — контракты не меняются (`name` в
  `PasswordCredentials` остаётся опциональным; профильный PATCH как был).
- Онбординг-шаг сбора имени/локации после регистрации — отдельное продуктовое
  решение (Stage 1 guest-loop, spec 046).
- Apple Sign-In (Stage 2), account linking (спек 037 Known Issues).
- Историчные спеки 001/010 не переписываются — акцепт-критерий «optional
  location fields skippable» superseded этой спекой.

## Acceptance Criteria

- AC-001: в sign-in и sign-up кнопка Google (когда провайдер включён) —
  первый элемент формы, выше email-поля; divider "or" между ней и полями.
- AC-002: форма регистрации содержит ровно три инпута (email, password,
  confirm password); required-note и звёздочки отсутствуют.
- AC-003: в шапке панели — заголовок активного режима (Log In / Create
  Account / recovery); прежней кнопки-переключателя в шапке нет; переключение
  работает ссылками под формой.
- AC-004: на вьюпорте 375×812 обе формы (sign-in и sign-up, Google включён)
  видны целиком без скролла; на 375×667 переполненная панель показывает fade
  внизу, контент доскролливается до конца, body позади не скроллится.
- AC-005: регистрация email+password проходит на mock и api провайдерах
  (существующие e2e), Google-флоу спека 037 не сломан.
- AC-006: если API-backed credentials-only регистрация возвращает пустые
  `session.name` и `profile.displayName`, dashboard/profile используют
  непустой email local-part как display name и строят из него инициалы.
