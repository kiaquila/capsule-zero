// Google OIDC claim mapper (spec 037). Referenced by the google provider's
// mapper_url in SELFSERVICE_METHODS_OIDC_CONFIG_PROVIDERS (mounted at
// file:///etc/config/kratos/oidc.google.jsonnet).
//
// Only a Google-verified email may become the identity's identifier —
// an unverified claim would let an attacker register a Google account with
// someone else's address and shadow their future sign-ups. The locale trait
// is deliberately not mapped: Google reports BCP-47 values (en-US) outside
// the schema's en|ru enum; the app assigns locale on first profile touch.
local claims = std.extVar('claims');

assert 'email' in claims && claims.email_verified : 'a verified email claim is required';

{
  identity: {
    traits: {
      email: claims.email,
      [if 'given_name' in claims && claims.given_name != '' then 'name']: {
        first: claims.given_name,
      },
    },
  },
}
