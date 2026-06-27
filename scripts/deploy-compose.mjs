#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const legacyComposeFile = "docker-compose.legacy-supabase.yml";

const legacyBaseServices = [
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
  const result = spawnSync(
    "docker",
    ["compose", "-f", legacyComposeFile, ...args],
    {
      stdio: "inherit",
    },
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function main() {
  console.warn(
    `deploy:compose targets the legacy Supabase runtime via ${legacyComposeFile}.`,
  );
  run(["up", "-d", "--build", "--wait", ...legacyBaseServices]);
  run(["up", "--force-recreate", "--no-deps", "migrate"]);
  run(["up", "-d", "--build", "--wait", "web"]);
}

main();
