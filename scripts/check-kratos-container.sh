#!/usr/bin/env bash

set -euo pipefail

repository_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
validation_dir=$(mktemp -d /tmp/capsule-zero-kratos-check.XXXXXX)
project_name="capsule-zero-kratos-check-$$"
old_container="capsule-zero-kratos-old-$$"
old_image=oryd/kratos:v1.3.1
dsn='postgres://kratos:placeholder-kratos-db-password@postgres:5432/kratos?sslmode=disable'
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
    docker logs "$old_container" 2>/dev/null || true
    "${compose[@]}" logs --no-color postgres kratos-migrate kratos api mailhog || true
  fi
  docker rm -f "$old_container" >/dev/null 2>&1 || true
  "${compose[@]}" down --volumes --remove-orphans >/dev/null 2>&1 || true
  find "$validation_dir" -depth -delete
  exit "$status"
}
trap cleanup EXIT

wait_for_ready() {
  local url=$1
  for _ in {1..30}; do
    if curl --fail --silent --output /dev/null "$url/health/ready"; then
      return 0
    fi
    sleep 1
  done
  return 1
}

post_json() {
  local url=$1
  local payload response_file status
  payload=$(cat)
  response_file="$validation_dir/response-$RANDOM.json"
  status=$(curl --silent --show-error \
    --output "$response_file" \
    --write-out '%{http_code}' \
    -H 'Content-Type: application/json' \
    --data-binary "$payload" \
    "$url")
  if [[ ! "$status" =~ ^2[0-9][0-9]$ ]]; then
    printf 'POST %s returned HTTP %s: ' "$url" "$status" >&2
    cat "$response_file" >&2
    printf '\n' >&2
    return 1
  fi
  cat "$response_file"
}

register_identity() {
  local public_url=$1
  local email=$2
  local password=$3
  local flow response token
  flow=$(curl --fail-with-body --silent --show-error \
    "$public_url/self-service/registration/api" | jq -er '.id')
  response=$(
    jq -nc \
      --arg email "$email" \
      --arg password "$password" \
      '{method:"password", password:$password, traits:{email:$email, name:{first:"Kratos Smoke"}, locale:"en"}}' | \
      post_json "$public_url/self-service/registration?flow=$flow"
  )
  token=$(jq -er '.session_token' <<<"$response")
  test "$email" = "$(
    curl --fail-with-body --silent --show-error \
      -H "X-Session-Token: $token" \
      "$public_url/sessions/whoami" | jq -er '.identity.traits.email'
  )"
}

login_identity() {
  local public_url=$1
  local email=$2
  local password=$3
  local flow response token
  flow=$(curl --fail-with-body --silent --show-error \
    "$public_url/self-service/login/api" | jq -er '.id')
  response=$(
    jq -nc \
      --arg email "$email" \
      --arg password "$password" \
      '{method:"password", identifier:$email, password:$password}' | \
      post_json "$public_url/self-service/login?flow=$flow"
  )
  token=$(jq -er '.session_token' <<<"$response")
  test "$email" = "$(
    curl --fail-with-body --silent --show-error \
      -H "X-Session-Token: $token" \
      "$public_url/sessions/whoami" | jq -er '.identity.traits.email'
  )"
}

"${compose[@]}" pull postgres kratos-migrate kratos mailhog
docker pull "$old_image"
"${compose[@]}" up -d --wait postgres mailhog

network_name=$(docker network ls \
  --filter "label=com.docker.compose.project=$project_name" \
  --format '{{.Name}}' | awk '/_internal$/{ print; exit }')
test -n "$network_name"

# Reproduce the deployed starting point: v1.3.1 owns the database schema and
# creates a real identity before the new migrator touches the persistent data.
cp -R "$repository_root/infra/kratos" "$validation_dir/kratos"
sed -i.bak 's/^version: .*/version: v1.3.1/' "$validation_dir/kratos/kratos.yml"
rm "$validation_dir/kratos/kratos.yml.bak"
docker run --rm --network "$network_name" -e DSN="$dsn" \
  "$old_image" migrate sql -e --yes
docker run -d --name "$old_container" \
  --network "$network_name" \
  -p 127.0.0.1::4433 \
  -e DSN="$dsn" \
  -v "$validation_dir/kratos:/etc/config/kratos:ro" \
  "$old_image" serve --config /etc/config/kratos/kratos.yml --dev --watch-courier \
  >/dev/null
old_port=$(docker port "$old_container" 4433/tcp | sed -E 's/.*:([0-9]+)$/\1/')
old_public_url="http://127.0.0.1:$old_port"
wait_for_ready "$old_public_url"

email="kratos-smoke-$$@example.com"
old_password='SuperSecret123'
new_password='NewSecret456'
register_identity "$old_public_url" "$email" "$old_password"
docker rm -f "$old_container" >/dev/null

# Upgrade the populated v1.3.1 schema with the image under review, rerun its
# migration for idempotence, then prove the old identity still authenticates.
"${compose[@]}" up -d --wait kratos
"${compose[@]}" run --rm kratos-migrate
public_url=http://127.0.0.1:4433
login_identity "$public_url" "$email" "$old_password"

# Drive the version-sensitive recovery-code/session-token/settings path through
# the real Go adapter. This is the path guarded by use_continue_with_transitions.
"${compose[@]}" up -d --build --wait api
api_url=http://127.0.0.1:8080
recovery_response=$(
  jq -nc --arg email "$email" '{email:$email}' | \
    post_json "$api_url/api/auth/recovery"
)
recovery_flow=$(jq -er '.flowId' <<<"$recovery_response")

recovery_code=''
for _ in {1..30}; do
  recovery_code=$(
    curl --fail-with-body --silent --show-error \
      --get --data-urlencode 'kind=to' --data-urlencode "query=$email" \
      'http://127.0.0.1:8025/api/v2/search' | \
      jq -r '[.items[] | select(((.Content.Headers.Subject // []) | join(" ")) | test("recover"; "i")) | .Content.Body | capture("recovery code: [^0-9]*(?<code>[0-9]{6})"; "i").code][0] // empty'
  )
  if [[ -n "$recovery_code" ]]; then
    break
  fi
  sleep 1
done
test -n "$recovery_code"

recovery_complete=$(
  jq -nc \
    --arg flow "$recovery_flow" \
    --arg code "$recovery_code" \
    --arg password "$new_password" \
    '{flowId:$flow, code:$code, newPassword:$password}' | \
    post_json "$api_url/api/auth/recovery/complete"
)
test "$email" = "$(jq -er '.user.email' <<<"$recovery_complete")"
test -n "$(jq -er '.session.token' <<<"$recovery_complete")"

api_login=$(
  jq -nc --arg email "$email" --arg password "$new_password" \
    '{email:$email, password:$password}' | \
    post_json "$api_url/api/auth/login"
)
test "$email" = "$(jq -er '.user.email' <<<"$api_login")"

kratos_image=$("${compose[@]}" config --images | awk '/^oryd\/kratos:/{ print; exit }')
printf 'kratos-upgrade=%s->%s migrated-identity=ok repeat-migration=ok recovery=ok login=ok whoami=ok\n' \
  "$old_image" "$kratos_image"
