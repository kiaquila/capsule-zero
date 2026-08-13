#!/usr/bin/env bash

set -euo pipefail

repository_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
project_name="capsule-zero-kratos-check-$$"
compose=(
  docker compose
  --project-name "$project_name"
  --env-file "$repository_root/deploy/compose.env.example"
  -f "$repository_root/docker-compose.yml"
  -f "$repository_root/docker-compose.dev.yml"
)

cleanup() {
  status=$?
  trap - EXIT
  if ((status != 0)); then
    "${compose[@]}" logs --no-color postgres kratos-migrate kratos mailhog || true
  fi
  "${compose[@]}" down --volumes --remove-orphans >/dev/null 2>&1 || true
  exit "$status"
}
trap cleanup EXIT

"${compose[@]}" pull postgres kratos-migrate kratos mailhog
"${compose[@]}" up -d --wait postgres mailhog kratos

# A second run against the populated schema proves the production one-shot
# migration remains idempotent after the version jump.
"${compose[@]}" run --rm kratos-migrate

public_url=http://127.0.0.1:4433
email="kratos-smoke-$$@example.com"
password='KratosSmoke-26-2-pass'

registration_flow=$(
  curl --fail-with-body --silent --show-error \
    "$public_url/self-service/registration/api" | jq -er '.id'
)
registration_response=$(
  jq -nc \
    --arg email "$email" \
    --arg password "$password" \
    '{method:"password", password:$password, traits:{email:$email, name:{first:"Kratos Smoke"}, locale:"en"}}' | \
    curl --fail-with-body --silent --show-error \
      -H 'Content-Type: application/json' \
      --data-binary @- \
      "$public_url/self-service/registration?flow=$registration_flow"
)
registration_token=$(jq -er '.session_token' <<<"$registration_response")
test "$email" = "$(
  curl --fail-with-body --silent --show-error \
    -H "X-Session-Token: $registration_token" \
    "$public_url/sessions/whoami" | jq -er '.identity.traits.email'
)"

login_flow=$(
  curl --fail-with-body --silent --show-error \
    "$public_url/self-service/login/api" | jq -er '.id'
)
login_response=$(
  jq -nc \
    --arg email "$email" \
    --arg password "$password" \
    '{method:"password", identifier:$email, password:$password}' | \
    curl --fail-with-body --silent --show-error \
      -H 'Content-Type: application/json' \
      --data-binary @- \
      "$public_url/self-service/login?flow=$login_flow"
)
login_token=$(jq -er '.session_token' <<<"$login_response")
test "$email" = "$(
  curl --fail-with-body --silent --show-error \
    -H "X-Session-Token: $login_token" \
    "$public_url/sessions/whoami" | jq -er '.identity.traits.email'
)"

kratos_image=$("${compose[@]}" config --images | awk '/^oryd\/kratos:/{ print; exit }')
printf 'kratos-image=%s migration=repeatable registration=ok login=ok whoami=ok\n' "$kratos_image"
