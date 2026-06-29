#!/usr/bin/env node

import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const certsDir = resolve(root, "infra/dev-certs");
const host = "capsulezero.local";

function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: "inherit", cwd: root });
  if (result.error) {
    throw new Error(`${cmd} failed to launch: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(
      `${cmd} ${args.join(" ")} exited with status ${result.status}`,
    );
  }
}

function ensureMkcert() {
  const probe = spawnSync("mkcert", ["-CAROOT"], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (probe.error || probe.status !== 0) {
    throw new Error(
      [
        "mkcert is required but not available on PATH.",
        "Install it before running this script:",
        "  macOS:  brew install mkcert nss",
        "  Linux:  see https://github.com/FiloSottile/mkcert#installation",
      ].join("\n"),
    );
  }
}

try {
  ensureMkcert();

  console.log(
    "Installing mkcert root CA into the system trust store (idempotent)...",
  );
  run("mkcert", ["-install"]);

  mkdirSync(certsDir, { recursive: true });

  const certOut = resolve(certsDir, "cert.pem");
  const keyOut = resolve(certsDir, "key.pem");

  console.log(`Generating certificate for ${host} ...`);
  run("mkcert", [
    "-cert-file",
    certOut,
    "-key-file",
    keyOut,
    host,
    `*.${host}`,
    "localhost",
    "127.0.0.1",
    "::1",
  ]);

  console.log("");
  console.log(`OK  cert : ${certOut}`);
  console.log(`OK  key  : ${keyOut}`);
  console.log("");
  console.log("Next steps:");
  console.log(`  1. Make sure /etc/hosts contains:  127.0.0.1 ${host}`);
  console.log(
    "  2. docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build",
  );
  console.log(`  3. open https://${host}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
