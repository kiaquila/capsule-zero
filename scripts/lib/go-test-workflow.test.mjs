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
import { parse } from "yaml";

const root = resolve(import.meta.dirname, "../..");
const workflow = parse(
  readFileSync(join(root, ".github/workflows/test.yml"), "utf8"),
);
const steps = workflow.jobs.test.steps;
const setup = steps.find((step) => step.uses?.startsWith("actions/setup-go@"));
const check = steps.find((step) => step.name === "Go vet + test (api)");

function runCheck(failVet = false, setupOutcome = "success") {
  const directory = mkdtempSync(join(tmpdir(), "go-test-policy-"));
  try {
    const log = join(directory, "calls.jsonl");
    const dockerLog = join(directory, "docker.json");
    writeFileSync(
      join(directory, "docker"),
      `#!${process.execPath}\nconst fs = require('node:fs');\nconst {spawnSync} = require('node:child_process');\nfs.writeFileSync(process.env.GO_POLICY_DOCKER_LOG, JSON.stringify(process.argv.slice(2)));\nconst result = spawnSync('bash', ['-euo', 'pipefail', '-c', process.argv.at(-1)], {env:process.env,stdio:'inherit'});\nprocess.exit(result.status ?? 1);\n`,
      { mode: 0o700 },
    );
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
        GO_POLICY_DOCKER_LOG: dockerLog,
        GO_SETUP_OUTCOME: setupOutcome,
        FAIL_VET: failVet ? "1" : "0",
      },
    });
    const calls = readFileSync(log, "utf8").trim().split("\n").map(JSON.parse);
    return {
      ...result,
      calls,
      docker: existsSync(dockerLog)
        ? JSON.parse(readFileSync(dockerLog, "utf8"))
        : [],
    };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test("required API checks use the exact module toolchain and execute vet plus tests", () => {
  assert.match(setup.uses, /^actions\/setup-go@[a-f0-9]{40}$/);
  assert.equal(setup.with["go-version-file"], "api/go.mod");
  assert.equal(setup.with["go-version"], undefined);
  assert.equal(setup.with["cache-dependency-path"], "api/go.sum");
  assert.equal(setup.id, "go");
  assert.equal(check.env.GO_SETUP_OUTCOME, "${{ steps.go.outcome }}");
  assert.equal(check.if, undefined);
  assert.equal(check["continue-on-error"], undefined);
  const result = runCheck();
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.docker, []);
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

test("an API vet failure fails both supported execution paths before package tests", () => {
  for (const setupOutcome of ["success", "failure"]) {
    const result = runCheck(true, setupOutcome);
    assert.notEqual(result.status, 0);
    assert.deepEqual(
      result.calls.map((call) => call.args),
      [["vet", "./..."]],
    );
  }
});

test("setup failure retains a real pinned ECR fallback that runs both checks", () => {
  const result = runCheck(false, "failure");
  assert.equal(result.status, 0, result.stderr);
  const version = readFileSync(join(root, "api/go.mod"), "utf8").match(
    /^go (\S+)$/m,
  )[1];
  assert.ok(
    result.docker.includes(
      `public.ecr.aws/docker/library/golang:${version}-bookworm`,
    ),
  );
  assert.ok(result.docker.includes("GOTOOLCHAIN=local"));
  assert.deepEqual(
    result.calls.map((call) => call.args),
    [
      ["vet", "./..."],
      ["test", "./..."],
    ],
  );
});
