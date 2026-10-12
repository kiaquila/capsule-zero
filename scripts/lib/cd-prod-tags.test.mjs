import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

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
