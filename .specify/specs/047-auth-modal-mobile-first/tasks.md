# 047 — Tasks & Process Memory

**Input**: `.specify/specs/047-auth-modal-mobile-first/spec.md`, `plan.md`

## Tasks

- [x] T001 Ветка `fix/auth-mobile-modal` от свежего `origin/main`
      (worktree `worktrees/auth-mobile-modal`).
- [x] T002 Диагностика на живом `capsulezero.app` (mobile viewport): панель
      скроллится внутри, но скрыто 130px (375×812) / 275px (375×667); скролл
      невидим (нет скроллбара/fade), body не залочен; спека-констатация в Goal.
- [x] T003 AuthPanel: googleBlock кнопка→divider, блок первым элементом обеих
      форм; заголовок режима в шапке; поля name/country/city, required-note и
      "*" убраны; testid `auth-mode-switch`; overflow-детектор → `auth-panel-more`.
- [x] T004 Схема/экшен: `createSignUpSchema` без name/country/city; экшен без
      `name`; контракт провайдеров не тронут.
- [x] T005 CSS: max-height с safe-area, overscroll contain, mask fade, title;
      удалены мёртвые правила; LandingPage body scroll lock.
- [x] T006 i18n en/ru: `signInTitle`/`signUpTitle`, `confirmPassword` без "*",
      удалены неиспользуемые ключи.
- [x] T007 e2e: POM AuthPopup (testid switch, panelTitle, googleButton, signUp
      без name), registration.spec без имени, новый тест порядка/заголовков/
      состава полей, fixtures/locales.
- [x] T008 Доки той же поставкой: screen-auth.md (wireframe, Google placement,
      Responsive), f-002-auth.md (флоу регистрации), adr-002-auth.md (сбор
      country/city перенесён на профиль).
- [x] T009 Гейты: app lint, stylelint, typecheck, build, e2e lint/typecheck,
      целевые Playwright-спеки — зелёные (см. plan.md § Verification).
- [x] T010 Живая проверка в dev-стеке (docker compose dev) на 375×812, 375×667
      и стресс 640×420: скриншоты сняты; Verification заполнена. Попутный фикс:
      сброс scrollTop панели при смене режима (иначе новая форма открывалась
      серединой после тапа по ссылке под фолдом).
- [x] T012 Раунд фидбека владельца (2026-07-23), проведён через двухролевой цикл
      ui-ux-designer ↔ frontend: заголовок 20px/400 (§9.6-аудит, вместе с
      `.notification-banner-copy h2`); компактный ритм колонки (резерв под
      ошибку 16px, поля впритык, divider 12px — sign-up короче на ~44px);
      фикс автофилла Chrome (never-completing transition, стекло сохраняется);
      уточнение §9.6 в design-system.md (полоса 20–23px → вес ≥ 400).
- [x] T013 Live design-review дизайнера по скриншотам dev-стека: APPROVE.
      Полировка по ревью: `.auth-field-message-error` inline-block → block
      (baseline-зазор давал +8px вместо спроектированных +4px на ошибку).
      Ручной шаг владельца: проверить реальный Chrome-автофилл на логине
      (поля должны остаться стеклянными с белым текстом; фон на фокусе у
      автозаполненного поля не тонируется — ратифицированный side effect).
- [x] T011 TDD red-артефакт: новый тест «panel is titled per mode and the
      Google button sits above the email field» прогнан против прода
      (https://capsulezero.app, ещё старый UI) — 1 failed (нет
      `auth-mode-switch`/`auth-panel-title` в старом DOM). Коммит теста идёт
      первым в ветке, реализация — следующим коммитом; green-прогоны — в
      plan.md § Verification.

- [x] T014 Post-push OSV-сигнал на PR HEAD: GHSA-6g55-p6wh-862q (postcss
      8.5.10, High 7.5) — override в app/package.json поднят до fixed 8.5.12,
      lockfile обновлён, stylelint/production build перепроверены. npm-audit
      дополнительно шумит на sharp/libvips (GHSA-f88m-g3jw-g9cj) — по базе OSV
      resolved-версия не затронута, osv-scan его не флагает; источник истины —
      osv-scan на PR HEAD (паттерн 045).

## Process Memory

### Decisions

- Google выше email-формы — прямое решение владельца продукта (2026-07-22),
  вместе с отказом от полей name/country/city в модалке (перенос на профиль,
  где country/city уже редактируются; country/city на регистрации и так
  отбрасывались экшеном — фикс убирает мёртвый ввод, а не функциональность).
- `.auth-mode-switch` в шапке удалён как источник путаницы («LOG IN» над формой
  регистрации на скриншоте владельца читался как заголовок) — заголовок режима
  теперь единственный элемент слева в шапке, включая recovery-режимы (их `<h2>`
  переехал из тела формы).
- Запас высоты панели: `calc(100svh - 112px - env(safe-area-inset-bottom, 0px))`
  — 80px top-offset попапа + ≥32px низ; прежние 128px без safe-area не
  спасали в Telegram in-app браузере, чья нижняя панель плавает над вьюпортом.
- Fade — mask-image на самой панели (контент и стекло растворяются вместе),
  а не отдельный градиент-оверлей: на глассморфизме поверх фото любой
  подобранный цвет градиента даёт грязную кромку.
- `signUpTab` удалён из messages и тестовых фикстур; `logInTab` остался —
  это текст submit-кнопки входа.

### Follow-ups

- Онбординг-сбор имени после первой ценности — в русле PRODUCT-PLAN (первая
  ценность до регистрации); отдельным слайсом.
- E2e-тест мобильной геометрии (AC-004) оставлен живой браузер-проверкой:
  Playwright-проекты не гоняют landing-попап на мобильном вьюпорте отдельно;
  добавление mobile-проекта — отдельное решение по бюджету CI.
