# Screen: Profile
URL: /profile
Feature: features/f-004-profile.md
Prototype: `html-prototypes/profile.html`

## Desktop Layout

```
┌─────────────────────────────────────────────────────────┐
│ [← Dashboard]          Profile               [Avatar]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│          ┌──────────────────────────────┐                │
│          │        Glass Panel          │                │
│          │                              │                │
│          │     ┌──────────┐             │                │
│          │     │ ████████ │             │                │
│          │     │ ████████ │  [Change]   │                │
│          │     │  Avatar  │  [Remove]   │                │
│          │     └──────────┘             │                │
│          │                              │                │
│          │  ┌──────────────────────┐    │                │
│          │  │ Full name            │    │                │
│          │  └──────────────────────┘    │                │
│          │  ┌──────────────────────┐    │                │
│          │  │ Email (read-only)    │    │                │
│          │  └──────────────────────┘    │                │
│          │  ┌──────────────────────┐    │                │
│          │  │ Language [EN ▾]      │    │                │
│          │  └──────────────────────┘    │                │
│          │  ┌──────────────────────┐    │                │
│          │  │ Country / City       │    │                │
│          │  └──────────────────────┘    │                │
│          │                              │                │
│          │  [      Save Changes    ]    │                │
│          │                              │                │
│          │  [Log Out]                   │                │
│          └──────────────────────────────┘                │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [My Items] [Capsules] [♡] [Profile]                    │
└─────────────────────────────────────────────────────────┘
```

## Elements
- **Avatar:** Circular photo with Change/Remove options
- **Fields:** Name, email, language, location
- **Language dropdown:** EN / RU in v0.1; ES-AR deferred to v0.2
- **Advanced sections in prototype:** Notifications, security, sessions, and delete account are future-state design only
- **Save:** Glass primary button

## Interactivity
- Click [Change] avatar → file picker (JPEG/PNG)
- Click [Remove] avatar → revert to default
- Change language → instant UI update (no page reload)
- Click [Save Changes] → persist to backend
- Click [Log Out] → clear session, redirect to landing

## Name validation (spec 053)

Personal name fields accept short Unicode names, including `Ян`, with trim + 1–40-character bounds and an 80-character joined display-name limit. Empty/whitespace values show the existing localized field errors. The independent 3–30-character username rule remains; its message names the username explicitly.
