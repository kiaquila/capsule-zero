#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const baseServices = [
  "db",
  "auth",
  "rest",
  "storage",
  "realtime",
  "functions",
  "kong",
  "imgproxy",
  "meta",
  "studio",
  "supavisor",
];

function run(args) {
  const result = spawnSync("docker", ["compose", ...args], {
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function main() {
  run(["up", "-d", "--build", "--wait", ...baseServices]);
  run(["up", "--force-recreate", "--no-deps", "migrate"]);
  run(["up", "-d", "--build", "--wait", "web"]);
}

main();
