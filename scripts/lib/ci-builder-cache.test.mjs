import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "../..");
const version = readFileSync(join(root, "api/go.mod"), "utf8").match(
  /^go (\S+)/m,
)[1];
function runSetup(options = {}) {
  const directory = mkdtempSync(join(tmpdir(), "ci-builder-cache-"));
  const log = join(directory, "calls.jsonl");
  try {
    writeFileSync(
      join(directory, "docker"),
      `#!${process.execPath}
const fs = require('node:fs');
const args = process.argv.slice(2);
fs.appendFileSync(process.env.BUILDER_TEST_LOG, JSON.stringify(args)+'\\n');
if (args[0] === 'info') console.log(JSON.stringify([['driver-type','io.containerd.snapshotter.v1']]));
if (args[0] === 'pull' && process.env.BUILDER_TEST_FAIL_PULL === '1') process.exit(1);
if (args[0] === 'run') console.log(process.env.BUILDER_TEST_VERSION);
`,
      { mode: 0o700 },
    );
    // A regression in the mock cannot restart or modify the host Docker daemon.
    writeFileSync(join(directory, "sudo"), "#!/bin/sh\nexit 99\n", {
      mode: 0o700,
    });
    const result = spawnSync(
      "bash",
      [join(root, "scripts/setup-ci-docker-builder.sh")],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          PATH: `${directory}:${process.env.PATH}`,
          GITHUB_ACTIONS: options.outsideRunner ? "false" : "true",
          RUNNER_OS: "Linux",
          BUILDER_TEST_LOG: log,
          BUILDER_TEST_VERSION: options.wrongVersion
            ? "go0.0.0"
            : `go${version}`,
          BUILDER_TEST_FAIL_PULL: options.failPull ? "1" : "0",
        },
      },
    );
    return {
      ...result,
      calls: existsSync(log)
        ? readFileSync(log, "utf8").trim().split("\n").map(JSON.parse)
        : [],
    };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test("runner warms the exact digest, verifies Go, and preserves the production FROM ref", () => {
  const result = runSetup();
  assert.equal(result.status, 0, result.stderr);
  const pull = result.calls.find(([command]) => command === "pull");
  assert.match(
    pull.at(-1),
    /^mirror\.gcr\.io\/library\/golang@sha256:[a-f0-9]{64}$/,
  );
  assert.deepEqual(
    result.calls.find(([command]) => command === "run"),
    [
      "run",
      "--rm",
      "--platform",
      "linux/amd64",
      pull.at(-1),
      "go",
      "env",
      "GOVERSION",
    ],
  );
  assert.deepEqual(
    result.calls.find(([command]) => command === "tag"),
    [
      "tag",
      pull.at(-1),
      `public.ecr.aws/docker/library/golang:${version}-bookworm`,
    ],
  );
});

test("failed download or wrong toolchain fails before the canonical tag is written", () => {
  for (const options of [{ failPull: true }, { wrongVersion: true }]) {
    const result = runSetup(options);
    assert.notEqual(result.status, 0);
    assert.equal(
      result.calls.some(([command]) => command === "tag"),
      false,
    );
  }
});

test("outside the authorized Linux runner no Docker operation is attempted", () => {
  const result = runSetup({ outsideRunner: true });
  assert.notEqual(result.status, 0);
  assert.deepEqual(result.calls, []);
});
