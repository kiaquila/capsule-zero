import assert from "node:assert/strict";
import { test } from "node:test";

import { publishCommitStatus } from "./github-status.mjs";

test("publishes the AI Review context on the requested head SHA", async () => {
  let request;
  const result = await publishCommitStatus({
    token: "test-token",
    repository: "kiaquila/capsule-zero",
    sha: "abc1234",
    state: "success",
    description: "Native Codex review passed",
    targetUrl: "https://github.test/actions/runs/1",
    fetchImpl: async (url, init) => {
      request = { url, init };
      return {
        ok: true,
        status: 201,
        json: async () => ({ id: 1 }),
      };
    },
    sleepImpl: async () => {},
  });

  assert.deepEqual(result, { id: 1 });
  assert.equal(
    request.url,
    "https://api.github.com/repos/kiaquila/capsule-zero/statuses/abc1234",
  );
  assert.equal(request.init.method, "POST");
  assert.deepEqual(JSON.parse(request.init.body), {
    state: "success",
    context: "AI Review",
    description: "Native Codex review passed",
    target_url: "https://github.test/actions/runs/1",
  });
});

test("rejects an unsupported status without calling GitHub", async () => {
  await assert.rejects(
    publishCommitStatus({
      token: "test-token",
      repository: "kiaquila/capsule-zero",
      sha: "abc1234",
      state: "neutral",
      fetchImpl: async () => assert.fail("fetch should not be called"),
    }),
    /Unsupported commit status state: neutral/,
  );
});

test("fails closed when GitHub rejects the status", async () => {
  await assert.rejects(
    publishCommitStatus({
      token: "test-token",
      repository: "kiaquila/capsule-zero",
      sha: "abc1234",
      state: "failure",
      fetchImpl: async () => ({
        ok: false,
        status: 403,
        text: async () => "forbidden",
      }),
    }),
    /Failed to publish AI Review status: 403 forbidden/,
  );
});
