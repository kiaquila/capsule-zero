# Screen: Landing Page
URL: /
Feature: features/f-001-landing.md
Prototype: `html-prototypes/landing-v2/v1c-final.html` (утверждён фаундером, спека 043; контракт: `design-system.md` §9.11(d)). Реализовано в живом `/app` спекой 044.

## Desktop Layout (1280px+)

```
┌─────────────────────────────────────────────────────────┐
│ CAPSULE ZERO (gold)                  [RU ▾]  [Войти]    │
│                                                         │
│                                                         │
│                  СОЗДАЙ СВОЮ                            │
│                  ГАРДЕРОБНУЮ КАПСУЛУ                    │
│                                                         │
│      Загрузи несколько фото любимых вещей — и узнай,    │
│      что добавить, чтобы образов на каждый день         │
│      стало больше                                       │
│                                                         │
│              [ Попробовать бесплатно ]  ← gold CTA      │
│                                                         │
│                         ▾                               │
├─── ниже фолда ──────────────────────────────────────────┤
│  КАК ЭТО РАБОТАЕТ — СЛАЙДЫ ПОЯВЯТСЯ ЗДЕСЬ               │
│  [01 stub] [02 stub] [03 stub]                          │
├─────────────────────────────────────────────────────────┤
│ Условия · Конфиденциальность · Cookie · © 2026          │
└─────────────────────────────────────────────────────────┘
```

Первый экран (header + hero + scroll-cue) — **ровно один вьюпорт**; заглушка слайдов не
выглядывает (e2e-негатив `hero.spec.ts`).

## Mobile Layout (375px)

Та же структура: header сжимает паддинги, H1 на clamp-минимуме 32px, sub 16px, заглушка в одну
колонку. Первый экран — один вьюпорт.

## Elements
- **Background:** `wall.png` grayscale + трёхточечный gradient overlay (как во всём приложении)
- **Logo:** «Capsule Zero» текстом, gold (`--color-gold-500`), 13px/600 uppercase, без трекинга — слева в header
- **Hero H1:** Helvetica 200 uppercase `clamp(32px, 5.4vw, 60px)`, две строки по два слова (явный перенос в копии)
- **Hero subtitle:** 18px/400 (16px mobile), secondary `.78`
- **Primary CTA:** gold pill 56px на `--btn-cta-*` («Попробовать бесплатно» / "Try for free"), без стрелки и микро-подписи; `data-testid="hero-cta"`
- **Ghost login:** «Войти», 34px min-height, прозрачный с hover `--btn-ghost-bg`; `data-testid="auth-trigger"`
- **Language Switcher:** существующий компонент (EN/RU в v0.1; ES-AR отложен на v0.2), рядом с «Войти»
- **Scroll cue:** «▾» с мягкой анимацией, aria-hidden; статичен при `prefers-reduced-motion: reduce`
- **Slides stub:** секция-заглушка «Как это работает» (контент — post-MVP), строго под фолдом; `data-testid="slides-stub"`
- **Footer:** Условия · Конфиденциальность · Настройки cookie · © 2026 (testid'ы сохранены)
- **Cookie Banner:** существующий glass-компонент

## Interactivity
- Клик [Попробовать бесплатно] → auth-попап в режиме **регистрации** (`AuthPanel`
  `initialMode="signUp"`) — **временный маршрут** до появления гостевого инструмента
  (PRODUCT-PLAN, решение 2026-07-17); затем CTA перенацеливается на гостевой флоу
- Клик [Войти] → auth-попап в режиме входа (см. screen-auth.md)
- Клик [RU ▾] → дропдаун EN / RU
- Скролл → к заглушке «Как это работает» и футеру
- Page load < 2 sec on 4G
