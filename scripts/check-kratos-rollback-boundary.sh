#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "usage: check-kratos-rollback-boundary.sh <current-ref> <target-ref>" >&2
}

kratos_image_at_ref() {
  local ref="$1"

  git show "${ref}:docker-compose.yml" | awk '
    /^  kratos-migrate:$/ { in_kratos_migrate = 1; next }
    in_kratos_migrate && /^    image: / {
      sub(/^    image: /, "")
      print
      exit
    }
    in_kratos_migrate && /^  [[:alnum:]_-]+:$/ { exit }
  '
}

if [ "$#" -ne 2 ]; then
  usage
  exit 64
fi

current_ref="$1"
target_ref="$2"
current_image="$(kratos_image_at_ref "$current_ref")"
target_image="$(kratos_image_at_ref "$target_ref")"
image_pattern='^oryd/kratos:v[0-9]+\.[0-9]+\.[0-9]+$'

[[ "$current_image" =~ $image_pattern ]] \
  || { echo "rollback boundary: cannot resolve a pinned Kratos image at $current_ref" >&2; exit 1; }
[[ "$target_image" =~ $image_pattern ]] \
  || { echo "rollback boundary: cannot resolve a pinned Kratos image at $target_ref" >&2; exit 1; }

if [ "$current_image" != "$target_image" ]; then
  cat >&2 <<EOF
rollback boundary: cross-Kratos-runtime rollback blocked
current: $current_ref ($current_image)
target:  $target_ref ($target_image)
Use a forward fix. A cross-runtime rollback requires an operator-approved maintenance
procedure that restores a database snapshot created for the target runtime; do not bypass
this guard against the live upgraded schema.
EOF
  exit 1
fi

echo "rollback boundary ok: $current_image at $current_ref and $target_ref"
