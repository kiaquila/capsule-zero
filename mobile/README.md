# Capsule Zero Mobile

React Native is the accepted mobile target for iOS and Android in the
production-stack pivot. The app consumes the same Go API contract as web through
the generated TypeScript client and intentionally keeps v0.1 mobile payments
read-only: mobile may display coin balance and web-originated payment status,
but must not show Lava.top purchase CTAs or external payment links.

The tracked Flutter scaffold is legacy and is scheduled for removal after
`.specify/specs/024-production-stack-runtime/` ships. Until that cleanup lands,
the OpenAPI generator keeps a Dart metadata mirror for the old scaffold, but the
canonical mobile contract is TypeScript.

## Target Local Boot

```bash
cd mobile
npm install
npx expo start
```

These are the target commands once the React Native scaffold lands in spec 024.
The tracked `mobile/.env.example` mirrors the React Native runtime values for
local operators. Copy it to `mobile/.env.local` and keep real values out of git.

Generated API types live in `lib/api/generated/openapi.ts` and are updated from
`docs_capsule_zero/adr/openapi.yaml` by running `npm run generate:api` at the
repository root.
