import assert from "node:assert/strict";
import { test } from "node:test";

import { fetchWithRetry } from "./github-fetch.mjs";

const response = (status) => ({
  status,
  body: { cancel: async () => {} },
});

test("retries a transient network failure", async () => {
  let calls = 0;
  const delays = [];

  const result = await fetchWithRetry(
    "https://api.github.test",
    {},
    {
      baseDelayMs: 10,
      fetchImpl: async () => {
        calls += 1;
        if (calls === 1) {
          throw new TypeError("fetch failed");
        }
        return response(200);
      },
      sleepImpl: async (delay) => delays.push(delay),
    },
  );

  assert.equal(result.status, 200);
  assert.equal(calls, 2);
  assert.deepEqual(delays, [10]);
});

test("retries retryable GitHub status codes with exponential delay", async () => {
  const statuses = [503, 429, 200];
  const delays = [];

  const result = await fetchWithRetry(
    "https://api.github.test",
    {},
    {
      baseDelayMs: 5,
      fetchImpl: async () => response(statuses.shift()),
      sleepImpl: async (delay) => delays.push(delay),
    },
  );

  assert.equal(result.status, 200);
  assert.deepEqual(delays, [5, 10]);
});

test("does not retry a non-retryable response", async () => {
  let calls = 0;

  const result = await fetchWithRetry(
    "https://api.github.test",
    {},
    {
      fetchImpl: async () => {
        calls += 1;
        return response(404);
      },
      sleepImpl: async () => assert.fail("sleep should not be called"),
    },
  );

  assert.equal(result.status, 404);
  assert.equal(calls, 1);
});

test("fails closed after all network attempts are exhausted", async () => {
  let calls = 0;

  await assert.rejects(
    fetchWithRetry(
      "https://api.github.test",
      {},
      {
        attempts: 3,
        baseDelayMs: 1,
        fetchImpl: async () => {
          calls += 1;
          throw new TypeError("fetch failed");
        },
        sleepImpl: async () => {},
      },
    ),
    /fetch failed/,
  );

  assert.equal(calls, 3);
});
