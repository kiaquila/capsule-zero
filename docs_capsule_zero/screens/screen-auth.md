# Screen: Authentication (Register / Login)

URL: /auth (standalone) or popup on landing
Feature: features/f-002-auth.md
Prototype: `html-prototypes/auth.html`, `html-prototypes/index.html` (popup)

## Desktop Layout — Registration

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│          ┌─────────────────────────────────┐             │
│          │         Glass Panel             │             │
│          │                                 │             │
│          │   Create Account                │             │
│          │                                 │             │
│          │   ┌─────────────────────────┐   │             │
│          │   │ Full name               │   │             │
│          │   └─────────────────────────┘   │             │
│          │   ┌─────────────────────────┐   │             │
│          │   │ Email                   │   │             │
│          │   └─────────────────────────┘   │             │
│          │   ┌─────────────────────────┐   │             │
│          │   │ Password                │   │             │
│          │   └─────────────────────────┘   │             │
│          │   ┌─────────────────────────┐   │             │
│          │   │ Country / City (opt.)   │   │             │
│          │   └─────────────────────────┘   │             │
│          │                                 │             │
│          │   [        Register         ]   │             │
│          │                                 │             │
│          │   Already have account? Login   │             │
│          └─────────────────────────────────┘             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Elements

> Token values: `project/frontend/styling.md`

- **Glass Panel:** Main glass panel variant, centered
- **Inputs:** Glass input style
- **Register Button:** Primary glass button
- **Validation:** Inline, real-time, signal red (#FF5449, Q4 2026-07-16) for errors — text on scrim chips uses #FF7A70
- **Google Button:** active since spec 037 when the deployment enables the provider — social glass surface, monochrome G glyph, below the primary CTA behind an "or" divider; hidden otherwise
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
