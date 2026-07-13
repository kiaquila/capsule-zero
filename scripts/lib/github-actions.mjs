import { fetchWithRetry } from "./github-fetch.mjs";

const activeStatuses = new Set(["in_progress", "pending", "queued", "requested", "waiting"]);
const prLinkedEvents = new Set(["pull_request", "pull_request_review", "workflow_dispatch"]);

const request = async ({ token, url, init = {}, fetchImpl, sleepImpl }) => {
  const response = await fetchWithRetry(
    url,
    {
      ...init,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(init.headers || {}),
      },
    },
    { fetchImpl, ...(sleepImpl ? { sleepImpl } : {}) },
  );

  if (!response.ok) {
    throw new Error(`GitHub Actions request failed: ${response.status} ${await response.text()}`);
  }

  return response;
};

export const restartAiReviewIfNeeded = async ({
  token,
  repository,
  headSha,
  fetchImpl = globalThis.fetch,
  sleepImpl,
}) => {
  if (!token || !repository || !headSha) {
    throw new Error("token, repository, and headSha are required to restart AI Review");
  }

  const encodedSha = encodeURIComponent(headSha);
  const runsResponse = await request({
    token,
    url: `https://api.github.com/repos/${repository}/actions/workflows/ai-review.yml/runs?head_sha=${encodedSha}&per_page=100`,
    fetchImpl,
    sleepImpl,
  });
  const { workflow_runs: workflowRuns = [] } = await runsResponse.json();
  const run = workflowRuns
    .filter(
      (candidate) =>
        candidate.head_sha?.toLowerCase() === headSha.toLowerCase() &&
        prLinkedEvents.has(candidate.event),
    )
    .sort((left, right) => (right.run_number || 0) - (left.run_number || 0))[0];

  if (!run) {
    throw new Error(`No PR-linked AI Review run found for head ${headSha}`);
  }

  if (activeStatuses.has(run.status)) {
    return { action: "already-running", run };
  }

  if (run.conclusion === "success") {
    return { action: "already-successful", run };
  }

  await request({
    token,
    url: `https://api.github.com/repos/${repository}/actions/runs/${run.id}/rerun`,
    init: { method: "POST" },
    fetchImpl,
    sleepImpl,
  });

  return { action: "rerun-requested", run };
};
