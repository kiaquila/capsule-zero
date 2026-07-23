# 048 — Plan & Verification

Однослайсовая доставка. Application-код (spec ≥ 025) — по TDD: расширенный
`auth-popup.spec.ts` (заголовки, порядок Google/email, состав полей) красный на
старом UI → реализация → green. CSS-геометрия и доки — верифицируются живой
браузер-проверкой на мобильных вьюпортах и просмотром диффа.

## Verification

| AC | Evidence | Result |
|---|---|---|
| AC-001 | e2e `auth-popup.spec.ts` «panel is titled per mode…»: bounding box Google-кнопки выше email-инпута — passed (chromium, api-провайдер, `AUTH_GOOGLE_ENABLED=true`). Живой браузер localhost:3000: скриншоты sign-in/sign-up 375×812 | ✅ |
| AC-002 | тот же тест: `form input` count = 3 в sign-up — passed. Скриншот 375×812: email/password/confirm, без note и звёздочек | ✅ |
| AC-003 | тот же тест: `.auth-panel-title` Log In → Create Account после `auth-mode-switch` — passed; grep: `.auth-mode-switch` отсутствует в `app/src` | ✅ |
| AC-004 | Живой браузер dev-стека: 375×812 — обе формы целиком (sign-up scrollHeight = clientHeight); 375×667 — форма регистрации тоже влезает целиком (542px контента при 555px доступных — fade не требуется); стресс 640×420 — fade появляется (`auth-panel-more`), scrollTop сбрасывается в 0 при смене режима, `body.style.overflow === "hidden"` пока попап открыт | ✅ |
| AC-005 | `registration.spec.ts` — passed против прод-shape стека (Go API + Kratos + Postgres): регистрация email+password → сессия → /dashboard. `google-sign-in.spec.ts` не гонялся локально (dev-стек без Kratos OIDC-креденшелов — mock-петля живёт в CI); порядок/видимость кнопки покрыты AC-001 | ✅ (google loop — CI) |
| AC-006 | `profile-name-fallback.spec.ts`: API-shaped session/profile без имени → email `new.user@example.com` даёт display name `new.user`, initials `NU`; RED commit `72b8309` получил `""`, green focused Chromium — 1/1 | ✅ |
| AC-007 | тот же spec, реальный mock provider: credentials-only `mock.user@example.com` не получает founder fixture; RED `7e2186c` получил `Capsule Zero Founder`, green focused Chromium — 2/2 вместе с API path | ✅ |
| AC-008 | `rg` по активным source docs: `f-002-auth.md` acceptance criteria и `i18n/ui-texts.md` больше не содержат optional location, Sign Up tabs, required-note, `*` или optional Name; historical HTML prototypes остаются явно grandfathered | ✅ |
| Negative | Красный прогон auth-popup теста на старом UI (T011), RED `72b8309` с пустым API dashboard name и RED `7e2186c` с founder identity в mock; все три регресса закрыты green-ассертами | ✅ |

Локальные гейты на текущем HEAD: app typecheck — чисто; ESLint — 0 errors /
91 pre-existing warnings; stylelint — 0 errors / 99 pre-existing warnings;
production build — exit 0; e2e lint — 0 errors / 3 pre-existing `.skip()`
warnings; e2e typecheck — чисто; `check-feature-memory --worktree` — passed via
048-триплет. Целевые Playwright-спеки (`auth-popup` + `registration`, chromium,
против docker dev-стека) — 5/5 passed. Критерий истины для GitHub-гейтов —
checks на PR HEAD. После merge с текущим `main`: `auth-popup` + `registration`
+ API/mock no-name regressions — 7/7 Chromium; app/e2e typecheck и quiet ESLint,
stylelint (0 errors / 99 pre-existing warnings), production build,
feature-memory и repository-baseline guards — passed.
