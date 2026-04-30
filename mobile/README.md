# Capsule Zero Mobile

Sprint 0 Flutter shell for iOS and Android. The app uses the same Supabase
backend contract as web and intentionally keeps v0.1 mobile payments read-only:
mobile may display coin balance and web-originated payment status, but must not
show Lava.top purchase CTAs or external payment links.

## Local Boot

```bash
cd mobile
flutter pub get
flutter run \
  --dart-define=SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --dart-define=SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  --dart-define=MOBILE_DEEP_LINK_SCHEME=capsulezero
```

The tracked `mobile/.env.example` mirrors these values for local operators. Copy
it to `mobile/.env.local`, keep real values out of git, and pass them through
`--dart-define` or the IDE run configuration.

Generated API metadata lives in `lib/api/generated/openapi.dart` and is updated
from `docs_capsule_zero/adr/openapi.yaml` by running `npm run generate:api` at
the repository root.
