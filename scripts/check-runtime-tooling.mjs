#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const requiredTools = [
  {
    name: "node",
    command: process.execPath,
    args: ["--version"],
    purpose: "repository scripts and Next.js tooling",
  },
  {
    name: "npm",
    command: "npm",
    args: ["--version"],
    purpose: "repository and app package scripts",
  },
  {
    name: "supabase",
    command: "supabase",
    args: ["--version"],
    purpose: "local migrations, storage policies, and pgTAP tests",
  },
  {
    name: "docker",
    command: "docker",
    args: ["--version"],
    purpose: "Supabase local stack containers",
  },
];

function parseArgs(argv = process.argv.slice(2)) {
  return {
    allowMissing: argv.includes("--allow-missing"),
  };
}

function run(tool) {
  const result = spawnSync(tool.command, tool.args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.error) {
    return {
      ok: false,
      output:
        result.error.code === "ENOENT" ? "not found" : result.error.message,
    };
  }

  if (result.status !== 0) {
    return {
      ok: false,
      output: (
        result.stderr ||
        result.stdout ||
        `exit ${result.status}`
      ).trim(),
    };
  }

  return {
    ok: true,
    output: (result.stdout || result.stderr).trim().split(/\r?\n/)[0],
  };
}

function main() {
  const args = parseArgs();
  const failures = [];

  console.log("Sprint 0 runtime tooling check");

  for (const tool of requiredTools) {
    const result = run(tool);
    const status = result.ok ? "ok" : "missing";
    console.log(`[${status}] ${tool.name}: ${result.output} (${tool.purpose})`);

    if (!result.ok) {
      failures.push(tool.name);
    }
  }

  if (failures.length > 0 && !args.allowMissing) {
    console.error(
      `Missing required runtime tooling: ${failures.join(", ")}. Install these before running runtime validation.`,
    );
    process.exit(1);
  }

  console.log("Runtime tooling check passed.");
}

main();
