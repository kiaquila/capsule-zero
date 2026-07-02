# Mobile Docs

## Status

Accepted for v0.1 planning (rewritten 2026-06-27 — replaces the previous Flutter decision with React Native).

## Product Requirement

Capsule Zero v0.1 ships native mobile apps for iOS and Android built with React Native. The product remains mobile-first across web and native clients. A throwaway Flutter shell was scaffolded during Sprint 0 (before the 2026-06-27 React Native pivot) and has since been removed as stale; the React Native scaffold is delivered in a later spec.

## Stack

| Layer            | Decision                                                                                              |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| Framework        | React Native (with the New Architecture: Fabric + TurboModules)                                       |
| Language         | TypeScript                                                                                            |
| Toolchain        | Expo (managed config + EAS Build for iOS/Android signing) unless a feature requires the bare workflow |
| Routing          | Expo Router (file-based)                                                                              |
| State management | Zustand for local UI state, TanStack Query for server-state                                           |
| Forms            | React Hook Form + Zod (same as web)                                                                   |
| Backend client   | Generated TypeScript client from `docs_capsule_zero/adr/openapi.yaml` over HTTPS to the Go API        |
| Auth             | Ory Kratos self-service flows rendered in the app; session cookie/JWT exchanged with the Go API       |
| Secure storage   | `expo-secure-store` for session material                                                              |
| Image input      | `expo-image-picker` for camera/gallery; uploads through signed PUT URLs to DigitalOcean Spaces        |
| Payments         | Read-only coin balance in v0.1; purchases happen on web through Lava.top (v0.2 integration)           |
| i18n             | `expo-localization` + `react-intl` (or `i18next`) for EN + RU; ES-AR deferred to v0.2                 |
| Deep links       | `expo-linking` + universal links / app links                                                          |

The React Native app shares the same Go API contract as the web. It never talks to Kratos or Spaces directly through a back channel — auth flows go through the Go API via nginx `auth_request` into Kratos, and uploads go through signed URLs issued by the API.

## Architecture

The mobile app uses the same backend as web:

- Ory Kratos for identity (rendered by the app, validated by the API)
- PostgreSQL via the Go monolith for user data
- DigitalOcean Spaces for photos and processed assets, via signed URLs from the Go API
- Redis-backed background jobs (image processing in Stage 2, embedding generation, marketplace parse)
- Lava.top webhook fulfillment into the Postgres coin ledger for web purchases (Stage 2)

Do not create a mobile-specific backend. Any mobile-only endpoint must be justified by platform constraints and documented in `docs_capsule_zero/adr/api-spec.md`.

## Repository Layout (target)

```
/mobile
  app/                 ← Expo Router routes
    (auth)/            ← sign in, sign up, recovery
    (app)/             ← tabbed sections: dashboard, journey, my-items, …
  components/          ← shared UI (glass surfaces, color dots, item card)
  features/            ← bounded contexts mirroring the API (wardrobe, capsule, …)
  lib/
    api/generated/     ← generated TypeScript client from openapi.yaml
    auth/              ← Kratos flow wrappers
    storage/           ← signed-URL upload helper
    theme/             ← glass tokens mapped from web tokens
  app.config.ts        ← Expo config, env, deep-link scheme
```

## Mobile-First Rules

- Optimize Journey, upload, catalog search, and item editing flows for one-handed phone use first.
- Camera/gallery upload is a first-class mobile workflow.
- All screens must be usable on small phones before tablet layouts are enhanced.
- Web prototypes remain visual source of truth, but React Native may use native navigation idioms (gestures, transitions) where this improves mobile ergonomics without violating the glass/achromatic language.
- Shared domain rules must live in the Go API or generated OpenAPI types, not duplicated ad-hoc in the React Native app.
- Tokens (`docs_capsule_zero/project/frontend/styling.md`) map into a React Native theme module; glass surfaces use `expo-blur` + translucent backgrounds.

## Auth And Deep Links

- v0.1 uses email/password auth and session persistence (Kratos).
- Configure Kratos OAuth redirect URLs for both web and mobile in Stage 2.
- Use universal links (iOS Associated Domains) and Android App Links where possible; custom scheme `capsulezero://` is acceptable for early testing.
- Deep links are required for Stage 2 OAuth callbacks. Payment-return deep links are deferred because mobile v0.1 has no purchase CTA.
- Test cold-start and warm-start deep links on iOS and Android before Stage 2 social auth QA.

## Payments

Lava.top is the canonical payment provider, but mobile v0.1 does not expose purchase entrypoints.

Coins are digital value used inside the app. For v0.1:

- web creates Lava.top invoices/payment links (integration in v0.2);
- backend webhooks credit the Postgres `coin_ledger`;
- mobile shows balance and transaction status after sync;
- mobile has no Lava.top purchase CTA, external payment link, or in-app purchase prompt.

Allowed external purchase links or store-specific payment fallbacks can be revisited after legal/store-policy approval.

## QA

Mobile QA must cover:

- iPhone small/standard screens
- Android small/standard screens
- email/password auth and session persistence
- Stage 2 OAuth callback
- Stage 2 app cold-start deep link
- Stage 2 app foreground deep link
- photo upload from camera
- photo upload from gallery
- background removal status and retry (Stage 2)
- coin balance refresh after a web purchase webhook (Stage 2)
- offline/poor-network error states

## References

- React Native: https://reactnative.dev/
- Expo Router: https://docs.expo.dev/router/introduction/
- EAS Build (iOS/Android signing): https://docs.expo.dev/eas/
- Expo SecureStore: https://docs.expo.dev/versions/latest/sdk/securestore/
- Expo ImagePicker: https://docs.expo.dev/versions/latest/sdk/imagepicker/
- Expo Linking (deep links): https://docs.expo.dev/guides/linking/
- Ory Kratos self-service flows: https://www.ory.sh/docs/kratos/self-service
- iOS Associated Domains: https://developer.apple.com/documentation/xcode/supporting-associated-domains
- Android App Links: https://developer.android.com/training/app-links
