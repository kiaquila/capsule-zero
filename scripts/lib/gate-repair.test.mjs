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
      user: { login: "chatgpt-codex-connector[bot]" },
      created_at: "2026-10-15T20:01:00Z",
      body: `<!-- codex-review-receipt:v1 -->\n\nCodex Review: Didn't find any major issues.\n**Reviewed commit:** \`${sha.slice(0, 10)}\``,
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
        GATE_REPAIR_FIXTURE: dataPath,
        REPOSITORY: repository,
        ACTOR: "owner",
        OWNER: "owner",
        WORKFLOW_SHA: sha,
        GATE_SHA: sha,
        PR_NUMBER: "163",
        ...overrides,
      },
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test("actual PR-event repair guard accepts owner, exact head and prior native clean receipt", () => {
  assert.ok(workflow.on.pull_request.types.includes("labeled"));
  assert.equal(
    workflow.on.workflow_dispatch.inputs.trusted_gate_sha,
    undefined,
  );
  assert.equal(guard.env.GATE_SHA, "${{ github.event.pull_request.head.sha }}");
  assert.equal(guard.env.PR_NUMBER, "${{ github.event.pull_request.number }}");
  const result = runGuard(fixture());
  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    guard.if,
    "github.event_name == 'pull_request' && github.event.action == 'labeled' && github.event.label.name == 'codex-gate-repair'",
  );
  assert.equal(workflow.permissions.contents, "read");
  assert.equal(workflow.permissions["pull-requests"], "read");
  assert.equal(
    workflow.jobs["ai-review"].steps.find(
      (s) => s.name === "Checkout trusted gate scripts",
    ).with.ref,
    "${{ github.event_name == 'pull_request' && github.event.action == 'labeled' && github.event.label.name == 'codex-gate-repair' && github.event.pull_request.head.sha || github.event.repository.default_branch }}",
  );
});

test("repair guard rejects another actor, moved workflow SHA and malformed inputs", () => {
  for (const overrides of [
    { ACTOR: "collaborator" },
    { WORKFLOW_SHA: "b".repeat(40) },
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
        sha.slice(0, 10),
        "b".repeat(10),
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

test("repair guard rejects conflicting or duplicate receipt content", () => {
  for (const change of [
    (data) => (data.comments[1].body += "\nP1: unresolved issue"),
    (data) => (data.comments[1].body += `\n**Reviewed commit:** \`${sha}\``),
    (data) =>
      (data.comments[1].body = `<!-- codex-review-receipt:v1 -->\n${data.comments[1].body}`),
    (data) =>
      (data.comments[1].body = data.comments[1].body.replace(
        "Didn't find any major issues.",
        "Review in progress.",
      )),
  ]) {
    const data = fixture();
    change(data);
    assert.notEqual(runGuard(data).status, 0);
  }
});
