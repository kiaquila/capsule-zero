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
| Negative | Красный прогон нового теста на старом UI фиксируется при подготовке PR (TDD red-артефакт, tasks T011); регресс порядка/состава полей ловится green-ассертами | pending (PR prep) |

Локальные гейты на текущем HEAD: app typecheck — чисто; ESLint — 0 errors /
91 pre-existing warnings; stylelint — 0 errors / 99 pre-existing warnings;
production build — exit 0; e2e lint — 0 errors / 3 pre-existing `.skip()`
warnings; e2e typecheck — чисто; `check-feature-memory --worktree` — passed via
048-триплет. Целевые Playwright-спеки (`auth-popup` + `registration`, chromium,
против docker dev-стека) — 5/5 passed. Критерий истины для GitHub-гейтов —
checks на PR HEAD.
