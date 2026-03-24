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
│          │   ── or continue with ──        │             │
│          │                                 │             │
│          │   [ G  Google ]  [  Apple  ]    │             │
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
- **OAuth Buttons:** Social glass button
- **Apple Icon:** Always black
- **Validation:** Inline, real-time, yellow (#FFD600) for errors

## Interactivity
- Type in fields → real-time inline validation
- Click [Register] → submit, disable button, show loading
- Click [Google] / [Apple] → OAuth flow
- Click "Login" → switch to login form (same panel)
- Click "Forgot password" (login mode) → email recovery input
- Success → redirect to Dashboard
- Error → inline messages (no alert popups)

## Responsive
- Mobile: Glass panel full-width with padding
- Tablet/Desktop: Glass panel centered, max-width ~400px
