import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { parse } from "yaml";

const root = resolve(import.meta.dirname, "../..");
const workflow = parse(
  readFileSync(join(root, ".github/workflows/test.yml"), "utf8"),
);
const steps = workflow.jobs.test.steps;
const setup = steps.find((step) => step.uses?.startsWith("actions/setup-go@"));
const check = steps.find((step) => step.name === "Go vet + test (api)");

function runCheck(failVet = false) {
  const directory = mkdtempSync(join(tmpdir(), "go-test-policy-"));
  try {
    const log = join(directory, "calls.jsonl");
    writeFileSync(
      join(directory, "go"),
      `#!${process.execPath}\nconst fs = require('node:fs');\nfs.appendFileSync(process.env.GO_POLICY_LOG, JSON.stringify({args:process.argv.slice(2),cwd:process.cwd(),toolchain:process.env.GOTOOLCHAIN})+'\\n');\nif (process.env.FAIL_VET === '1' && process.argv[2] === 'vet') process.exit(1);\n`,
      { mode: 0o700 },
    );
    const result = spawnSync("bash", ["-euo", "pipefail", "-c", check.run], {
      cwd: join(root, check["working-directory"]),
      encoding: "utf8",
      env: {
        ...process.env,
        ...check.env,
        PATH: `${directory}:${process.env.PATH}`,
        GO_POLICY_LOG: log,
        FAIL_VET: failVet ? "1" : "0",
      },
    });
    const calls = readFileSync(log, "utf8").trim().split("\n").map(JSON.parse);
    return { ...result, calls };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test("required API checks use the exact module toolchain and execute vet plus tests", () => {
  assert.match(setup.uses, /^actions\/setup-go@[a-f0-9]{40}$/);
  assert.equal(setup.with["go-version-file"], "api/go.mod");
  assert.equal(setup.with["go-version"], undefined);
  assert.equal(setup.with["cache-dependency-path"], "api/go.sum");
  assert.equal(check.if, undefined);
  assert.equal(check["continue-on-error"], undefined);
  const result = runCheck();
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(
    result.calls.map((call) => call.args),
    [
      ["vet", "./..."],
      ["test", "./..."],
    ],
  );
  assert.ok(
    result.calls.every(
      (call) => call.cwd === join(root, "api") && call.toolchain === "local",
    ),
  );
});

test("an API vet failure fails the required job before package tests", () => {
  const result = runCheck(true);
  assert.notEqual(result.status, 0);
  assert.deepEqual(
    result.calls.map((call) => call.args),
    [["vet", "./..."]],
  );
});
