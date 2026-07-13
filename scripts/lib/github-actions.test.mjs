import assert from "node:assert/strict";
import { test } from "node:test";

import { restartAiReviewIfNeeded } from "./github-actions.mjs";

const jsonResponse = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
  text: async () => JSON.stringify(body),
});

const baseRun = {
  id: 101,
  run_number: 7,
  event: "pull_request",
  head_sha: "abc1234",
  html_url: "https://github.test/actions/runs/101",
};

test("leaves an active PR-linked AI Review run in place", async () => {
  const calls = [];
  const result = await restartAiReviewIfNeeded({
    token: "test-token",
    repository: "kiaquila/capsule-zero",
    headSha: "abc1234",
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return jsonResponse({ workflow_runs: [{ ...baseRun, status: "in_progress" }] });
    },
  });

  assert.equal(result.action, "already-running");
  assert.equal(calls.length, 1);
});

test("leaves a successful PR-linked AI Review run in place", async () => {
  const result = await restartAiReviewIfNeeded({
    token: "test-token",
    repository: "kiaquila/capsule-zero",
    headSha: "abc1234",
    fetchImpl: async () =>
      jsonResponse({
        workflow_runs: [{ ...baseRun, status: "completed", conclusion: "success" }],
      }),
  });

  assert.equal(result.action, "already-successful");
});

test("reruns the newest failed PR-linked AI Review run", async () => {
  const calls = [];
  const result = await restartAiReviewIfNeeded({
    token: "test-token",
    repository: "kiaquila/capsule-zero",
    headSha: "abc1234",
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      if ((init?.method || "GET") === "POST") {
        return jsonResponse({}, 201);
      }
      return jsonResponse({
        workflow_runs: [
          { ...baseRun, id: 99, run_number: 6, status: "completed", conclusion: "failure" },
          { ...baseRun, id: 101, run_number: 7, status: "completed", conclusion: "timed_out" },
        ],
      });
    },
  });

  assert.equal(result.action, "rerun-requested");
  assert.equal(result.run.id, 101);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].init.method, "POST");
  assert.match(calls[1].url, /\/actions\/runs\/101\/rerun$/);
});

test("fails closed when no PR-linked run exists for the head", async () => {
  await assert.rejects(
    restartAiReviewIfNeeded({
      token: "test-token",
      repository: "kiaquila/capsule-zero",
      headSha: "abc1234",
      fetchImpl: async () =>
        jsonResponse({
          workflow_runs: [
            { ...baseRun, event: "issue_comment" },
            { ...baseRun, head_sha: "def5678" },
          ],
        }),
    }),
    /No PR-linked AI Review run found for head abc1234/,
  );
});
