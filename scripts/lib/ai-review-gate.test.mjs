import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
const sha = "a".repeat(40);
const body = `<!-- codex-review-receipt:v1 -->\n\nCodex Review: Didn't find any major issues. :rocket:\n\n**Reviewed commit:** \`${sha.slice(0, 10)}\``;
function runGate(overrides = {}) {
  const directory = mkdtempSync(join(tmpdir(), "codex-gate-"));
  try {
    writeFileSync(
      join(directory, "event.json"),
      JSON.stringify({ pull_request: { number: 163 } }),
    );
    writeFileSync(
      join(directory, "mock.mjs"),
      `
      const data = ${JSON.stringify({ sha, body, ...overrides })}; let pulls = 0;
      globalThis.fetch = async (url) => {
        let result;
        if (url.endsWith('/graphql')) result = {data:{repository:{pullRequest:{reviewThreads:{nodes:data.unresolved ? [{isResolved:false,comments:{nodes:[{author:{login:'chatgpt-codex-connector'}}]}}] : [],pageInfo:{hasNextPage:false}}}}}};
        else if (url.includes('/reviews?')) result = data.reviews || [];
        else if (url.includes('/issues/')) result = [{user:{login:data.author || 'chatgpt-codex-connector[bot]'},body:data.body,created_at:'2026-10-15T00:00:00Z'}];
        else if (url.includes('/commits/')) result = {sha:data.ambiguous ? 'b'.repeat(40) : data.sha};
        else if (url.includes('/comments?')) result = data.findings || [];
        else result = {head:{sha: ++pulls > 1 && data.race ? 'b'.repeat(40) : data.sha}};
        return new Response(JSON.stringify(result), {status:200,headers:{'content-type':'application/json'}});
      };
    `,
    );
    return spawnSync(
      process.execPath,
      ["--import", join(directory, "mock.mjs"), "scripts/ai-review-gate.mjs"],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          GITHUB_TOKEN: "test",
          GITHUB_REPOSITORY: "owner/repo",
          GITHUB_EVENT_PATH: join(directory, "event.json"),
          AI_REVIEW_HEAD_SHA: sha,
          AI_REVIEW_TRIGGER_MODE: "skip",
          AI_REVIEW_WAIT_MS: "80",
          AI_REVIEW_POLL_MS: "1",
        },
      },
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test("actual required gate accepts current native receipt and legacy response", () => {
  for (const value of [
    body,
    body.replace("<!-- codex-review-receipt:v1 -->\n\n", ""),
  ]) {
    const result = runGate({ body: value });
    assert.equal(result.status, 0, result.stderr);
  }
});
test("actual gate rejects race, unresolved old findings, stale or forged evidence and conflicting verdicts", () => {
  for (const value of [
    { race: true },
    { unresolved: true },
    { ambiguous: true },
    { author: "attacker" },
    { body: body.replace(sha.slice(0, 10), "b".repeat(10)) },
    {
      body: body.replace(
        "Didn't find any major issues.",
        "Review in progress.",
      ),
    },
    { body: body + "\nP1 issue" },
    { body: body.replace(/\*\*Reviewed commit:[\s\S]*/, "") },
  ]) {
    const result = runGate(value);
    assert.notEqual(result.status, 0, JSON.stringify(value));
  }
});
test("formal native reviews retain approval, severity and untagged-finding rules", () => {
  const review = {
    id: 1,
    commit_id: sha,
    user: { login: "chatgpt-codex-connector[bot]" },
    submitted_at: "2026-10-15T00:00:00Z",
    body: "Codex Review",
    state: "COMMENTED",
  };
  for (const priority of ["P0", "P1", "P2", "untagged"]) {
    assert.notEqual(
      runGate({
        reviews: [review],
        findings: [{ pull_request_review_id: 1, body: priority }],
      }).status,
      0,
    );
  }
  for (const value of [
    { reviews: [{ ...review, state: "APPROVED" }] },
    { reviews: [review] },
    {
      reviews: [review],
      findings: [{ pull_request_review_id: 1, body: "P3" }],
    },
  ]) {
    const result = runGate(value);
    assert.equal(result.status, 0, result.stderr);
  }
  assert.notEqual(
    runGate({ reviews: [{ ...review, state: "CHANGES_REQUESTED" }] }).status,
    0,
  );
  assert.notEqual(
    runGate({
      reviews: [{ ...review, state: "APPROVED" }],
      body: body + "\nP1 issue",
    }).status,
    0,
  );
  assert.notEqual(
    runGate({
      reviews: [
        { ...review, state: "CHANGES_REQUESTED" },
        {
          ...review,
          id: 2,
          state: "APPROVED",
          submitted_at: "2026-10-16T00:00:00Z",
        },
      ],
    }).status,
    0,
  );
});
