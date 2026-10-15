import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { parse } from "yaml";

const workflow = parse(
  readFileSync(
    new URL("../../.github/workflows/ai-review.yml", import.meta.url),
    "utf8",
  ),
);
const guard = workflow.jobs["ai-review"].steps.find(
  (step) => step.name === "Authorize reviewed gate repair",
);
const sha = "a".repeat(40);
const repository = "owner/repo";
const nativeState = (overrides = {}) =>
  `<!-- codex-pull-request-review-summary -->\n<!-- codex-review-state:v1 ${JSON.stringify(
    {
      code_review: {
        commit_sha: sha,
        status: "completed",
        has_any_findings: false,
        has_unresolved_findings: false,
        ...overrides,
      },
    },
  )} -->\n\n## Codex Review Summary`;
const fixture = () => ({
  pull: {
    state: "open",
    draft: false,
    head: { sha, repo: { full_name: repository } },
    base: { repo: { full_name: repository } },
  },
  comments: [
    {
      user: { type: "User" },
      author_association: "OWNER",
      body: `@codex review ${sha}`,
      created_at: "2026-10-15T20:00:00Z",
    },
    {
      id: 2,
      user: { login: "chatgpt-codex-connector[bot]" },
      created_at: "2026-10-15T20:01:00Z",
      body: nativeState(),
    },
  ],
});

function runGuard(data, overrides = {}) {
  const directory = mkdtempSync(join(tmpdir(), "gate-repair-test-"));
  try {
    const dataPath = join(directory, "fixture.json");
    writeFileSync(dataPath, JSON.stringify(data));
    writeFileSync(
      join(directory, "gh"),
      `#!${process.execPath}\nconst fs = require('node:fs');\nconst data = JSON.parse(fs.readFileSync(process.env.GATE_REPAIR_FIXTURE));\nprocess.stdout.write(JSON.stringify(process.argv.some(a => a.includes('/commits/')) ? {sha: process.env.GATE_SHA} : process.argv.includes('--paginate') ? [data.comments] : data.pull));\n`,
      { mode: 0o700 },
    );
    return spawnSync("bash", ["-euo", "pipefail", "-c", guard.run], {
      encoding: "utf8",
      env: {
        ...process.env,
        GH_TOKEN: "unused",
        PATH: `${directory}:${process.env.PATH}`,
        RUNNER_TEMP: directory,
        GITHUB_OUTPUT: join(directory, "output"),
        GATE_REPAIR_FIXTURE: dataPath,
        REPOSITORY: repository,
        ACTOR: "owner",
        OWNER: "owner",
        GATE_SHA: sha,
        PR_NUMBER: "163",
        ...overrides,
      },
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test("actual workflow repair guard accepts owner, exact head and completed native state", () => {
  const result = runGuard(fixture());
  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    guard.if,
    "github.event_name == 'pull_request' && github.event.action == 'labeled' && github.event.label.name == 'codex-gate-repair'",
  );
  assert.equal(workflow.permissions.contents, "read");
  // Every ordinary label must execute the required validator, never skip it
  // into a successful required-check result or cancel it without replacement.
  assert.ok(workflow.on.pull_request.types.includes("labeled"));
  assert.equal(
    workflow.jobs["ai-review"].if.replace(/\s+/g, " ").trim(),
    "github.event_name == 'workflow_dispatch' || (github.event_name == 'pull_request' && github.event.pull_request.draft == false) || github.event_name == 'pull_request_review'",
  );
  assert.equal(workflow.permissions["pull-requests"], "read");
  assert.equal(
    workflow.jobs["ai-review"].steps.find(
      (s) => s.name === "Checkout trusted gate scripts",
    ).with.ref,
    "${{ steps.repair.outputs.gate_sha || github.event.repository.default_branch }}",
  );
});

test("repair guard rejects another actor, moved event head and malformed inputs", () => {
  for (const overrides of [
    { ACTOR: "collaborator" },
    { GATE_SHA: "b".repeat(40) },
    { GATE_SHA: "a".repeat(10) },
    { PR_NUMBER: "1/../../other" },
  ]) {
    assert.notEqual(
      runGuard(fixture(), overrides).status,
      0,
      JSON.stringify(overrides),
    );
  }
});

test("repair guard rejects closed, draft, forked and changed-head PRs", () => {
  for (const change of [
    (data) => {
      data.pull.state = "closed";
    },
    (data) => {
      data.pull.draft = true;
    },
    (data) => {
      data.pull.head.repo.full_name = "attacker/fork";
    },
    (data) => {
      data.pull.base.repo.full_name = "another/repo";
    },
    (data) => {
      data.pull.head.sha = "b".repeat(40);
    },
  ]) {
    const data = fixture();
    change(data);
    assert.notEqual(runGuard(data).status, 0);
  }
});

test("repair guard rejects missing, untrusted, stale and pre-request review evidence", () => {
  for (const change of [
    (data) => {
      data.comments.shift();
    },
    (data) => {
      data.comments[0].author_association = "CONTRIBUTOR";
    },
    (data) => {
      data.comments[0].user.type = "Bot";
    },
    (data) => {
      data.comments[1].user.login = "forged-reviewer";
    },
    (data) => {
      data.comments[1].body = data.comments[1].body.replace(
        sha,
        "b".repeat(40),
      );
    },
    (data) => {
      data.comments[1].created_at = "2026-10-15T19:00:00Z";
    },
    (data) => {
      data.comments[1].body = "Codex Review Summary: Running";
    },
  ]) {
    const data = fixture();
    change(data);
    assert.notEqual(runGuard(data).status, 0);
  }
});

test("repair guard rejects non-clean, ambiguous and superseded native state", () => {
  for (const review of [
    { status: "running" },
    { status: "failed" },
    { has_any_findings: true },
    { has_unresolved_findings: true },
    { has_any_findings: null },
    { has_unresolved_findings: "false" },
    { has_any_findings: undefined },
    { commit_sha: sha.slice(0, 10) },
  ]) {
    const data = fixture();
    data.comments[1].body = nativeState(review);
    assert.notEqual(runGuard(data).status, 0, JSON.stringify(review));
  }
  for (const body of [
    nativeState().replace("state:v1", "state:v2"),
    nativeState().replace('"code_review":', '"security_review":'),
    nativeState() + "\n" + nativeState(),
    nativeState().replace('"status":"completed"', '"status":'),
    `<!-- codex-review-receipt:v1 -->\nCodex Review: Didn't find any major issues. Bravo.\n**Reviewed commit:** \`${sha}\``,
    `Codex Review: Didn't find any major issues. A serious regression remains.\n**Reviewed commit:** \`${sha}\``,
  ]) {
    const data = fixture();
    data.comments[1].body = body;
    assert.notEqual(runGuard(data).status, 0, body);
  }
  for (const latest of [{ status: "running" }, { has_any_findings: true }]) {
    const data = fixture();
    data.comments.push({
      ...data.comments[1],
      id: 3,
      updated_at: "2026-10-15T20:02:00Z",
      body: nativeState(latest),
    });
    assert.notEqual(
      runGuard(data).status,
      0,
      "Older clean state cannot override a newer result",
    );
  }
});
