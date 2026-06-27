# Screen: Landing Page
URL: /
Feature: features/f-001-landing.md
Prototype: `html-prototypes/index.html`

## Desktop Layout (1280px+)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                        [EN ▾]  [Register]               │
│                                                         │
│                                                         │
│                                                         │
│              ████████████████████████████                │
│              ████████████████████████████                │
│              ████  B&W Editorial  ██████                │
│              ████  Fashion Photo  ██████                │
│              ████████████████████████████                │
│              ████████████████████████████                │
│                                                         │
│                                                         │
│           FEWER ITEMS. MORE OUTFITS.                    │
│           ZERO "NOTHING TO WEAR" MORNINGS.              │
│                                                         │
│                                                         │
│                                                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ Cookie Banner (glass)                      [Accept]     │
└─────────────────────────────────────────────────────────┘
```

## Mobile Layout (375px)

```
┌───────────────────────┐
│          [EN▾] [Register]│
│                       │
│   ████████████████    │
│   ████████████████    │
│   ████ B&W Photo █   │
│   ████████████████    │
│   ████████████████    │
│                       │
│  FEWER ITEMS.         │
│  MORE OUTFITS.        │
│  ZERO "NOTHING TO     │
│  WEAR" MORNINGS.      │
│                       │
│                       │
├───────────────────────┤
│ Cookie Banner [Accept]│
└───────────────────────┘
```

## Elements
- **Background:** `wall.png` grayscale + gradient overlay (full viewport)
- **Hero Photo:** Full-screen B&W editorial fashion image, centered
- **Manifesto:** Large thin headline text, centered below photo
- **Register Button:** Glass button (`rgba(255,255,255,.36)`), top-right
- **Language Switcher:** Glass dropdown (EN/RU in v0.1; ES-AR deferred to v0.2), next to Register
- **Cookie Banner:** Glass panel at bottom

## Interactivity
- Click [Register] → glassmorphic auth popup overlay (see screen-auth.md)
- Click [EN ▾] → dropdown with EN / RU options
- Scroll → no scroll on landing (single viewport)
- Page load < 2 sec on 4G
