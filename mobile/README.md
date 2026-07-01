# Mobile (React Native)

Capsule Zero's native iOS + Android app is **React Native**, sharing the same Go API contract as the web frontend through nginx. Architecture and constraints: `docs_capsule_zero/project/mobile/mobile-docs.md`.

Mobile payments stay read-only in v0.1: the app may display coin balance and web-originated payment status, but must not show Lava.top purchase CTAs or external payment links.

> **Status:** placeholder. The React Native scaffold is delivered in a later spec; generated API types will be regenerated into this directory by `npm run generate:api` once that scaffold defines its path.
>
> An earlier **Flutter** Sprint-0 shell (`pubspec.yaml`, Dart sources, generated Dart client, `.env.example`) lived here and was **removed on 2026-07-01** as stale — Flutter was dropped in favour of React Native in the 2026-06-27 production-stack pivot, but the shell was never cleaned up. Do not re-introduce Flutter, Dart, or `supabase_flutter` here.
