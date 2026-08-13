#!/usr/bin/env bash

set -euo pipefail

repository_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
validation_dir=$(mktemp -d /tmp/capsule-zero-nginx-check.XXXXXX)
container_name="capsule-zero-nginx-check-$$"

cleanup() {
  docker rm -f "$container_name" >/dev/null 2>&1 || true
  find "$validation_dir" -depth -delete
}
trap cleanup EXIT

nginx_image=$(
  docker compose \
    --env-file "$repository_root/deploy/compose.env.example" \
    --profile docker-edge \
    -f "$repository_root/docker-compose.yml" \
    config --images | awk '/^nginx:/{ print; exit }'
)
test -n "$nginx_image"

mkdir -p \
  "$validation_dir/letsencrypt/live/capsulezero.app" \
  "$validation_dir/certbot"
openssl req -x509 -newkey rsa:2048 -nodes -days 1 \
  -subj "/CN=capsulezero.app" \
  -keyout "$validation_dir/letsencrypt/live/capsulezero.app/privkey.pem" \
  -out "$validation_dir/letsencrypt/live/capsulezero.app/fullchain.pem" \
  >/dev/null 2>&1

mounts=(
  -v "$repository_root/infra/nginx/nginx.conf:/etc/nginx/nginx.conf:ro"
  -v "$repository_root/infra/nginx/conf.d:/etc/nginx/conf.d:ro"
  -v "$validation_dir/letsencrypt:/etc/letsencrypt:ro"
  -v "$validation_dir/certbot:/var/www/certbot:ro"
)

docker pull "$nginx_image"
docker run --rm "${mounts[@]}" "$nginx_image" nginx -t
docker run -d --name "$container_name" -p 127.0.0.1::80 \
  "${mounts[@]}" "$nginx_image" >/dev/null

host_port=$(docker port "$container_name" 80/tcp | sed -E 's/.*:([0-9]+)$/\1/')
response=""
for _ in 1 2 3 4 5; do
  if response=$(curl -fsS "http://127.0.0.1:${host_port}/nginx-health"); then
    break
  fi
  sleep 1
done

test "$response" = "ok"
printf 'nginx-image=%s health-response=%s\n' "$nginx_image" "$response"
