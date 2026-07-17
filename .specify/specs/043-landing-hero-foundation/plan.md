# 043 — Plan & Verification

Однослайсовая доставка: прототипы → red-тест → токены (green) → доки. TDD применён к
application-изменению (токены/стили — пользовательски видимое поведение web UI); прототипы и доки —
support-слой, верифицируются живым просмотром и грепом.

## Verification

| AC | Evidence | Result |
|---|---|---|
| AC-001 | Red: targeted Chromium run `design-tokens.spec.ts` до правки токенов — 2 failed, `--color-error` = `rgb(255, 214, 0)`, exit 1 (коммит `1a703be`). Green: тот же прогон после прошивки токенов — 2 passed (см. PR checks + локальный прогон в PR body) | ✅ red→green |
| AC-002 | Тот же green-прогон: `resolvedTokenColor()` подтверждает `rgb(239, 191, 4)` / `rgb(255, 221, 0)` / `rgb(255, 122, 112)` / `rgb(10, 10, 10)`; `--btn-cta-bg` содержит `linear-gradient`. Примечание: `var()`-ссылки внутри `@theme` не эмитятся Tailwind v4 без inline — составные значения записаны литералами (см. Process Memory) | ✅ |
| AC-003 | Живой просмотр `v1c-final.html` в Browser pane: десктоп 1440×900 (заголовок 2×2 слова, заглушка ниже фолда — скриншоты в сессии), мобайл 375×812; RU/EN-переключение проверено | ✅ |
| AC-004 | `grep -rn "FFD600" docs_capsule_zero .specify/memory AGENTS.md CLAUDE.md PRODUCT-PLAN.md` — оставшиеся вхождения только исторические/дата-несущие (research-замер D3, spec-архивы 024/032/039, аудит-снапшот), каждое активное упоминание переписано на `#FF5449` | ✅ grep-свип |
| Negative | Тест «negative: the retired yellow is absent…» зелёный на HEAD; при откате базы на `#FFD600` падает (продемонстрировано red-прогоном на исходном состоянии) | ✅ |

Локальный пайплайн на финальном HEAD: `npm --prefix app run lint` (0 errors), `npm --prefix app run
typecheck`, `npm --prefix app run build`, `npm run lint:e2e` (0 errors), `npm run typecheck:e2e`,
`node scripts/check-repo-baseline.mjs`, `node scripts/check-feature-memory.mjs --worktree`,
targeted Chromium `design-tokens.spec.ts`. Результаты — в PR body.
