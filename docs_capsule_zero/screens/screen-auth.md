# Screen: Authentication (Register / Login)

URL: /auth (standalone) or popup on landing
Feature: features/f-002-auth.md
Prototype: `html-prototypes/auth.html`; popup host: live `LandingPage` + reusable `AuthPanel`
(spec 044). `html-prototypes/index.html` is historical.

## Desktop Layout — Registration

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│          ┌─────────────────────────────────┐             │
│          │         Glass Panel             │             │
│          │                                 │             │
│          │   Create Account            ×   │             │
│          │                                 │             │
│          │   [ G  Continue with Google ]   │             │
│          │   ─────────── or ───────────    │             │
│          │   ┌─────────────────────────┐   │             │
│          │   │ Email                   │   │             │
│          │   └─────────────────────────┘   │             │
│          │   ┌─────────────────────────┐   │             │
│          │   │ Password                │   │             │
│          │   └─────────────────────────┘   │             │
│          │   ┌─────────────────────────┐   │             │
│          │   │ Confirm password        │   │             │
│          │   └─────────────────────────┘   │             │
│          │                                 │             │
│          │   [       Register          ]   │             │
│          │                                 │             │
│          │   Already have account? Login   │             │
│          └─────────────────────────────────┘             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

Sign-up asks for credentials only (spec 048): name, country, and city moved to
the profile screen (see `.specify/specs/020-stage-1-profile/`), where they were
already editable. The panel header titles the active mode ("Log In" /
"Create Account" / recovery); mode switching lives in the link under the form.

## Elements

> Token values: `project/frontend/styling.md`

- **Glass Panel:** Main glass panel variant, centered
- **Inputs:** Glass input style
- **Register Button:** Primary glass button
- **Validation:** Inline, real-time, signal red (#FF5449, Q4 2026-07-16) for errors — text on scrim chips uses #FF7A70
- **Google Button:** active since spec 037 when the deployment enables the provider — social glass surface, monochrome G glyph; since spec 048 it leads the form (above the email fields, followed by an "or" divider) so the primary path stays above the mobile fold; hidden otherwise
- **Apple Icon:** Stage 2 only; always black when implemented

## Interactivity

- Type in fields → real-time inline validation
- Click [Register] → submit, disable button, show loading
- Click "Login" → switch to login form (same panel)
- Click "Forgot password" (login mode) → email recovery input
- Success → redirect to Dashboard
- Error → inline messages (no alert popups)
- Click [Continue with Google] → consent screen → dashboard; failure returns to /auth with a localized inline error (spec 037). Apple stays Stage 2

## Responsive

- Mobile: Glass panel full-width with padding
- Tablet/Desktop: Glass panel centered, max-width ~400px
- Panel max-height: `calc(100svh - 112px - env(safe-area-inset-bottom))` with
  internal scroll (spec 048) — the reserve covers the fixed header and in-app
  browser chrome (Telegram/Instagram float a bar over the page bottom)
- Overflow affordance: when content continues below the fold the panel bottom
  fades out (mask); the scrollbar stays hidden
- While the landing popup is open the page body scroll is locked and the panel
  uses `overscroll-behavior: contain`, so touch scrolling stays inside the form
