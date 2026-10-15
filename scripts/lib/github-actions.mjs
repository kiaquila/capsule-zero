import { fetchWithRetry } from "./github-fetch.mjs";

const activeStatuses = new Set([
  "in_progress",
  "pending",
  "queued",
  "requested",
  "waiting",
]);
const prLinkedEvents = new Set([
  "pull_request",
  "pull_request_review",
  "workflow_dispatch",
]);

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
    throw new Error(
      `GitHub Actions request failed: ${response.status} ${await response.text()}`,
    );
  }

  return response;
};

export const restartAiReviewIfNeeded = async ({
  token,
  repository,
  headSha,
  prNumber,
  evidenceTime,
  activeWaitMs = 180000,
  fetchImpl = globalThis.fetch,
  sleepImpl = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
}) => {
  if (!token || !repository || !headSha) {
    throw new Error(
      "token, repository, and headSha are required to restart AI Review",
    );
  }

  const assertHead = async () => {
    if (!prNumber) return;
    const response = await request({
      token,
      url: `https://api.github.com/repos/${repository}/pulls/${prNumber}`,
      fetchImpl,
      sleepImpl,
    });
    const pull = await response.json();
    if (pull.state !== "open" || pull.head.sha !== headSha)
      throw new Error("PR head changed before AI Review restart");
  };
  await assertHead();
  const deadline = Date.now() + activeWaitMs;
  let run;
  // Wait for an active evaluator to consume the signal. If it finishes while
  // the wake-up is running, re-evaluate its terminal state rather than losing it.
  do {
    const response = await request({
      token,
      url: `https://api.github.com/repos/${repository}/actions/workflows/ai-review.yml/runs?head_sha=${encodeURIComponent(headSha)}&per_page=100`,
      fetchImpl,
      sleepImpl,
    });
    const { workflow_runs: runs = [] } = await response.json();
    run = runs
      .filter(
        (candidate) =>
          candidate.head_sha?.toLowerCase() === headSha.toLowerCase() &&
          prLinkedEvents.has(candidate.event) &&
          (!prNumber ||
            !candidate.pull_requests?.length ||
            candidate.pull_requests.some(
              (p) => String(p.number) === String(prNumber),
            )),
      )
      .sort((a, b) => (b.run_number || 0) - (a.run_number || 0))[0];
    if (!run)
      throw new Error(`No PR-linked AI Review run found for head ${headSha}`);
    if (!activeStatuses.has(run.status)) break;
    if (!evidenceTime || Date.now() >= deadline)
      return { action: "already-running", run };
    await sleepImpl(5000);
  } while (true);
  if (run.conclusion === "success")
    return { action: "already-successful", run };
  // Each evidence update can cause at most one rerun, including duplicate deliveries.
  if (
    evidenceTime &&
    Date.parse(run.run_started_at || run.created_at) >= evidenceTime
  ) {
    return { action: "already-evaluated", run };
  }
  await assertHead();
  await request({
    token,
    url: `https://api.github.com/repos/${repository}/actions/runs/${run.id}/rerun`,
    init: { method: "POST" },
    fetchImpl,
    sleepImpl,
  });
  return { action: "rerun-requested", run };
};
