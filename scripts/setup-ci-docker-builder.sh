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
