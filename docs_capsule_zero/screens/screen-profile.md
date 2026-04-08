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
- **Language dropdown:** EN / ES-AR / RU
- **Advanced sections in prototype:** Notifications, security, sessions, and delete account are future-state design only
- **Save:** Glass primary button

## Interactivity
- Click [Change] avatar → file picker (JPEG, PNG, WebP)
- Click [Remove] avatar → revert to default
- Change language → instant UI update (no page reload)
- Click [Save Changes] → persist to backend
- Click [Log Out] → clear session, redirect to landing
