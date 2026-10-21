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
- **Advanced sections in prototype:** Notifications, additional security settings and delete account remain future-state design; password change and active session inventory and revocation are implemented.
- **Save:** Glass primary button

## Interactivity

- Click [Change] avatar → file picker (JPEG/PNG)
- Click [Remove] avatar → revert to default
- Change language → instant UI update (no page reload)
- Click [Save Changes] → persist to backend
- Click [Log Out] → clear session, redirect to landing

## Name validation (spec 053)

Personal name fields accept short Unicode names, including `Ян`, with trim + 1–40-character bounds and an 80-character joined display-name limit. Empty/whitespace values show the existing localized field errors. The independent 3–30-character username rule remains; its message names the username explicitly.

## Empty fields and session availability (spec 056)

Unset optional personal fields render empty; saving another field does not populate them. Clearing an optional field stays cleared after save/reload. Preserve all existing saved values regardless of equality to old sample defaults.

## Active sessions (spec 057)

The account card uses existing glass rows for actual Kratos sessions. Current appears first with a localized badge based on its exact ID. Each row shows authentication time when available and expiry, formatted in EN/RU and labelled UTC; neither date represents last activity. No device/location guess or sample row. Spec 058 adds existing glass-button controls to end each other session and all others; the current row keeps its badge without a revoke control. Pending disables every revoke button. Failure retains rows and displays localized feedback; success removes confirmed targets. Controls use type=button inside the existing profile form and never save unrelated edits. No active records shows the empty message; failed inventory or unsupported providers shows the unavailable message, without breaking profile editing.
