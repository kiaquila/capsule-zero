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

# ECR Public repeatedly rate-limits the Go manifest on shared runner IPs.
# Warm the unchanged ECR FROM ref from Google's cache of the identical OCI index.
# This digest is also the one in the ECR 429 response (spec 055 evidence).
# No Docker Hub fallback, new credentials, or production daemon changes.
repository_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
go_version=$(sed -n 's/^go //p' "$repository_root/api/go.mod")
go_mirror='mirror.gcr.io/library/golang@sha256:116d58cbd88c1297624acc6e967a060012422bacf9930927e23fb719189c6f36'
docker pull --platform linux/amd64 "$go_mirror"
actual_version=$(docker run --rm --platform linux/amd64 "$go_mirror" go env GOVERSION)
if [ "$actual_version" != "go$go_version" ]; then
  echo "setup-ci-docker-builder: update the pinned mirror digest for Go $go_version (got $actual_version)" >&2
  exit 1
fi
docker tag "$go_mirror" "public.ecr.aws/docker/library/golang:${go_version}-bookworm"
