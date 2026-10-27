import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { createHash } from "node:crypto";

import YAML from "yaml";

const workflow = YAML.parse(
  readFileSync(
    new URL("../../.github/workflows/cd-prod.yml", import.meta.url),
    "utf8",
  ),
);
const steps = workflow.jobs.build.steps;
const sha = "a".repeat(40);

function captureBuilds(buildOnly) {
  const directory = mkdtempSync(join(tmpdir(), "cz-cd-tags-"));
  const output = join(directory, "output");
  const calls = join(directory, "calls");
  writeFileSync(
    join(directory, "docker"),
    `#!${process.execPath}\nrequire('node:fs').appendFileSync(process.env.DOCKER_CALLS, JSON.stringify(process.argv.slice(2)) + '\\n');\n`,
    { mode: 0o700 },
  );
  const env = {
    ...process.env,
    PATH: `${directory}:${process.env.PATH}`,
    GITHUB_SHA: sha,
    GITHUB_OUTPUT: output,
    BUILD_ONLY: buildOnly,
    IMAGE_WEB: workflow.env.IMAGE_WEB,
    IMAGE_API: workflow.env.IMAGE_API,
    DOCKER_CALLS: calls,
  };
  try {
    execFileSync("bash", ["-c", steps.find((step) => step.id === "meta").run], {
      env,
    });
    const meta = Object.fromEntries(
      readFileSync(output, "utf8")
        .trim()
        .split("\n")
        .map((line) => {
          const separator = line.indexOf("=");
          return [line.slice(0, separator), line.slice(separator + 1)];
        }),
    );
    for (const image of ["web", "api"]) {
      const step = steps.find(
        (item) => item.name === `Build and push ${image} image`,
      );
      const stepEnv = Object.fromEntries(
        Object.entries(step.env).map(([key, value]) => {
          const outputMatch = value.match(
            /^\$\{\{ steps\.meta\.outputs\.(\w+) \}\}$/,
          );
          if (outputMatch) return [key, meta[outputMatch[1]]];
          assert.equal(value, "${{ github.event.inputs.build_only }}");
          return [key, buildOnly];
        }),
      );
      execFileSync("bash", ["-c", step.run], {
        env: {
          ...env,
          ...stepEnv,
        },
      });
    }
    return {
      meta,
      calls: readFileSync(calls, "utf8").trim().split("\n").map(JSON.parse),
    };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function valuesAfter(args, option) {
  return args.flatMap((value, index) =>
    value === option ? [args[index + 1]] : [],
  );
}

test("build-only cannot overwrite existing rollback SHA tags or shared caches", () => {
  const result = captureBuilds("true");
  for (const [index, image] of ["web", "api"].entries()) {
    const repository = workflow.env[`IMAGE_${image.toUpperCase()}`];
    assert.equal(result.meta[`image_${image}`], `${repository}:verify-${sha}`);
    assert.deepEqual(valuesAfter(result.calls[index], "--tag"), [
      `${repository}:verify-${sha}`,
    ]);
    assert.deepEqual(valuesAfter(result.calls[index], "--cache-to"), [
      `type=registry,ref=${repository}:verify-cache-${sha},mode=max`,
    ]);
    assert.ok(result.calls[index].includes("--push"));
  }
});

for (const [label, input] of [
  ["main push", ""],
  ["manual production build", "false"],
]) {
  test(`${label} keeps release SHA/prod tags and shared registry caches`, () => {
    const result = captureBuilds(input);
    for (const [index, image] of ["web", "api"].entries()) {
      const repository = workflow.env[`IMAGE_${image.toUpperCase()}`];
      assert.equal(result.meta[`image_${image}`], `${repository}:sha-${sha}`);
      assert.deepEqual(valuesAfter(result.calls[index], "--tag"), [
        `${repository}:sha-${sha}`,
        `${repository}:prod`,
      ]);
      assert.deepEqual(valuesAfter(result.calls[index], "--cache-to"), [
        `type=registry,ref=${repository}:buildcache,mode=max`,
      ]);
      assert.deepEqual(valuesAfter(result.calls[index], "--cache-from"), [
        `type=registry,ref=${repository}:buildcache`,
      ]);
    }
  });
}

for (const state of ["current", "stale", "unreadable"]) {
  test(`SSH deployment checks the installed root-owned wrapper (${state}) before invoking sudo`, () => {
    const directory = mkdtempSync(join(tmpdir(), "cz-cd-wrapper-"));
    const log = join(directory, "calls");
    const wrapper = new URL(
      "../../infra/scripts/capsule-zero-deploy",
      import.meta.url,
    );
    const expected = createHash("sha256")
      .update(readFileSync(wrapper))
      .digest("hex");
    try {
      mkdirSync(join(directory, "bin"));
      writeFileSync(
        join(directory, "bin/sha256sum"),
        `#!/bin/sh\nprintf '%s  wrapper\\n' '${expected}'\n`,
        { mode: 0o700 },
      );
      writeFileSync(
        join(directory, "bin/ssh"),
        `#!${process.execPath}
const fs = require('node:fs');
const args = process.argv.slice(2);
fs.appendFileSync(process.env.WRAPPER_TEST_LOG, JSON.stringify(args)+'\\n');
if (args.includes('sha256sum')) {
 if (process.env.WRAPPER_TEST_STATE === 'unreadable') process.exit(1);
 console.log((process.env.WRAPPER_TEST_STATE === 'current' ? process.env.WRAPPER_TEST_HASH : '0'.repeat(64))+'  /usr/local/sbin/capsule-zero-deploy');
}
`,
        { mode: 0o700 },
      );
      const deploy = workflow.jobs.deploy.steps.find(
        (step) => step.name === "Deploy over SSH",
      );
      const result = spawnSync(
        "bash",
        ["-c", deploy.run.replaceAll("~/.ssh", `'${directory}/ssh'`)],
        {
          encoding: "utf8",
          env: {
            ...process.env,
            PATH: `${directory}/bin:${process.env.PATH}`,
            WRAPPER_TEST_LOG: log,
            WRAPPER_TEST_HASH: expected,
            WRAPPER_TEST_STATE: state,
            SSH_KEY: "fixture-only",
            SSH_HOST: "fixture-host",
            SSH_USER: "fixture-user",
            KNOWN_HOSTS: "fixture-only",
            IMAGE_WEB_REF: `ghcr.io/kiaquila/capsule-zero-web:sha-${sha}`,
            IMAGE_API_REF: `ghcr.io/kiaquila/capsule-zero-api:sha-${sha}`,
            DEPLOY_SHA: sha,
            SYNC_HOST_NGINX: "true",
          },
        },
      );
      const calls = readFileSync(log, "utf8")
        .trim()
        .split("\n")
        .map(JSON.parse);
      assert.equal(result.status === 0, state === "current", result.stderr);
      assert.equal(calls[0].includes("sha256sum"), true);
      assert.equal(
        calls.some((args) => args.includes("sudo")),
        state === "current",
      );
      if (state === "stale")
        assert.match(result.stdout, /Installed deployment wrapper differs/);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
}
