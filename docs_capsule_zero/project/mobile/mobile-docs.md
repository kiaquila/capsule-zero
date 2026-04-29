# Mobile Docs

## Status

Accepted for MVP planning.

## Product Requirement

Capsule Zero MVP includes native mobile apps for iOS and Android built with Flutter. The product remains mobile-first across web and native clients.

## Stack

| Layer | Decision |
|---|---|
| Framework | Flutter |
| Language | Dart |
| Routing | `go_router` |
| State management | Riverpod |
| Backend client | `supabase_flutter` |
| Secure storage | Platform secure storage for auth/session material |
| Image input | Native camera/gallery picker, upload through Supabase Storage policies |
| Payments | Read-only coin balance in v0.1; purchases happen on web through Lava.top and webhooks |

## Architecture

The Flutter app shares the same backend as web:

- Supabase Auth for identity
- Supabase PostgreSQL with RLS for user data
- Supabase Storage for photos and processed assets
- Supabase RPC functions for domain-heavy operations
- REST Route Handlers/Edge Functions for trusted vendor integrations
- Lava.top webhook fulfillment into the Postgres coin ledger for web purchases

Do not create a mobile-specific backend. Any mobile-only endpoint must be justified by platform constraints and documented in `docs_capsule_zero/adr/api-spec.md`.

## Mobile-First Rules

- Optimize the Journey, upload, catalog search, and item editing flows for one-handed phone use first.
- Camera/gallery upload is a first-class mobile workflow.
- All screens must be usable on small phones before tablet layouts are enhanced.
- Web prototypes remain visual source of truth, but Flutter may use native navigation and controls where this improves mobile ergonomics without violating the glass/achromatic language.
- Shared domain rules must live in backend functions or generated shared specs, not duplicated ad hoc in Flutter.

## Auth And Deep Links

- Configure Supabase OAuth redirect URLs for both web and mobile.
- Use universal links/app links where possible; custom scheme is acceptable for early MVP testing.
- Deep links are required for OAuth callbacks. Payment-return deep links are deferred because mobile v0.1 has no purchase CTA.
- Test cold-start and warm-start deep links on iOS and Android.

## Payments

Lava.top is the accepted payment provider, but mobile v0.1 does not expose purchase entrypoints.

Coins are digital value used inside the app. For the MVP release:

- web creates Lava.top invoices/payment links;
- backend webhooks credit the Postgres `coin_ledger`;
- mobile shows balance and transaction status after sync;
- mobile has no Lava.top purchase CTA, external payment link, or in-app purchase prompt.

Allowed external purchase links or store-specific payment fallbacks can be revisited after legal/store-policy approval.

## QA

Mobile QA must cover:

- iPhone small/standard screens
- Android small/standard screens
- OAuth callback
- app cold-start deep link
- app foreground deep link
- photo upload from camera
- photo upload from gallery
- background removal status and retry
- coin balance refresh after a web purchase webhook
- offline/poor-network error states

## References

- Supabase Flutter: https://supabase.com/docs/reference/dart/introduction
- Flutter deep linking: https://docs.flutter.dev/ui/navigation/deep-linking
- Lava.top developer API: https://developers.lava.top/en
- Apple external purchase APIs: https://developer.apple.com/documentation/storekit/external-purchase
- Google Play external offers: https://developer.android.com/google/play/billing/external/integration
