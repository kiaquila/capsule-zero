#!/usr/bin/env bash
set -euo pipefail

# Only ephemeral GitHub runners may change their Docker storage backend.
# Production and developer Docker daemons must never be restarted by this helper.
if [ "${GITHUB_ACTIONS:-}" != "true" ] || [ "${RUNNER_OS:-}" != "Linux" ]; then
  echo "setup-ci-docker-builder: requires a Linux GitHub Actions runner" >&2
  exit 1
fi

if ! docker info --format '{{json .DriverStatus}}' \
  | jq -e 'any(.[]; . == ["driver-type", "io.containerd.snapshotter.v1"])' >/dev/null; then
  # The embedded docker driver can export registry caches with containerd.
  # It needs no separate moby/buildkit image or Docker Hub bootstrap pull.
  config_file=$(mktemp)
  trap 'rm -f "$config_file"' EXIT
  if sudo test -f /etc/docker/daemon.json; then
    sudo cat /etc/docker/daemon.json | tee "$config_file" >/dev/null
  else
    printf '{}\n' > "$config_file"
  fi
  jq '.features = ((.features // {}) + {"containerd-snapshotter": true})' \
    "$config_file" | sudo tee /etc/docker/daemon.json >/dev/null
  sudo systemctl restart docker
fi

docker info --format '{{json .DriverStatus}}' \
  | jq -e 'any(.[]; . == ["driver-type", "io.containerd.snapshotter.v1"])' >/dev/null
docker buildx use default
docker buildx inspect default

# ECR Public rate-limits official base images on shared runner IPs.
# Warm unchanged FROM refs from Google's cache of the identical OCI indexes.
# Refresh pins with version bumps; failure must stop before tagging that image.
repository_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
warm_image() {
  local image="$1" target="$2" expected="$3" actual
  shift 3
  docker pull --platform linux/amd64 "$image"
  actual=$(docker run --rm --platform linux/amd64 "$image" "$@")
  if [ "$actual" != "$expected" ]; then
    echo "setup-ci-docker-builder: update pinned mirror for $target (expected $expected, got $actual)" >&2
    exit 1
  fi
  docker tag "$image" "$target"
}
go_version=$(sed -n 's/^go //p' "$repository_root/api/go.mod")
warm_image \
  'mirror.gcr.io/library/golang@sha256:116d58cbd88c1297624acc6e967a060012422bacf9930927e23fb719189c6f36' \
  "public.ecr.aws/docker/library/golang:${go_version}-bookworm" "go$go_version" \
  go env GOVERSION
# Bind the digest to its full source tag, including distribution and variant.
# A same-major Dockerfile change must refresh this mapping rather than alias Debian
# as Alpine (or a different Debian variant).
node_pinned_tag='22-bookworm-slim'
node_version=$(sed -n 's/^ARG NODE_VERSION=//p' "$repository_root/app/Dockerfile")
if [ "$node_version" != "$node_pinned_tag" ]; then
  echo "setup-ci-docker-builder: update pinned Node tag/digest for $node_version" >&2
  exit 1
fi
warm_image \
  'mirror.gcr.io/library/node@sha256:c3de60bf2f9dd0ac6370e6117950ff62d6e339527e7472301c9c78a017978392' \
  "public.ecr.aws/docker/library/node:$node_version" "${node_version%%-*}" \
  node --eval 'process.stdout.write(process.versions.node.split(".")[0])'
